const util = require("util");
const path = require("path");
const os = require("os")

const execFile = util.promisify(require("child_process").execFile);

function getBinaryExtension() {
	if (os.platform() === "win32") {
		return ".exe";
	}

	return "";
}

module.exports = async function (folder) {
	const os = require("os").platform()
	const result = await execFile(
		path.join(__dirname, `../../bin/${os}-moonwave-extractor${getBinaryExtension()}`),
		["extract", folder]
	);

	return JSON.parse(result.stdout);
};
