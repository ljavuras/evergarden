<%*
/**
 * Subtopic note
 * When a note has format:
 *     title (domain)
 * 
 * Inserting this template, will perform the following actions:
 *     1. Creates ${title} alias (inserts into frontmatter if present)
 *     2. Inserts *This is a note about [[${domain}]].* at top of note
 */

let match = tp.file.title.match(/^\b([\S\s]+)\b \(\b([\S\s]+)\b\)$/);

if (match === null) {
	// Invalid title format
	new tp.obsidian.Notice(
`*Swnoflake Template Error:*
Note title should have format:
[title] ([domain])`);

	return;
}

// Valid title, insert template

const alias = match[1];
const domain = match[2];

var frontmatter = tp.file.content.match(/^---\n[\s\S]*?---(\n|$)/);
var content = tp.file.content.replace(/^---\n[\s\S]*?---(\n|$)/, "");

if (frontmatter !== null) {
	// Insert alias within existing frontmatter

	frontmatter = frontmatter[0];

	if (frontmatter.match(/aliases *:\n( *- *[\S ]+\n)+/) !== null) {
		// Aliases exists as multi-line array
		const aliasFormat = frontmatter.match(/aliases *:\n( *- *\b[\S ]+?\n)+/)[1];
		const aliasInsert = aliasFormat.replace(/^( *- *)\b([\s\S]+?)$/, "$1" + alias);
		frontmatter = frontmatter.replace(/(aliases *:\n)( *- *\b[\S ]+\n)+/, `$&${aliasInsert}\n`);
	} else if (frontmatter.match(/aliases *: +\[[\w "]+(,[\w "]+)+\]/) !== null) {
		// Aliases exists as single-line array
		frontmatter = frontmatter.replace(/(aliases *: +\[([\w "]+,)+)([\w "]+)\]/, `$1$3, ${alias}]`);
	} else {
		// No aliases exists
		// Create alias in frontmatter
		const aliasInsert = "$&aliases:\n  - " + alias + "\n";

		frontmatter = frontmatter.replace(/^---\n/, aliasInsert);
	}
} else {
	// No frontmatter found, create frontmatter
	frontmatter = `---
aliases:
- ${alias}
---
`;
}

// Update domain
if (content.match(/[*_]This is a note about \[\[([\s\S]+?)]]\.[*_]/) !== null) {
	// Replace previous domain
	content = content.replace(/[*_]This is a note about \[\[([\s\S]+?)]]\.[*_]/, `*This is a note about \[[${domain}]].*`);
} else {
	// No previous domain, add new domain
	content = `*This is a note about [[${domain}]].*` + "\n\n" + content;
}

const fileContent = frontmatter + content;

await this.app.vault.adapter.write(tp.file.path(true), fileContent);

%>