module.exports = async function (luaClass, member) {
	if (member.name !== "__iter") {
		const separator = member.function_type == "static" ? "." : ":";
		const className = `${luaClass.name}${
			(member.name !== "__call" && separator + member.name) || ""
		}(`;

		const params = member.params;
		let paramShit =
			(params.length < 2 && !params[0]) || ![params[0].desc]
				? params[0] && [`${params[0].name}: ${params[0].lua_type}`]
				: params
						.map((param, index) => {
							return `    ${param.name}: ${param.lua_type}${
								(index !== params.length - 1 && ",") || ""
							} ${(param.desc && "-- " + param.desc) || ""}`;
						})
						.join("\n");

		paramShit += "\n)";

		let returnType = (member.returns.length !== 1 && "(") || "";
		returnType +=
			member.returns.length === 1
				? `${member.returns[0].lua_type} ${
						(member.returns[0].desc && "-- " + member.returns[0].desc) || ""
				  }`
				: member.returns
						.map((ret, index) => {
							return `${ret.lua_type} ${
								(index !== member.returns.length - 1 && ",") || ""
							}${(ret.desc && "-- " + ret.desc) || ""}`;
						})
						.join("");
		returnType += (member.returns.length !== 1 && ")") || "";

		return `\`\`\`lua\n${className}\n${paramShit} -> ${returnType}\n\`\`\``;
	}
};
