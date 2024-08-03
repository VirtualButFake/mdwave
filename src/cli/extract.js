const { writeFileSync } = require('fs');
const extract = require('../util/extract');

module.exports = {
    command: 'extract <folder> [options..]',
    describe: 'Uses the Moonwave extractor to extract JSON data from a folder.',
    builder: (yargs) => {
        return yargs
            .positional('folder', {
                describe: 'The folder to extract from.',
                require: true,
            })
            .option('output', {
                alias: 'o',
                describe: 'The output file to write to.',
                default: 'output.json',
            });
    },
    handler: async (argv) => {
        const result = await extract(argv.folder);

        // write to output file
        writeFileSync(argv.output, JSON.stringify(result, null, 2));
    },
};
