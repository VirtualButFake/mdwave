module.exports = async function (luaClass, member, extraTypes) {
	if (member.lua_type) {
		// type def
		return `\`\`\`lua\ntype ${member.name} = ${member.lua_type}\n\`\`\``;
	} else {
		// interface
		return `\`\`\`lua\ninterface ${member.name} {\n${member.fields.map(
			({ name, lua_type: luaType, desc }) => {
                return `    ${name}: ${luaType} ${(desc && "-- " + desc) || ""}`;
            }
		)}`;
	}
};
