<%*
/**
 * Issue note
 * 
 * @version 3
 * @author ljavuras <ljavuras.py@gmail.com>
 */

/**
 * `window.newIssueInfo` is a `IssueInfoExporter` object from `IssueTracker/view.js`,
 * refer to the source code for details.
 */
let issueInfo = window.newIssueInfo;

// Abort templater parsing process if `window.newIssueInfo` doesn't exist
if (!window.newIssueInfo) {
    new tp.obsidian.Notice(
        "Aborted.\n" +
        "`window.newIssueInfo` doesn't exist.\n" +
        "Issue template can't be used directly. Use Issue Tracker to create issue instead."
    );
    return;
}

const { Obsidian, Templater, Script, Projects } = await cJS();

tp = Templater.wrap(tp);

const current_path = tp.config.target_file.path;
const project = Projects.getProjectByPath(current_path);

tR += await tp.include("[[system.common]]");  // Include common template
Script.template.setInfo(tp);  // Template info
tp.setFrontMatter({
    created: issueInfo.created.toISO(),
    'project/issue-tracker': new Obsidian.Link(project.issueTracker, current_path).toString(),
    'issue/no'             : issueInfo.issueNo,
    'issue/status'         : 'open',
    'issue/labels'         : issueInfo.labels,
});

tp.addTags(['note/issue']);
-%>
```datacoretsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-project", "Navigation");
```
# <% issueInfo.title %>
```datacoretsx
await cJS(({ Datacore }) => { dc = Datacore.wrap(dc); })
return dc.require("evergarden-issue-tracker", "IssueToolbar");
```

<% tp.file.cursor() %>