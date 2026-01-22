<%*
/**
 * Project main page
 * 
 * @version 4
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
# <% projectName %>

<% tp.file.cursor() %>