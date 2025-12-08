<%*
const UPDATED_VERSION = 2;

const { Script } = await cJS();

tR = tp.file.content.replace(/^#.*[\r\n]+/m, "");

Script.template.setVersion(tp, UPDATED_VERSION);
-%>