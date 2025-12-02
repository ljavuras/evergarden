<%*
/**
 * Kanban for projects
 * 
 * @version 1
 * @author Ljauvras <ljavuras.py@gmail.com>
 */

const { Templater, Script } = await cJS();

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");

Script.template.setInfo(tp);
tp.setFrontMatter({
    'kanban-plugin': "board",
})
-%>

## Backlog



## Ready



## In Progress



## Done





%% kanban:settings
```
{"kanban-plugin":"board","new-note-folder":"<% tp.file.folder(true) %>/notes"}
```
%%