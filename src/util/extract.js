const util = require("util");
const path = require("path");

const execFile = util.promisify(require("child_process").execFile);

module.exports = async function (folder) {
	const result = await execFile(
		path.join(__dirname, "../../bin/moonwave-extractor"),
		["extract", folder]
	);

	return JSON.parse(result.stdout);
};
