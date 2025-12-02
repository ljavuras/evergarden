<%*
/**
 * Replicates a bug in customJS.Plugins.createNewFileFromTemplate()
 * 
 * If open_new_note is set to true:
 * app.plugins.plugins['templater-obsidian']
 * .templater.create_new_note_from_template(..., open_new_note = true)
 * 
 * Any `app.fileManager.processFrontMatter()` calls' effect will be ignored.
 * Weirdly enough, putting `app.vault.read(file).then(result => console.log(result))`
 * in customJS.Obsidian.frontmatter.set() confirms that the frontmatter was
 * indeed modified, but it doesn't show up in final note.
 * 
 * This template is an attempt to replicate the bug, haven't succeed yet.
 */
tp.hooks.on_all_templates_executed(() => {
    app.fileManager.processFrontMatter(
        tp.config.target_file,
        (frontmatter) => {
            frontmatter.key = "value";
        }
    );
    app.vault.read(tp.config.target_file)
        .then(result => console.log(result));
});
-%>
Lorem ipsum dolor sit amet, consectetur adipiscing elit