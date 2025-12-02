<%*
/**
 * Update issues generated with template [[note.project.issue]]
 * 
 * Insert this template into an issue with Templater command, or with Templater
 * API.
 * Required plugins: Templater, Dataview, customJS
 * 
 * @author ljavuras <ljavuras.py@gmail.com>
 */

/**
 * Issue version 1 format:
 * ---
 * <YAML>
 * ---
 * %%[[Issues - <project name>]]%%
 * 
 * <content>
 */

const { Templater } = await cJS();

tp = Templater.wrap(tp);

const UPDATED_VERSION = 2;;

// Match "path/to/(Project Name)/issues"
let project_path = tp.file.folder(true).match(/^(.*)\/issues$/)[1];
let project_name = tp.file.folder(true).match(/^.*\/([^\/]+)\/issues$/)[1];

let project_dvlink = DataviewAPI
    .page(`${project_path}/${project_name}`).file.link;
let issueTracker_dvlink = DataviewAPI
    .page(`${project_path}/Issues - ${project_name}`)
    .file.link.withDisplay("Issues");

let v2_content = 
`
### ${project_dvlink} / ${issueTracker_dvlink}
# ${tp.file.title}
${"```"}dataviewjs
dv.view("System/script/Dataview/IssueTracker/Issue", { obsidian: obsidian });
${"```"}
`;

function update_content(file_content) {
    return file_content
        .replaceAll("\r", "")  // Remove carraige return
        .replaceAll(/^#/gm, "##")  // Increase headings
        .replace(`%%[[Issues - ${project_name}]]%%\n`, v2_content)
        .replace(/^(template\/version:\s*)\d+$/m, `$1${UPDATED_VERSION}`);
}

// Insert update_content to target_file
switch (tp.config.run_mode) {

    // Update template executed with command:
    // `Templater: Open insert template modal`
    case Templater.RunMode.AppendActiveFile:
        await app.vault.process(tp.config.target_file, (data) => {
            return update_content(data);
        });
        break;

    // Update template executed with function:
    // `app.plugins.plugins['templater-obsidian'].templater.write_template_to_file()`, or
    // `Templater.apply()`
    case Templater.RunMode.OverwriteFile:
        tR = update_content(tp.file.content);
        break;
}
-%>