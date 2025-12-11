<%*
/**
 * Issue tracker
 * 
 * @version 2
 * @author Ljavuras <ljavuras.py@gmail.com>
 **/

const { Script, Templater } = await cJS();

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");
Script.template.setInfo(tp);
-%>
```dataviewjs
await dv.view("System/script/Dataview/IssueTracker", {
    obsidian: obsidian,

    /** Options */

    // Name of project, displayed when creating new issue.
    // project_name: <your project name>

    // Sub-folder where issue notes go.
    // issue_folder: "issues/",

    // Template name, a template that exists in your templater folder.
    // issue_template: "note.project.issue",

    // Default query that shows up in the search bar.
    // default_query: "is:open",

    // Locale used for displaying date and time.
    // locale: "en-US",
});
```