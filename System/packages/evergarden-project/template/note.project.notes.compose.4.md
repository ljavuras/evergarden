//<%*
tR = "";

const { Templates } = VPS.require("evergarden-templates");
tp = Templates.wrap(tp);

const parsed = tp.getParsed();
if (!parsed) return;

tR = parsed.frontmatter + parsed.content;

tp.setVersion(4);
//-%>