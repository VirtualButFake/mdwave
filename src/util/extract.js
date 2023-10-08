const util = require("util");
const path = require("path");
const os = require("os");
const fs = require("fs");

const execFile = util.promisify(require("child_process").execFile);

function getBinaryExtension() {
	if (os.platform() === "win32") {
		return ".exe";
	}

	return "";
}

module.exports = async function (folder) {
	const os = require("os").platform();
	const pathToFile = path.join(
		__dirname,
		`../../bin/${os}-moonwave-extractor${getBinaryExtension()}`
	);

	if (os != "win32") {
		fs.chmodSync(pathToFile, 0o755);
	}

	const result = await execFile(pathToFile, ["extract", folder]);

	return JSON.parse(result.stdout);
};
