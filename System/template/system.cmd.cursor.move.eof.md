<%*
/**
 * Moves cursor to end of file
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

tp.hooks.on_all_templates_executed(() => {
    let activeEditor = app.workspace
        .getActiveViewOfType(tp.obsidian.MarkdownView).editor;

    activeEditor.setCursor(activeEditor.lastLine());
})
-%>