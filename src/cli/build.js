const { readFileSync, existsSync, readdirSync } = require("fs");

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
				default: "dist",
			});
	},
	handler: async (argv) => {
		const result = await extract(argv.folder);

		let readme;
		let changelog;

		if (existsSync(`${argv.folder}/README.md`)) {
			readme = readFileSync(`${argv.folder}/README.md`, "utf-8");
		}

		const changelogFile = readdirSync(`${argv.folder}`).find((file) => file.toLowerCase().includes("changelog"))
		if (changelogFile) {
			changelog = readFileSync(`${argv.folder}/${changelogFile}`, "utf-8");
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
				changelog
			}
		);
	},
};
