<%*
/**
 * Update note layout to match latest template design
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { VaultError, Templater, Script } = await cJS();

tp = Templater.wrap(tp);

// Get template info of the updating note
const {name, version} = Script.template.getInfo(tp.config.target_file);

switch (await Templater.tryUpdate(tp.config.target_file)) {
    case "missing-template":
        throw new VaultError(
            `${tp.config.target_file.path}: No templates assigned.`
        );
    case "missing-version":
        throw new VaultError(
            `${tp.config.target_file.path}: Missing version number`
        );
    case "latest":
        new Notice(`${tp.config.target_file.path} is already at latest version.`);
        break;
    case "missing-updater":
        throw new VaultError(
            `${tp.config.target_file.path}: ` +
            `Updater for template ${name} version ${version} ` +
            `doesn't exist.`
        )
    case "update-available":
        const updatedContent = await tp.include(
            `[[${name}.update.${version}]]`,
            true
        );

        // Insert updatedContent to target_file
        switch (tp.config.run_mode) {

            // `system.updated` inserted with command:
            // `Templater: Open insert template modal`
            case Templater.RunMode.AppendActiveFile:
                await app.vault.process(tp.config.target_file, (data) => {
                    return updatedContent;
                });
                break;

            // `system.update` inserted with function:
            // `Templater.apply()`, or
            // `app.plugins.plugins['templater-obsidian'].templater.write_template_to_file()`
            case Templater.RunMode.OverwriteFile:
                tR = updatedContent;
                break;
        }
}
-%>