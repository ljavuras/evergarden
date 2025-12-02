<%*
const { Templater } = await cJS();

tp = Templater.wrap(tp);

const UPDATED_VERSION = 3;
const metadata = app.metadataCache.getFileCache(tp.config.target_file);
const projectState = metadata.tags
    .find(tagCache => tagCache.tag.startsWith("#project/")).tag
    .match(/^#project\/(?<state>.*)$/)
    .groups.state;

const projectNavigation =
`${"```dataviewjs"}
dv.view("System/script/Dataview/project/Navigation");
${"```"}`

let updatedContent =
    // Frontmatter
    tp.file.content.slice(0, metadata.sections[0].position.end.offset) + '\n'
    // Project navigation (new in version 3)
    + projectNavigation + '\n'
    // Rest of the file
    + tp.file.content.slice(metadata.sections[2].position.start.offset);

tp.setFrontMatter({
    'template/version': UPDATED_VERSION,
    'project/state': projectState,
});

tp.addTags(["a/project"]);

tR = updatedContent;
-%>