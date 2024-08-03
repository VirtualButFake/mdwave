const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');

const process = require('process');
const ghp = require('gh-pages');

const yamlParser = require('json-to-pretty-yaml');
const frontMatter = require('yaml-front-matter');
const titleCase = require('to-title-case');

const sha = require('js-sha1');
const { installDependencies } = require('nypm');
const { exec } = require('child_process');
const SNIP = '<!--hide-readme-content-before-this-line-->';

async function replaceDir(orig, target, removeOld) {
    // recursively iterates through "orig" and pastes it at the same location in "target"
    // copying = reading file & writing to new location

    // check if target exists
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    if (fs.lstatSync(orig).isFile()) {
        fs.writeFileSync(target, fs.readFileSync(orig));
        return;
    }

    for (const file of fs.readdirSync(orig)) {
        const filePath = path.join(orig, file);
        const targetPath = path.join(target, file);

        if (fs.lstatSync(filePath).isDirectory()) {
            await replaceDir(filePath, targetPath);
        } else {
            fs.writeFileSync(targetPath, fs.readFileSync(filePath));
        }
    }

    // remove files that aren't found in original
    if (!removeOld) {
        return;
    }

    for (const file of fs.readdirSync(target)) {
        const filePath = path.join(orig, file);
        const targetPath = path.join(target, file);

        if (!fs.existsSync(filePath)) {
            try {
                fs.chmodSync(targetPath, 0o777);
                fs.rmSync(targetPath, { recursive: true });
            } catch (err) {
                console.log('Failed to remove file: ' + err);
            }
        }
    }
}

async function Property() {
    return fs.readFileSync(
        path.join(__dirname, 'components/Property.md'),
        'utf-8'
    );
}

async function Function(member) {
    let errorTable = '';

    if (member.errors) {
        // create github style table containing this data
        const base = '#### Errors \n| Type | Description |\n| --- | --- |\n';
        const newLine = '| $ERROR$ | $DESCRIPTION$ |\n';
        errorTable = base;

        for (const error of member.errors) {
            errorTable += newLine
                .replace('$ERROR$', error.lua_type)
                .replace('$DESCRIPTION$', error.desc);
        }
    }

    return fs
        .readFileSync(path.join(__dirname, 'components/Function.md'), 'utf-8')
        .replace('$ERROR_TABLE$', errorTable);
}

async function Type() {
    return fs.readFileSync(path.join(__dirname, 'components/Type.md'), 'utf-8');
}

async function Member(
    settings,
    member,
    luaClass,
    extraTypes,
    memberPath,
    component
) {
    let base = fs.readFileSync(
        path.join(__dirname, 'components/Member.md'),
        'utf-8'
    );

    let memberContent = '';
    memberContent += await component(member, luaClass, extraTypes, memberPath);
    memberContent += member.desc != '' ? '\n' + member.desc : '';
    base = base.replaceAll('$MEMBER_CONTENT$', memberContent);
    base = base.replaceAll('$MEMBERPATH$', memberPath);
    base = base.replace(
        '$MEMBER_LINK$',
        `${settings.sourceUrl}/${member.source.path}#L${member.source.line}`
    );

    return base;
}

const capitalize = (text) => text[0].toUpperCase() + text.substring(1);

const run = async (cmd) => {
    const child = exec(cmd, (err) => {
        if (err) {
            console.error(err);
        }
    });
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stdout);
    await new Promise((resolve) => child.on('close', resolve));
};

module.exports = async function (
    typeLinks,
    sidebarClassNames,
    luaClasses,
    settings,
    foundDocs,
    verbose
) {
    // make directory for markdown
    const basePath = path.join(process.cwd(), settings.output || 'temp');

    const pathHash = sha(basePath);
    const folderPath = path.join(global.appRoot, 'docSources', pathHash);

    const mdPath = settings.tempDataOutput || path.join(folderPath, 'src');
    const apiPath = path.join(mdPath, 'api');

    fs.mkdirSync(apiPath, { recursive: true });
    if (sidebarClassNames[0] == undefined) {
        throw new Error('No classes found in sidebarClassNames');
    }

    // create sidebar, navbar, footer & social links
    // default values:
    // API sidebar
    // GitHub (based on gitRepoButton)
    // NavBar API button
    let modifiableConfig = JSON.parse(JSON.stringify(global.config));
    let themeConfig = modifiableConfig.vitepress;
    //let themeConfig = JSON.parse(JSON.stringify(vitepressData)); // deep copy vitepressData

    // inject data that we have available
    // github repo button
    if (
        global.config.has('gitRepoButton') &&
        global.config.get('gitRepoButton')
    ) {
        settings.addGitButton = true;
        themeConfig.socialLinks.push({
            icon: 'github',
            link: settings.gitRepo,
        });
    }

    // navbar api button
    if (!themeConfig.nav.find((item) => item.text === 'API')) {
        themeConfig.nav.push({
            text: 'API',
            link: sidebarClassNames[0].href,
        });
    }

    // sidebar
    // map sidebarClassNames to custom sidebar groups (if specified)
    themeConfig.sidebar['api'] = [];

    let createdSectionSidebars = [];
    const sidebarPath = 'api';

    // iterate through all classes, check if they have any tags that we take interest in
    for (let luaClass of luaClasses) {
        let tags = luaClass.class.tags;
        const classSidebarData = sidebarClassNames.find(
            (element) => element.label == luaClass.name
        );

        let group = 'API';
        let isRoot = false;
        let title = luaClass.class.name;
        let position = 0;
        let indicesFound = [];

        for (const idx in tags) {
            const tag = tags[idx];
            const data = tag.split(' ');

            if (data[0] == 'group') {
                group = data[1];
                indicesFound.push(idx);
            } else if (data[0] == 'isRoot') {
                isRoot = (data[1] == 'true' && true) || false;
                indicesFound.push(idx);
            } else if (data[0] == 'title') {
                data.splice(0, 1);
                title = data.join(' ');
                indicesFound.push(idx);
            } else if (data[0] == 'position') {
                position = Number(data[1]) || 0;
                indicesFound.push(idx);
            }
        }

        // remove indices from tags list
        for (const idx of indicesFound) {
            tags.splice(idx, 1);
        }

        let groupSidebar = themeConfig.sidebar['api'].find(
            (item) => item.text === group
        );

        if (group.includes('/')) {
            const groups = group.split('/');

            // recursively create sidebars for each group, and add ourselves into the last one
            let currentGroup = themeConfig.sidebar[sidebarPath];
            let currentSidebar = null;

            for (const group of groups) {
                let groupSidebar = currentGroup.find(
                    (item) => item.text === group
                );

                if (groupSidebar == undefined) {
                    groupSidebar = {
                        text: group,
                        items: [],
                    };

                    currentGroup.push(groupSidebar);
                }

                currentGroup = groupSidebar.items;
                currentSidebar = groupSidebar;
            }

            groupSidebar = currentSidebar;
        }

        if (isRoot) {
            // so we can't guarantee that we're the first item to be inmserted
            // so we have to do a different check for root
            if (groupSidebar != undefined && groupSidebar.containsClass) {
                throw new Error(
                    'Tried to add sidebar element as root to a group that already had a class as root. Make sure that you don\'t have "isRoot" enabled on a sidebar element with more than 2 classes.'
                );
            }

            // insert self into current groupsidebar
            if (groupSidebar == undefined) {
                groupSidebar = {
                    text: title,
                    link: classSidebarData.href,
                    items: [],
                };

                themeConfig.sidebar[sidebarPath].push(groupSidebar);
            } else {
                groupSidebar.text = title;
                groupSidebar.link = classSidebarData.href;
            }

            continue;
        }

        if (groupSidebar == undefined) {
            groupSidebar = {
                text: group,
                items: [],
            };

            themeConfig.sidebar[sidebarPath].push(groupSidebar);
        }

        groupSidebar.items.push({
            text: title,
            link: classSidebarData.href,
            position: position,
        });

        groupSidebar.containsClass = true;
    }

    function sortSidebar(sidebar) {
        sidebar.items.sort((a, b) => {
            if (a.position > b.position) {
                return 1;
            } else if (a.position < b.position) {
                return -1;
            } else {
                return 0;
            }
        });

        for (const item of sidebar.items) {
            if (item.items) {
                sortSidebar(item);
            }
        }
    }

    for (const sidebar of themeConfig.sidebar['api']) {
        sortSidebar(sidebar);
    }

    for (const sidebar of createdSectionSidebars) {
        themeConfig.sidebar['api'].items.push(sidebar);
    }

    // map docs to markdown files
    // create front matter for each class
    for (const luaClass of luaClasses) {
        // front matter for each class is basically just all data to be used in the file
        // so functions, etc
        // we have to define this before we run because its SSR
        let mdBase = fs.readFileSync(path.join(__dirname, 'class.md'), 'utf-8');

        // resolve important info
        const sections = [
            {
                name: 'types',
                component: Type,
            },
            {
                name: 'properties',
                component: Property,
            },
            {
                name: 'functions',
                component: Function,
            },
        ];
        const actualClass = luaClass.class;

        // Sort LuaClass body members
        sections.forEach((section) => {
            actualClass[section.name] = actualClass[section.name]
                .filter((member) => !member.ignore)
                .sort((memberA, memberB) => {
                    if (!memberA.deprecated && memberB.deprecated) {
                        return -1;
                    } else if (memberA.deprecated && !memberB.deprecated) {
                        return 1;
                    } else {
                        if (
                            memberA.function_type === 'static' &&
                            memberB.function_type === 'method'
                        ) {
                            return -1;
                        } else if (
                            memberA.function_type === 'method' &&
                            memberB.function_type === 'static'
                        ) {
                            return 1;
                        }
                        return 0;
                    }
                });
        });

        const extraTypes = new Map();
        const skipMembers = new Set();
        const typeOccurrences = new Map();

        for (const type of luaClass.class.types) {
            if (type.desc.length > 0) {
                continue;
            }

            for (const fn of luaClass.class.functions) {
                if (
                    [...fn.params, ...fn.returns].some(({ lua_type }) =>
                        lua_type.includes(type.name)
                    )
                ) {
                    if (typeOccurrences.has(type)) {
                        typeOccurrences.set(type, null);
                    } else {
                        typeOccurrences.set(type, fn);
                    }
                }
            }
        }

        for (const [type, fn] of typeOccurrences) {
            if (!fn) {
                continue;
            }

            const types = extraTypes.get(fn) || [];
            extraTypes.set(fn, types);

            types.push(type);
            skipMembers.add(type);
        }

        // map all sections to a markdown string
        let sectionString = '';

        for (const section of sections) {
            let sectionBase = fs.readFileSync(
                path.join(__dirname, 'components/Section.md'),
                'utf-8'
            );
            sectionBase = sectionBase.replace(
                '$SECTION_TITLE$',
                capitalize(section.name)
            );

            // iterate through members
            const members = actualClass[section.name];

            let memberString = '';
            let validFound = false;

            for (const idx in members) {
                const member = members[idx];

                if (!skipMembers.has(member)) {
                    validFound = true;
                    memberString += await Member(
                        settings,
                        member,
                        actualClass,
                        extraTypes.get(member),
                        `.${section.name}[${idx}]`,
                        section.component
                    );
                }
            }

            if (!validFound) {
                continue;
            }

            sectionString += sectionBase.replace(
                '$SECTION_CONTENT$',
                memberString
            );
        }

        mdBase = mdBase.replace('$SECTION_LIST$', sectionString);

        // resolve Markdown() expressions
        const regex = new RegExp(/Markdown\((.*?)\)/g);

        for (const match of [...mdBase.matchAll(regex)]) {
            const str = match[1];
            let current = actualClass;
            // iterate throgh front matter
            eval(`current = current${str}`);
            if (current == undefined) {
                throw new Error(
                    `Could not resolve chain ${str} in markdown file class.md`
                );
            }

            mdBase = mdBase.replace(match[0], current);
        }

        let extraTypesNew = {};

        // eslint-disable-next-line no-unused-vars
        for (const [_, fn] of typeOccurrences) {
            // map to function index
            for (const func of luaClass.class.functions) {
                if (func == fn) {
                    extraTypesNew[luaClass.class.functions.indexOf(fn)] =
                        extraTypes.get(fn);
                }
            }
        }

        const frontMatterObject = {
            typeLinks,
            settings,
            extraTypes: extraTypesNew,
            class: luaClass.class,
            outline:
                global.config.has('nestSections') &&
                global.config.get('nestSections')
                    ? [2, 3]
                    : 2,
        };

        let frontMatter = yamlParser.stringify(frontMatterObject);

        fs.writeFileSync(
            `${apiPath}/${luaClass.name}.md`,
            mdBase
                .replace('$FRONT_MATTER$', frontMatter)
                .replace(
                    '$CLASS_LINK$',
                    `${settings.sourceUrl}/${luaClass.class.source.path}#L${luaClass.class.source.line}`
                )
        );
    }

    // iterate actions, replace api_path with first api url
    for (let action of themeConfig.actions) {
        if (action.href == 'api_path') {
            action.href = sidebarClassNames[0].href;
        }
    }

    // inject data into index.md
    let frontmatterHome = {
        layout: modifiableConfig.readmeAsHome ? 'doc' : 'page',
        actions: themeConfig.actions,
        features: themeConfig.features,
        title: modifiableConfig.title,
        description: modifiableConfig.description,
    };

    let index = fs
        .readFileSync(path.join(__dirname, 'index.md'), 'utf-8')
        .replace('$FRONTMATTER_HOME$', JSON.stringify(frontmatterHome));

    if (modifiableConfig.readmeAsHome) {
        const snip = foundDocs.readme.indexOf(SNIP);
        let readme = foundDocs.readme;
        if (snip > 0) {
            readme = readme.slice(snip + SNIP.length);
        }

        index = index.replace(
            '$README_DATA$',
            `<div class="vpdoc-home">\n\n${readme}\n</div>`
        );
        index = index.replace('$INCLUDE_HOME$', '');
    } else {
        index = index.replace('$README_DATA$', '');
        index = index.replace('$INCLUDE_HOME$', '<Home />');
    }

    fs.writeFileSync(`${mdPath}/index.md`, index);

    // create config
    // changelog page
    if (modifiableConfig.includeChangelog) {
        if (!foundDocs.changelog) {
            throw new Error(
                'includeChangelog was true, but no file containing "changelog" was found in the project directory.'
            );
        }

        let outline = JSON.stringify([2, 3]);

        if (modifiableConfig.changelogOutline) {
            outline = JSON.stringify(modifiableConfig.changelogOutline);
        }

        fs.writeFileSync(
            `${mdPath}/changelog.md`,
            `---\noutline: ${outline}\n---\n<div class="vpdoc-home">\n\n${foundDocs.changelog}\n</div>`
        );
        // add to navbar
        themeConfig.nav.push({
            text: 'Changelog',
            link: '/changelog',
        });
    }

    // generate src/docs if needed
    if (fs.existsSync(path.join(process.cwd(), 'docs'))) {
        async function iterateDocs(dir, sidebarPath) {
            let sidebar;

            for (const file of fs.readdirSync(dir)) {
                if (fs.lstatSync(path.join(dir, file)).isDirectory()) {
                    await iterateDocs(
                        path.join(dir, file),
                        sidebarPath + '/' + file
                    );
                    continue;
                }

                const filePath = path.join(dir, file);
                let frontmatter = null;

                try {
                    frontmatter = frontMatter.loadFront(
                        fs.readFileSync(filePath)
                    );
                } catch (err) {
                    console.log('Could not get front matter: ' + err);
                }

                const group =
                    frontmatter.group ||
                    (modifiableConfig.sidebarAliases &&
                        modifiableConfig.sidebarAliases[sidebarPath]) ||
                    titleCase(path.basename(sidebarPath));

                if (themeConfig.sidebar[sidebarPath] == undefined) {
                    themeConfig.sidebar[sidebarPath] = [];
                }

                sidebar = themeConfig.sidebar[sidebarPath];

                let groupSidebar = themeConfig.sidebar[sidebarPath].find(
                    (item) => item.text === group
                );

                // check if we're dealing with a situation where the group has multiple layers
                // (contains a /)
                if (group.includes('/')) {
                    const groups = group.split('/');

                    // recursively create sidebars for each group, and add ourselves into the last one
                    let currentGroup = themeConfig.sidebar[sidebarPath];
                    let currentSidebar = null;

                    for (const group of groups) {
                        let groupSidebar = currentGroup.find(
                            (item) => item.text === group
                        );

                        if (groupSidebar == undefined) {
                            groupSidebar = {
                                text: group,
                                items: [],
                            };

                            currentGroup.push(groupSidebar);
                        }

                        currentGroup = groupSidebar.items;
                        currentSidebar = groupSidebar;
                    }

                    groupSidebar = currentSidebar;
                }

                if (frontmatter.isRoot == true) {
                    // so we can't guarantee that we're the first item to be inmserted
                    // so we have to do a different check for root
                    if (
                        groupSidebar != undefined &&
                        groupSidebar.containsClass
                    ) {
                        throw new Error(
                            'Tried to add sidebar element as root to a group that already had a class as root. Make sure that you don\'t have "isRoot" enabled on a sidebar element with more than 2 classes.'
                        );
                    }

                    // insert self into current groupsidebar
                    if (groupSidebar == undefined) {
                        groupSidebar = {
                            text:
                                frontmatter.title ||
                                titleCase(path.basename(file, '.md')),
                            link:
                                sidebarPath + '/' + path.basename(file, '.md'),
                            items: [],
                        };

                        themeConfig.sidebar[sidebarPath].push(groupSidebar);
                    } else {
                        groupSidebar.text =
                            frontmatter.title ||
                            titleCase(path.basename(file, '.md'));
                        groupSidebar.link = classSidebarData.href;
                    }

                    continue;
                }

                if (groupSidebar == undefined) {
                    groupSidebar = {
                        text: group,
                        items: [],
                    };

                    themeConfig.sidebar[sidebarPath].push(groupSidebar);
                }

                // add self into group
                groupSidebar.items.push({
                    text:
                        frontmatter.title ||
                        titleCase(path.basename(file, '.md')),
                    link: sidebarPath + '/' + path.basename(file, '.md'),
                    position: frontmatter.position || 0,
                });
            }

            // recursively sort all items in the sidebar based on their "position" key
            if (sidebar) {
                for (const subSidebar of sidebar) {
                    sortSidebar(subSidebar);
                }
            }
        }

        await iterateDocs(path.join(process.cwd(), 'docs'), 'docs');

        // clone docs folder into base
        // remove old folder if exists
        replaceDir(
            path.join(process.cwd(), 'docs'),
            path.join(mdPath, 'docs'),
            true
        );
    } else {
        // remove docs folder if we have a temp
        if (
            settings.tempDataOutput &&
            fs.existsSync(path.join(mdPath, 'docs'))
        ) {
            fs.rmSync(path.join(mdPath, 'docs'), { recursive: true });
        }
    }

    if (settings.tempDataOutput == undefined) {
        fs.writeFileSync(
            `${folderPath}/config.json`,
            JSON.stringify(modifiableConfig)
        );

        for (const filePath of fs.readdirSync(path.join(__dirname, 'theme'))) {
            if (
                fs.lstatSync(path.join(__dirname, 'theme', filePath)).isFile()
            ) {
                fs.writeFileSync(
                    path.join(folderPath, filePath),
                    fs.readFileSync(path.join(__dirname, 'theme', filePath))
                );

                continue;
            }

            replaceDir(
                path.join(__dirname, 'theme', filePath),
                path.join(folderPath, filePath),
                true
            );
        }
    } else {
        fs.writeFileSync(
            path.join(settings.tempDataOutput, '../', 'config.json'),
            JSON.stringify(modifiableConfig)
        );
    }

    if (settings.output == undefined) {
        return folderPath;
    }

    // run npm i in project directory
    console.log(
        'Updating dependencies. If this is your first run, this may take a bit. Please wait...'
    );

    await installDependencies({
        cwd: folderPath,
        packageManager: {
            command: 'npm',
        },
    });

    // build vitepress
    const oldDir = process.cwd();
    process.chdir(folderPath);
    await run('npm run docs:build');

    // delete current folderi f exists
    if (fs.existsSync(basePath)) {
        fs.rmSync(basePath, { recursive: true });
    }

    if (verbose == undefined || verbose) {
        console.log('Moving files, or publishing to GitHub pages..');
    }

    if (settings.output != 'github-pages') {
        fsExtra.moveSync(path.join(folderPath, 'dist'), basePath, {
            overwrite: true,
        });
    } else {
        // publish to gh-pages
        process.chdir(oldDir);
        await ghp.publish(path.join(folderPath, 'dist'), function (err) {
            console.log('Failed to push to GitHub Pages:', err);
        });

        fs.rmSync(path.join(folderPath, 'dist'), { recursive: true });
    }
};
