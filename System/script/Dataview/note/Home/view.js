/**
 * Home dashboard in Obsidian, built upon Dataview plugin
 * 
 * @author ljavuras <ljavuras.py@gmail.com>
 */

const options = {
    // locale: 'en-US',
    locale: 'zh-TW',
}

const containerEl = dv.container;

// Unload all child components created by TaskList widgets
// FIXME: handle component lifecycle in TaskList
for (const childComponent of dv.component._children)  {
    dv.component.removeChild(childComponent);
}

/**
 * Banner area
 * - Clock
 */
const bannerEl = containerEl.createDiv({ attr: { id: "home__banner" }});
dv.view("System/script/Dataview/widget/Clock", {
    containerEl: bannerEl,
    locale: options.locale,
});

/**
 * Vault links
 */
dv.el("div", "[[Plugins]] - [[Templates]] | [[Vault]] - [[Project]] - [[Area]] - [[Convo]]");

/**
 * Tasks
 */
const tasksEl = containerEl.createDiv({ attr: { id: "home__tasks" }});
let daily_tasks = DataviewAPI.page(moment().format("YYYY-MM-DD"))?.file.tasks
    ?.filter((t) => (t.header.subpath == "Daily"));
dv.view("System/script/Dataview/widget/TaskList", {
    containerEl: tasksEl,
    tasks: daily_tasks,
    title: "Daily" + (daily_tasks?
        ` (${daily_tasks.filter(t => t.completed).length}/${daily_tasks.length})`
        : ""
    ),
    errorMarkdown: `[[${moment().format("YYYY-MM-DD")}]] is not created yet.`,
});

let today_tasks = DataviewAPI.page(moment().format("YYYY-MM-DD"))?.file.tasks
    ?.filter((t) => (t.header.subpath == "Today"));
dv.view("System/script/Dataview/widget/TaskList", {
    containerEl: tasksEl,
    tasks: today_tasks,
    title: "Today" + (today_tasks?
        ` (${today_tasks.filter(t => t.completed).length}/${today_tasks.length})`
        : ""
    ),
    errorMarkdown: `[[${moment().format("YYYY-MM-DD")}]] is not created yet.`,
});

/**
 * In progress cards of all active project
 */
const kanbanSliceEl = containerEl.createDiv();
dv.view("System/script/Dataview/project/kanban/Slice", {
    containerEl: kanbanSliceEl,
});

/**
 * Convos
 */
const convoEl = containerEl.createDiv();
dv.view("System/script/Dataview/widget/Convo", {
    containerEl: convoEl,
    locale: options.locale,
    mode: "recent",
});