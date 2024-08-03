module.exports = async function (luaClass, member) {
    return `\`\`\`lua\n${luaClass.name}.${member.name}: ${member.lua_type}\n\`\`\``;
};
