<%*
/**
 * Meeting note within projects
 * 
 * @version 2
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Script, Projects, Obsidian, Templater } = await cJS();

tp = Templater.wrap(tp);

// Template info
Script.template.setInfo(tp);

// Include common template
tR += await tp.include("[[system.common]]");

let project = Projects.getProjectByFile()
           || Projects.getProjectByFile(
                Obsidian.workspace.getPreviousFile()
            );
let meeting_date = moment(tp.file.title, "[meeting.]YYYY-MM-DD");

const file_path = `${project.notePath}/${tp.file.title}`;
await Obsidian.vault.createFolder(project.notePath);
await tp.file.move(file_path);

tp.setFrontMatter({
    'project/main': project.link.setSourcePath(file_path).toString(),
});
-%>
```datacoretsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-project", "Navigation");
```
# Meeting Notes - <% meeting_date.format("YYYY/MM/DD") %>
Location: <% tp.file.cursor(1) %>
Attendees: <% tp.file.cursor(2) %>

<% tp.file.cursor(3) %>