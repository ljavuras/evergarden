//<%*
tR = "";

const metadata = app.metadataCache.getFileCache(tp.config.target_file);

const parsed = {
    frontmatter: tp.file.content.slice(0, metadata.sections[0].position.end.offset) + '\n',
    content: tp.file.content.slice(metadata.sections[2].position.start.offset)
};

tp.parsed = { [tp.config.target_file.path]: parsed };
//-%>