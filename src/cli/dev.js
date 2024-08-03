const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const sha1 = require('js-sha1');
const fc = require('filecompare');
const config = require('config-reloadable');

const extract = require('../util/extract');
const prepareJson = require('../util/prepareJson');

const outModes = require('../outModes');

const {
    installDependencies,
} = require('nypm');

const { exec } = require('child_process');

const run = async (cmd, cwd) => {
    const child = exec(
        cmd,
        {
            cwd: cwd || process.cwd(),
        },
        (err) => {
            if (err) { console.error(err) };
        }
    );
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stdout);
    await new Promise((resolve) => child.on('close', resolve));
};

function ThroughDirectory(Directory) {
    let Files = [];

    const dirFiles = fs.readdirSync(Directory);

    for (const file in dirFiles) {
        const Absolute = path.join(Directory, dirFiles[file]);
        if (fs.existsSync(Absolute) && fs.statSync(Absolute).isDirectory()) {
            Files = Files.concat(ThroughDirectory(Absolute));
        } else if (fs.existsSync(Absolute)) {
            Files.push(Absolute);
        }
    }

    return Files;
}

module.exports = {
    command: 'dev <folder>',
    describe:
        'Starts a development server for the documentation. Internally, this just watches the directory for changes and re-builds the documentation when it detects a change.',
    builder: (yargs) => {
        return yargs.positional('folder', {
            describe: 'The folder to extract from.',
            require: true,
        });
    },
    handler: async (argv) => {
        const watcher = chokidar.watch(process.cwd(), {
            ignored: /^\./,
            persistent: true,
        });

        const pathDiff = path.relative(process.cwd(), argv.folder);
        const result = await extract(argv.folder);

        // recursively iterate through all data
        // if we find a key that is "path" then overwrite it
        async function iterate(obj) {
            if (typeof obj == 'object') {
                if (Array.isArray(obj)) {
                    obj.forEach(iterate);
                } else {
                    for (const key in obj) {
                        if (key == 'path' && typeof obj[key] == 'string') {
                            obj[key] = path.join(pathDiff, obj[key]);
                        } else {
                            iterate(obj[key]);
                        }
                    }
                }
            }
        }

        iterate(result);

        let readme;
        let changelog;

        if (fs.existsSync(`${process.cwd()}/README.md`)) {
            readme = fs.readFileSync(`${process.cwd()}/README.md`, 'utf-8');
        }

        const changelogFile = fs
            .readdirSync(`${process.cwd()}`)
            .find((file) => file.toLowerCase().includes('changelog'));
        if (changelogFile) {
            changelog = fs.readFileSync(
                `${process.cwd()}/${changelogFile}`,
                'utf-8'
            );
        }

        const newJsonData = await prepareJson(result);

        // output
        const dir = await outModes.vitepress(
            newJsonData.typeLinks,
            newJsonData.sidebar,
            newJsonData.classes,
            newJsonData.settings,
            {
                readme,
                changelog,
            },
            false
        );

        console.log('Opening dev server from directory', dir);

        await installDependencies({
            cwd: dir,
            packageManager: {
                command: 'npm',
            },
        });

        let isRunning = false;
        let queued = false;
        const tempDir = path.join(global.appRoot, 'temp', sha1(dir), 'src');

        async function update() {
            if (isRunning) {
                queued = true;
                return;
            }

            let result;
            try {
                result = await extract(argv.folder);
            } catch (err) {
                console.log(
                    'Could not parse docs in project. Please check your syntax and try again. Error: ' +
                        err
                );
            }

            if (result == undefined) { return };

            // recursively iterate through EVERYTHING
            // if we find a key that is "path" then overwrite it
            async function iterate(obj) {
                if (typeof obj == 'object') {
                    if (Array.isArray(obj)) {
                        obj.forEach(iterate);
                    } else {
                        for (const key in obj) {
                            if (key == 'path' && typeof obj[key] == 'string') {
                                obj[key] = path.join(pathDiff, obj[key]);
                            } else {
                                iterate(obj[key]);
                            }
                        }
                    }
                }
            }

            iterate(result);

            let readme;
            let changelog;

            if (fs.existsSync(`${process.cwd()}/README.md`)) {
                readme = fs.readFileSync(`${process.cwd()}/README.md`, 'utf-8');
            }

            const changelogFile = fs
                .readdirSync(`${process.cwd()}`)
                .find((file) => file.toLowerCase().includes('changelog'));
            if (changelogFile) {
                changelog = fs.readFileSync(
                    `${process.cwd()}/${changelogFile}`,
                    'utf-8'
                );
            }

            // clear config cache
            try {
                global.config = config.reloadConfigs();
            } catch (err) {
                console.log('Could not reload config cache. Error: ' + err);
            }

            const newJsonData = await prepareJson(result);
            newJsonData.settings.tempDataOutput = tempDir;

            // output
            try {
                await outModes.vitepress(
                    newJsonData.typeLinks,
                    newJsonData.sidebar,
                    newJsonData.classes,
                    newJsonData.settings,
                    {
                        readme,
                        changelog,
                    },
                    false
                );
            } catch (err) {
                console.log(
                    'Could not output docs. Please check your syntax and try again. Error: ' +
                        err
                );
            }

            // this pushes into our temp folder; compare differences with current files
            // iterate files
            const files = await ThroughDirectory(
                newJsonData.settings.tempDataOutput
            );

            for (const file of files) {
                const relative = path.join(
                    pathDiff,
                    path.relative(newJsonData.settings.tempDataOutput, file)
                );
                // compare files
                if (fs.existsSync(path.join(dir, relative))) {
                    await fc(file, path.join(dir, relative), (result) => {
                        if (!result) {
                            if (path.basename(file, '.json') == 'config') {
                                fs.writeFileSync(
                                    path.join(dir, relative),
                                    fs.readFileSync(file)
                                );
                                return;
                            }

                            fs.writeFileSync(
                                path.join(dir, relative),
                                fs.readFileSync(file)
                            );
                        }
                    });
                } else {
                    fs.writeFileSync(
                        path.join(dir, relative),
                        fs.readFileSync(file)
                    );
                }
            }

            // handle queue
            isRunning = false;

            if (queued) {
                queued = false;
                update();
            }
        }

        // run vitepress dev server
        watcher.on('all', function (eventName, changePath) {
            if (eventName == 'change') {
                update();
            } else if (eventName == 'unlink') {
                const relative = path.relative(
                    path.join(process.cwd(), 'docs'),
                    changePath
                );
                const isChild =
                    relative &&
                    !relative.startsWith('..') &&
                    !path.isAbsolute(relative);

                if (isChild) {
                    fs.unlinkSync(path.join(dir, 'src', 'docs', relative));
                    update();
                }
            } else if (eventName == 'add') {
                const relative = path.relative(
                    path.join(process.cwd(), 'docs'),
                    changePath
                );
                const isChild =
                    relative &&
                    !relative.startsWith('..') &&
                    !path.isAbsolute(relative);

                if (isChild) {
                    fs.writeFileSync(
                        path.join(dir, 'src', 'docs', relative),
                        fs.readFileSync(changePath)
                    );
                    update();
                }
            }
        });

        await update(); // get the initial update out of the way, it's messy and causes issues sometimes
        await run('npm run docs:dev --open', dir);
    },
};
