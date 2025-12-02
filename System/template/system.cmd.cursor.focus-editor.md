<%*
/**
 * Focus editor
 * 
 * Useful when creating note from template, Templater focuses on file title
 * instead of the note.
 * 
 * @author Ljavuras <ljavuras.py@gmail.com> 
 */

// Credits to szfkamil on Obsidian Forum
// https://forum.obsidian.md/t/how-to-move-cursor-to-body-on-file-creation/83416/2
tp.hooks.on_all_templates_executed(() => {
  app.workspace.activeLeaf.view.editor.focus();
});
-%>