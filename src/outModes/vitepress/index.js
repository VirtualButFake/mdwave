const fs = require("fs");
const path = require("path");
const process = require("process");
const yamlParser = require("json-to-pretty-yaml");

const config = require("config");

async function Property() {}

async function Function() {
	return fs.readFileSync(
		path.join(__dirname, "components/Function.md"),
		"utf-8"
	);
}

async function Type() {}

async function Member(settings, member, luaClass, extraTypes, memberPath, component) {
	let base = fs.readFileSync(
		path.join(__dirname, "components/Member.md"),
		"utf-8"
	);

	let memberContent = "";
	memberContent += await component(member, luaClass, extraTypes, memberPath);
	memberContent += member.desc != "" ? member.desc : "";
	base = base.replaceAll("$MEMBER_CONTENT$", memberContent);
	base = base.replaceAll("$MEMBERPATH$", memberPath);
	base = base.replace("$MEMBER_LINK$", `${settings.sourceUrl}/${member.source.path}#L${member.source.line}`)

	return base;
}

const capitalize = (text) => text[0].toUpperCase() + text.substring(1);

module.exports = async function (
	typeLinks,
	sidebarClassNames,
	luaClasses,
	settings
) {
	// make directory for markdown
	const basePath = path.join(process.cwd(), settings.output);
	const apiPath = path.join(basePath, "api");

	fs.mkdirSync(apiPath, { recursive: true });

	if (sidebarClassNames[0] == undefined) {
		throw new Error("No classes found in sidebarClassNames");
	}

	// create sidebar, navbar, footer & social links
	// default values:
	// API sidebar
	// GitHub (based on gitRepoButton)
	// NavBar API button
	const vitepressData = config.get("vitepress");
	let themeConfig = JSON.parse(JSON.stringify(vitepressData)); // deep copy vitepressData

	// inject data that we have available
	// github repo button
	if (config.has("gitRepoButton") && config.get("gitRepoButton")) {
		themeConfig.socialLinks.push({
			icon: "github",
			link: settings.gitRepo,
		});
	}

	// navbar api button
	if (themeConfig.nav.find((item) => item.text === "API")) {
		themeConfig.nav.push({
			text: "API",
			link: sidebarClassNames[0].href,
		});
	}

	// sidebar
	themeConfig.sidebar["api"] = sidebarClassNames.map((className) => {
		return {
			text: className.label,
			link: className.href,
		};
	});

	// create front matter for each class
	for (const luaClass of luaClasses) {
		// front matter for each class is basically just all data to be used in the file
		// so functions, etc
		// we have to define this before we run because its SSR
		let mdBase = fs.readFileSync(path.join(__dirname, "class.md"), "utf-8");

		// resolve important info
		const sections = [
			{
				name: "types",
				component: Type,
			},
			{
				name: "properties",
				component: Property,
			},
			{
				name: "functions",
				component: Function,
			},
		];
		const actualClass = luaClass.class;

		// Sort LuaClass body members
		sections.forEach((section) => {
			actualClass[section.name] = actualClass[section.name]
				.filter((member) => !member.ignore)
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

		// map all sections to a markdown string
		let sectionString = "";

		for (const section of sections) {
			let sectionBase = fs.readFileSync(
				path.join(__dirname, "components/Section.md"),
				"utf-8"
			);
			sectionBase = sectionBase.replace(
				"$SECTION_TITLE$",
				capitalize(section.name)
			);

			// iterate through members
			const members = actualClass[section.name];

			if (members.length == 0) {
				continue;
			}

			let memberString = "";

			for (const idx in members) {
				const member = members[idx];

				memberString += await Member(
					settings,
					member,
					actualClass,
					extraTypes.get(member),
					`.${section.name}[${idx}]`,
					section.component
				);
			}

			sectionString += sectionBase.replace("$SECTION_CONTENT$", memberString);
		}

		mdBase = mdBase.replace("$SECTION_LIST$", sectionString);

		// resolve Markdown() expressions
		const regex = new RegExp(/Markdown\((.*?)\)/g);

		for (const match of [...mdBase.matchAll(regex)]) {
			const str = match[1];
			let current = actualClass;
			// iterate throgh front matter
			eval(`current = current${str}`);
			if (current == undefined) {
				throw new Error(
					`Could not resolve chain ${str} in markdown file class.md`
				);
			}

			mdBase = mdBase.replace(match[0], current);
		}

		let extraTypesNew = {}

		for (const [_, fn] of typeOccurrences) {
			// map to function index
			for (const func of luaClass.class.functions) {
				if (func == fn) {
					extraTypesNew[luaClass.class.functions.indexOf(fn)] = extraTypes.get(fn)
				}
			}
		}

		const frontMatterObject = {
			typeLinks,
			settings,
			extraTypes: extraTypesNew,
			class: luaClass.class,
			outline:
				config.has("nestSections") && config.get("nestSections") ? [2, 3] : 2,
		};

		let frontMatter = yamlParser.stringify(frontMatterObject);

		fs.writeFileSync(
			`${apiPath}/${luaClass.name}.md`,
			mdBase
				.replace("$FRONT_MATTER$", frontMatter)
				.replace(
					"$CLASS_LINK$",
					`${settings.sourceUrl}/${luaClass.class.source.path}#L${luaClass.class.source.line}`
				)
		);
	}
};
