/**
 * TaskLisk widget built upon Dataview plugin
 * 
 * @author ljavuras <ljavuras.py@gmail.com>
 */

/**
 * @name input
 * @type {Object}
 * @property {HTMLElement}         containerEl   - Container to render within
 * @property {Grouping<SListItem>} tasks         - Dataview tasks to render
 * @property {String}              title         - Tasklist title
 * @property {String}              content       - Additional content to display
 * @property {String}              errorMarkdown - Error message in markdown
 */

const { Obsidian } = await cJS();

let containerEl = input.containerEl.createEl("fieldset", { cls: "widget__taskList" });

// Render within containerEl, creates local DataviewContext
// FIXME: unload component when rerender
local_dv = app.plugins.plugins['dataview'].localApi(
    dv.currentFilePath,
    dv.component,
    containerEl
);

// Render TaskList
if (input.title)   {
    local_dv.el("legend", input.title, { cls: "widget__taskList__title" });
}
if (input.content) {
    local_dv.paragraph(input.content, { cls: "widget__taskList__content" });
}
if (input.tasks)   {
    local_dv.taskList(input.tasks, false);
} else {
    let errorEl = containerEl.createDiv({ cls: "widget__taskList__error" });
    Obsidian.renderMarkdown(
        input.errorMarkdown,
        errorEl,
        local_dv.currentFilePath,
        local_dv.component
    );
}


