//<%*
const { Templates, Templater } = await cJS();
const parsed = tp.parsed[tp.config.target_file.path];

if (!parsed) return;

tp = Templater.wrap(tp);
tp.setFrontMatter({
    [Templates.getFrontmatterKey('templateVersion')]: 4
});

tR = parsed.frontmatter + parsed.content;
//-%>