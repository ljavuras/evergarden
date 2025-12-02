<%*
const UPDATED_VERSION = 2;
const { Projects, Templater, Script } = await cJS();

tp = Templater.wrap(tp);

const project = Projects.getProjectByPath(tp.config.target_file.path);

const project_navigation = 
"```dataviewjs" + `
dv.view("System/script/Dataview/project/Navigation");
` + "```";

tR = tp.file.content.replace(/^### .*$/m, project_navigation);

tp.setFrontMatter({
    'project/main': project.link.setSourcePath(tp.config.target_file.path).toString(),
});
Script.template.setVersion(tp, UPDATED_VERSION);
-%>