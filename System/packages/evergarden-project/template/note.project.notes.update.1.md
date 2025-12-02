<%*
const UPDATED_VERSION = 3;

const { Projects, VaultError, Templater, Script } = await cJS();

tp = Templater.wrap(tp);
const current_path = tp.config.target_file.path;

const project_navigation =
"```dataviewjs" + `
dv.view("System/script/Dataview/project/Navigation");
` + "```";

const project = Projects.getProjectByPath(current_path);

tR = tp.file.content.replace(/(?<!^)(---(\r?\n|\r))/, "$1" + project_navigation + "$2");

tp.setFrontMatter({
    'project/main': project.link.setSourcePath(current_path).toString(),
});
Script.template.setVersion(tp, UPDATED_VERSION);
-%>