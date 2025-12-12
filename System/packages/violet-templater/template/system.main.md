<%*
/**
 * Default template that is excuted whenever a new file is created
 *
 * Templater's settings states that "Folder Templates are triggered when a new
 * empty file is created in a given folder". Set this template to be the folder
 * template of root "/" effectively makes it the default template of the vault.
 */

const { Templater } = await cJS();

tp = Templater.wrap(tp);

// Include template for target file
let target_template = await Templater.resolveTemplate(tp.config);
if (target_template) {
    tR += await tp.include(`[[${target_template}]]`);
}
-%>