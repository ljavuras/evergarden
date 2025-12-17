<%*
/**
 * Literature notes
 * 
 * @version 1
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Obsidian, Templater, Script } = await cJS();

// Only allow this template on create new note
if ((tp.config.run_mode == Templater.RunMode.AppendActiveFile) ||
    (tp.config.run_mode == Templater.RunMode.DynamicProcessor) ||
    (tp.config.run_mode == Templater.RunMode.StartupTemplate)
) {
    new Obsidian.Notice(
        "<em>[[note.literature]]</em> cannot be inserted into existing note."
    );
    // TODO: VaultError currently also creates a Notice, creating 2 Notices
    // TODO: Fix VaultError to correctly handle markdown
    throw new customJS.VaultError(
        "[[note.literature]] cannot be inserted into existing note."
    );
}

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");
Script.template.setInfo(tp);

let referenceLink = referenceLocator = ""
const active_frontmatter = Obsidian.frontmatter.get(tp.config.active_file);
if ("literature/reference" in active_frontmatter) {
    // Set reference to same as active file (another literature note)
    referenceLink = active_frontmatter['literature/reference'];
} else if (active_frontmatter?.tags?.find((tag) => tag.startsWith("a/source"))) {
    // Set reference to active file if it is #a/source
    referenceLink = [new Obsidian.Link(
        tp.config.active_file,
        tp.config.target_file
    )
    .toString()]
}
// TODO: Prompt for referenceLink

// TODO: If the modal is canceled, delete note
referenceLocator = [await (
    new Obsidian.InputPromptModal(
        "submit locator",
        "Reference locator",
    )
)
.getInput()]

tp.setFrontMatter({
    'literature/reference': referenceLink,
    'literature/reference/locator': referenceLocator,
});
await tp.include("[[system.cmd.cursor.move.eof]]")
-%>
#zettel/literature 

# <% tp.file.title %>

