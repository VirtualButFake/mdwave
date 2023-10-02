const LuaTypeDef = require("./TypeDef");
const LuaProp = require("./Prop");
const LuaFunction = require("./Function");

const fs = require("fs");
const path = require("path");
const ClassSection = require("./ClassSection");

const markdownFile = fs.readFileSync(
	path.join(__dirname, "../markdown/Class.md"),
	"utf8"
);

const sections = [
	{
		name: "types",
		component: LuaTypeDef,
	},
	{
		name: "properties",
		component: LuaProp,
	},
	{
		name: "functions",
		component: LuaFunction,
	},
];

module.exports = async function (
	typeLinks,
	sidebarClassNames,
	luaClass,
	settings
) {
	sections.forEach((section) => {
		luaClass.class[section.name] = luaClass.class[section.name]
			.filter((member) => !member.ignore)
			.filter((member) => !member.private || showPrivate)
			.sort((memberA, memberB) => {
				if (!memberA.deprecated && memberB.deprecated) {
					return -1;
				} else if (memberA.deprecated && !memberB.deprecated) {
					return 1;
				} else {
					if (
						memberA.function_type === "static" &&
						memberB.function_type === "method"
					) {
						return -1;
					} else if (
						memberA.function_type === "method" &&
						memberB.function_type === "static"
					) {
						return 1;
					}
					return 0;
				}
			});
	});

	const extraTypes = new Map();
	const skipMembers = new Set();
	const typeOccurrences = new Map();

	for (const type of luaClass.class.types) {
		if (type.desc.length > 0) {
			continue;
		}

		for (const fn of luaClass.class.functions) {
			if (
				[...fn.params, ...fn.returns].some(({ lua_type }) =>
					lua_type.includes(type.name)
				)
			) {
				if (typeOccurrences.has(type)) {
					typeOccurrences.set(type, null);
				} else {
					typeOccurrences.set(type, fn);
				}
			}
		}
	}

	for (const [type, fn] of typeOccurrences) {
		if (!fn) {
			continue;
		}

		const types = extraTypes.get(fn) || [];
		extraTypes.set(fn, types);

		types.push(type);
		skipMembers.add(type);
	}

	const topTitle = luaClass.class.name;
	const deprecated = luaClass.class.deprecated
		? `This was deprecated in ${luaClass.deprecated.version}\n`
		: "";
	const desc = luaClass.class.desc + "\n<br>\n";
	const privateText =
		(luaClass.class.private &&
			"Private" + (((luaClass.class.tags && ",") || "") + "\n<br>\n" || "")) ||
		"";
	const tagText = `${privateText}${
		(luaClass.class.tags && luaClass.class.tags.join(", ") + " \n<br>\n") || ""
	}`;

	// create sections
	const sectionInfo = sections.map(async (section) => {
		return await ClassSection(
			luaClass.class,
			section,
			(member) => !skipMembers.has(member),
			section.component,
			settings.sourceUrl,
			extraTypes
		);
	});

	return markdownFile
		.replace("luaClass.TopTitle", topTitle)
		.replace("luaClass.isDeprecated", deprecated)
		.replace("luaClass.desc", desc)
		.replace("luaClass.tags", tagText)
		.replace("luaClass.sections", (await Promise.all(sectionInfo)).join("\n"));
};
