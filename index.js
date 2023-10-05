#!/usr/bin/env node
const path = require("path")
global.appRoot = path.resolve(__dirname);

const yargs = require("yargs");

// load cfg
process.env["NODE_CONFIG_DIR"] =
	__dirname + "/config" + require("path").delimiter + "./";
process.env["HOST"] = "moonwave_convert";
require("config");

async function main() {
	yargs
		.scriptName("moonwave_convert")
		.usage("moonwave_convert <command> [options]")
		.commandDir("src/cli")
		.help(true).argv;
}

main();
