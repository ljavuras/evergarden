<%*
const UPDATED_VERSION = 3;

const { Templater, Projects, Obsidian, Script } = await cJS();

tp = Templater.wrap(tp);

const current_path = tp.config.target_file.path;
const project = Projects.getProjectByPath(current_path);

const new_content = 
"```dataviewjs" + `
dv.view("System/script/Dataview/project/Navigation");
` + "```";

tR = tp.file.content.replace(/(\r?\n|\r)###.*$/m, new_content);

tp.setFrontMatter({
    'project/issue-tracker': new Obsidian.Link(project.issueTracker, current_path).toString(),
})
Script.template.setVersion(tp, UPDATED_VERSION);
-%>