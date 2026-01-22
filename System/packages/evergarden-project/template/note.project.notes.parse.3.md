//<%*
tR = "";

const { Templates } = VPS.require("evergarden-templates");
tp = Templates.wrap(tp);

const metadata = app.metadataCache.getFileCache(tp.config.target_file);

tp.setParsed({
    frontmatter: tp.file.content.slice(0, metadata.sections[0].position.end.offset) + '\n',
    content: tp.file.content.slice(metadata.sections[2].position.start.offset)
});
//-%>