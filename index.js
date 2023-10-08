#!/usr/bin/env node
const path = require("path");
global.appRoot = path.resolve(__dirname);

const yargs = require("yargs");

// load cfg
process.env["NODE_CONFIG_DIR"] =
	__dirname + "/config" + require("path").delimiter + "./";
process.env["HOST"] = "mdwave";
global.config = require("config-reloadable")();

async function main() {
	yargs
		.scriptName("mdwave")
		.usage("mdwave <command> [options]")
		.commandDir("src/cli")
		.help(true).argv;
}

main();
