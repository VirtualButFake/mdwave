const fs = require("fs");
const path = require("path");

const ClassMember = require("./ClassMember");

const markdownFile = fs.readFileSync(
	path.join(__dirname, "../markdown/ClassSection.md"),
	"utf8"
);

const capitalize = (text) => text[0].toUpperCase() + text.substring(1);

module.exports = async (
	luaClass,
	section,
	filter,
	component,
	sourceUrl,
	extraTypes
) => {
	const members = luaClass[section.name].filter(filter || (() => true));

	if (members.length < 1) {
		return "";
	}

	const topTitle = capitalize(section.name);
	let memberString = "";

	const memberInfo = members.map(async (member, key) => {
		return (
			(await ClassMember(member, luaClass, component, sourceUrl, extraTypes)) +
			"\n"
		);
	});

	return markdownFile
		.replace("classSection.Title", topTitle)
		.replace("classSection.Members", (await Promise.all(memberInfo)).join("\n"));
};
