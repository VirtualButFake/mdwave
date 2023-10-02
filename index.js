#!/usr/bin/env node

const yargs = require("yargs");

// load cfg
process.env["NODE_CONFIG_DIR"] =
	__dirname + "/config" + require("path").delimiter + "./";
process.env["HOST"] = "mdwave";
require("config");

async function main() {
	yargs
		.scriptName("mdwave")
		.usage("mdwave <command> [options]")
		.commandDir("src/cli")
		.help(true).argv;
}

main();
