module.exports = async function(luaClass, member, extraTypes) {
    return `\`\`\`lua\n${luaClass.name}.${member.name}: ${member.lua_type}\n\`\`\``;
}