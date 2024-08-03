const fs = require('fs');
const path = require('path');
const process = require('process');

const LuaClass = require('./components/classes/Class');

module.exports = async function (
    typeLinks,
    sidebarClassNames,
    luaClasses,
    settings
) {
    // make directory for markdown
    const basePath = path.join(process.cwd(), settings.output);
    const apiPath = path.join(basePath, 'api');

    fs.mkdirSync(apiPath, { recursive: true });

    // every class gets its own LuaClass
    for (const luaClass of luaClasses) {
        fs.writeFileSync(
            path.join(apiPath, luaClass.class.name) + '.md',
            await LuaClass(typeLinks, sidebarClassNames, luaClass, settings)
        );
    }
};
