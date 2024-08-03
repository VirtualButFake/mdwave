const { readFileSync, existsSync, readdirSync } = require('fs');
const path = require('path');

const extract = require('../util/extract');
const prepareJson = require('../util/prepareJson');

const outModes = require('../outModes');

module.exports = {
    command: 'build <folder> <mode> [options..]',
    describe: 'Extracts data from a folder and builds files based on the mode.',
    builder: (yargs) => {
        return yargs
            .positional('folder', {
                describe: 'The folder to extract from.',
                require: true,
            })
            .positional('mode', {
                describe: 'The mode to build in.',
                require: true,
                choices: Object.keys(outModes),
            })
            .option('output', {
                alias: 'o',
                describe: 'The output folder.',
                default: 'dist',
            });
    },
    handler: async (argv) => {
        // we assume that argv.folder is going to be purely the path for the code
        // so we add the difference between paths to the result
        const pathDiff = path.relative(process.cwd(), argv.folder);
        const result = await extract(argv.folder);

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

        if (existsSync(`${process.cwd()}/README.md`)) {
            readme = readFileSync(`${process.cwd()}/README.md`, 'utf-8');
        }

        const changelogFile = readdirSync(`${process.cwd()}`).find((file) =>
            file.toLowerCase().includes('changelog')
        );
        if (changelogFile) {
            changelog = readFileSync(
                `${process.cwd()}/${changelogFile}`,
                'utf-8'
            );
        }

        const newJsonData = await prepareJson(result);

        // output
        const mode = outModes[argv.mode];
        newJsonData.settings.output = argv.output;

        await mode(
            newJsonData.typeLinks,
            newJsonData.sidebar,
            newJsonData.classes,
            newJsonData.settings,
            {
                readme,
                changelog,
            }
        );
    },
};
