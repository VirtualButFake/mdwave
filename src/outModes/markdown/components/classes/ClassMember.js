const fs = require('fs');
const path = require('path');

const markdownFile = fs.readFileSync(
    path.join(__dirname, '../markdown/ClassMember.md'),
    'utf8'
);

module.exports = async function (
    member,
    luaClass,
    component,
    sourceUrl,
    extraTypes
) {
    const name = member.name;
    const header =
        name == '__iter'
            ? `Iterating over ${luaClass.name}`
            : `\`\`\`${name == '__call' ? luaClass.name + '()' : name}\`\`\``;
    const isPrivate = (member.private && 'Private \n<br>\n') || '';
    const yields = (member.yields && 'Yields \n<br>\n') || '';
    const readOnly = (member.readonly && 'Read only \n<br>\n') || '';
    const tags = (member.tags && member.tags.join(', ') + ' \n<br>\n') || '';
    let timeDetails = '';

    if (member.since && !member.deprecated) {
        timeDetails = `Added in ${member.since} \n<br>\n`;
    } else if (member.deprecated && !member.since) {
        timeDetails = `Deprecated in ${member.deprecated.version} \n<br>\n`;
    } else if (member.since && member.deprecated) {
        timeDetails = `Added in ${member.since}, deprecated in ${member.deprecated.version} \n<br>\n`;
    } else if (member.unreleased && !member.deprecated) {
        timeDetails = `Unreleased \n<br>\n`;
    }

    const url = `\n[Link to code](${sourceUrl}/${member.source.path}#L${member.source.line})  \n<br>\n`;

    // compute component
    const componentData = (await component(luaClass, member, extraTypes)) || '';

    return markdownFile
        .replace('member.header', header)
        .replace(
            'member.desc',
            member.desc + ' \n<br>\n' || 'No description provided. \n<br>\n'
        )
        .replace('member.isPrivate', isPrivate)
        .replace('member.yields', yields)
        .replace('member.readOnly', readOnly)
        .replace('member.tags', tags)
        .replace('member.timeDetails', timeDetails)
        .replace('member.url', url)
        .replace('member.component', componentData);
};
