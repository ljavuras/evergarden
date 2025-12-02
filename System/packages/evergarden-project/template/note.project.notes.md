<%*
/**
 * Project notes
 * 
 * @version 3
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Script, Projects, Obsidian, Templater } = await cJS();

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");

// Template info
Script.template.setInfo(tp);

let project = Projects.getProjectByFile(
        Obsidian.workspace.getPreviousFile()
    ) ||
    Projects.getProjectByFile();

const file_path = `${project.notePath}/${tp.file.title}`;
await Obsidian.vault.createFolder(project.notePath);
await tp.file.move(file_path);

tp.setFrontMatter({
    'project/main': project.link.setSourcePath(file_path).toString(),
});

// Moves cursor to end of file
await tp.include("[[system.cmd.cursor.move.eof]]", false);
-%>
```datacoretsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-project", "Navigation");
```
# <% tp.file.title %>

