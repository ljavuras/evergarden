<%*
/**
 * Project main page
 * 
 * @version 3
 * @author Ljauvras <ljavuras.py@gmail.com>
 */

const { Script, Obsidian, Templater } = await cJS();

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");

Script.template.setInfo(tp);
tp.setFrontMatter({ 'project/state': "active" });
tp.addTags(['a/project']);

let projectName = tp.file.title;
-%>
```datacoretsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-project", "Navigation");
```
# <% projectName %>

<% tp.file.cursor() %>