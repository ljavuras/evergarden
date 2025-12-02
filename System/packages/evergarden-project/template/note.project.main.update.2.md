<%*
const { Templater, Projects } = await cJS();

tp = Templater.wrap(tp);

const UPDATED_VERSION = 3;
const metadata = app.metadataCache.getFileCache(tp.config.target_file);
const projectState = metadata.tags
    .find(tagCache => tagCache.tag.startsWith("#project/")).tag
    .match(/^#project\/(?<state>.*)$/)
    .groups.state;
const projectName = tp.config.target_file.basename;

const projectNavigation =
`${"```datacoretsx"}
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-project", "Navigation");
${"```"}`

let updatedContent =
    // Frontmatter
    tp.file.content.slice(0, metadata.sections[0].position.end.offset) + '\n'
    // Project navigation (new in version 3)
    + projectNavigation + '\n'
    // Project title
    + tp.file.content.slice(
        metadata.sections[2].position.start.offset,
        metadata.sections[2].position.end.offset
    ) + '\n'
    // Rest of the file
    + (metadata.sections.length > 4?
        tp.file.content.slice(metadata.sections[4].position.start.offset):
        '');

tp.setFrontMatter({
    'template/version': UPDATED_VERSION,
    'project/state': projectState,
    'project/issue-tracker': `[[Issues - ${projectName}]]`,
    'project/kanban': `[[Kanban - ${projectName}]]`,
});

tp.addTags(["a/project"]);

tR = updatedContent;
-%>