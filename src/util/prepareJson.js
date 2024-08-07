// prepares JSON for building
const parseGitConfig = require('parse-git-config');

const generateRobloxTypes = require('./robloxTypes');

const capitalize = (text) => text[0].toUpperCase() + text.substring(1);

const mapLinks = (nameSet, items) =>
    items.map((name) => {
        if (!nameSet.has(name)) {
            throw new Error(
                `Moonwave plugin: "${name}" listed in classOrder option does not exist`
            );
        }

        return {
            type: 'link',
            href: `api/${name}`,
            label: name,
        };
    });

function parseSimpleClassOrder(content, classOrder, nameSet) {
    const listedLinks = mapLinks(nameSet, classOrder);

    const unlistedLinks = content
        .map((luaClass) => luaClass.name)
        .filter((name) => !classOrder.includes(name))
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({
            type: 'link',
            href: `api/${name}`,
            label: name,
        }));

    return [...listedLinks, ...unlistedLinks];
}

function parseSectionalClassOrder(content, classOrder, nameSet) {
    const listedNames = classOrder.flatMap((section) => section.classes);

    const listedSidebar = [];
    classOrder.forEach((element) => {
        if (element.section) {
            listedSidebar.push({
                type: 'category',
                label: element.section,
                collapsible: true,
                collapsed: element.collapsed ?? true,
                items: mapLinks(nameSet, element.classes),
            });
        } else {
            listedSidebar.push(...mapLinks(nameSet, element.classes));
        }
    });

    const unlistedSidebar = content
        .map((luaClass) => luaClass.name)
        .filter((name) => !listedNames.includes(name))
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({
            type: 'link',
            href: `api/${name}`,
            label: name,
        }));

    return [...listedSidebar, ...unlistedSidebar];
}

function parseClassOrder(content, classOrder, nameSet) {
    if (classOrder.length === 0) {
        return [...nameSet].sort().map((name) => ({
            type: 'link',
            href: `api/${name}`,
            label: name,
        }));
    }

    if (typeof classOrder[0] === 'string') {
        // Handles simple classOrder array assignment
        return parseSimpleClassOrder(content, classOrder, nameSet);
    } else {
        // Handles cases where classOrder is assigned via TOML tables
        return parseSectionalClassOrder(content, classOrder, nameSet);
    }
}

async function generateTypeLinks(nameSet, luaClasses) {
    const classNames = {};

    nameSet.forEach((name) => (classNames[name] = `api/${name}`));

    const classTypesNames = luaClasses
        .filter((luaClass) => luaClass.types.length > 0)
        .forEach((luaClass) =>
            luaClass.types.forEach(
                (type) =>
                    (classNames[type.name] = `api/${
                        luaClass.name
                    }#${type.name}`)
            )
        );

    const robloxTypes = await generateRobloxTypes();

    const typeLinks = {
        ...robloxTypes, // The Roblox types go first, as they can be overwritten if the user has created their own classes and types with identical names
        ...classNames,
        ...classTypesNames,
    };

    return typeLinks;
}

function getGitRepoUrl() {
    const gitConfig = parseGitConfig.sync();

    if (gitConfig) {
        if (gitConfig['remote "origin"']?.url?.includes('git@')) {
            const [, repoHostSite, repoAuthor, repoName] = gitConfig[
                'remote "origin"'
            ]?.url
                .replace(/\.git$/, '')
                .match(/^git@+(.+):(.+)\/(.+)$/);
            return `https://${repoHostSite}/${repoAuthor}/${repoName}`;
        } else {
            return gitConfig['remote "origin"']?.url
                ?.replace(/\.git$/, '')
                ?.replace(/\/\/.*@/, '//'); // Strip out http basic auth if present
        }
    }
}

module.exports = async function (data) {
    const filteredContent = data.filter((luaClass) => !luaClass.ignore);

    filteredContent.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        } else if (a.name > b.name) {
            return 1;
        } else {
            return 0;
        }
    });

    const nameSet = new Set();
    filteredContent.forEach((luaClass) => nameSet.add(luaClass.name));

    const classOrder = global.config.get('classOrder');

    if (global.config.has('autoSectionPath')) {
        if (
            classOrder.length > 0 &&
            !classOrder.every((item) => typeof item === 'object')
        ) {
            throw new Error(
                'When using autoSectionPath, classOrder cannot contain bare string keys.' +
                    'Use sectional style instead: https://eryn.io/moonwave/docs/Configuration#sections'
            );
        }

        const prefix = global.config.get('autoSectionPath');

        for (const luaClass of filteredContent) {
            if (luaClass.source.path.startsWith(prefix)) {
                const classPath = luaClass.source.path.slice(prefix.length + 1);

                const nextDirMatch = classPath.match(/^(.+?)\//);

                if (nextDirMatch) {
                    const nextDir = nextDirMatch[1];

                    // convert kebab-case, camelCase, PascalCase to Title Case
                    const title = nextDir
                        .replace(/(?<!-)([A-Z])/g, ' $1')
                        .replace('-', ' ')
                        .split(/\s+/)
                        .filter((str) => str.length > 0)
                        .map(capitalize)
                        .join(' ');

                    const existingSection = classOrder.find(
                        (section) => section.section === title
                    );

                    if (existingSection) {
                        existingSection.classes.push(luaClass.name);
                    } else {
                        classOrder.push({
                            section: title,
                            classes: [luaClass.name],
                        });
                    }
                }
            }
        }
    }

    const allLuaClassNamesOrdered = parseClassOrder(
        filteredContent,
        classOrder,
        nameSet
    );

    const sidebarClassNames = allLuaClassNamesOrdered;

    const typeLinksData = await generateTypeLinks(
        nameSet,
        filteredContent,
        global.config.get('baseUrl')
    );

    // extract all classes
    const gitRepoUrl = global.config.has('gitRepoUrl')
        ? global.config.get('gitRepoUrl')
        : getGitRepoUrl();
    let returnData = {
        typeLinks: typeLinksData,
        sidebar: sidebarClassNames,
        classes: [],
        settings: {
            gitRepo: gitRepoUrl,
            sourceUrl:
                gitRepoUrl &&
                gitRepoUrl +
                    `/blob/${
                        global.config.has('gitSourceBranch')
                            ? global.config.get('gitSourceBranch')
                            : 'master'
                    }`,
        },
    };

    for (const luaClass of filteredContent) {
        // sort sections in luaclass
        const sections = ['functions', 'properties', 'types'];

        for (const section of sections) {
            luaClass[section].sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                } else if (a.name > b.name) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }

        returnData.classes.push({
            name: luaClass.name,
            class: luaClass,
        });
    }

    return returnData;
};
