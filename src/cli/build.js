const { writeFileSync } = require("fs");

const extract = require("../util/extract");
const prepareJson = require("../util/prepareJson");

const outModes = require("../outModes");

module.exports = {
	command: "build <folder> <mode> [options..]",
	describe: "Extracts data from a folder and builds files based on the mode.",
	builder: (yargs) => {
		return yargs
			.positional("folder", {
				describe: "The folder to extract from.",
				require: true,
			})
			.positional("mode", {
				describe: "The mode to build in.",
				require: true,
				choices: Object.keys(outModes),
			})
			.option("output", {
				alias: "o",
				describe: "The output folder.",
				default: "output",
			});
	},
	handler: async (argv) => {
		const result = await extract(argv.folder);
		const newJsonData = await prepareJson(result);

		// output
		const mode = outModes[argv.mode];
		newJsonData.settings.output = argv.output;

		const output = await mode(
			newJsonData.typeLinks,
			newJsonData.sidebar,
			newJsonData.classes,
			newJsonData.settings
		);
	},
};
