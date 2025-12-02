/**
 * A facade of Dataview API
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class Dataview {
    plugin = app.plugins.plugins.dataview;
    api = app.plugins.plugins.dataview.api;

    fieldRegex(field) {
        return new RegExp(String.raw`\s*\[${field}::\s*(.*?)\]`, "g");
    }

    hasField(string, field) {
        return this.fieldRegex(field).test(string);
    }
    
    getField(string, field) {
        return this.fieldRegex(field).exec(string)?.[1];
    }

    stripField(string, field) {
        return string.replaceAll(this.fieldRegex(field), '');
    }

    /**
     * Gets an Obsidian TFile object for a given Dataivew page object
     * @param {SMarkdownPage} page - Dataview page object
     * @returns {TFile} Obsidian TFile of page
     */
    getFile(page) {
        return customJS.Obsidian.vault.getFile(page.file.path);
    }

    /**
     * Imports a css file into a custom view
     * @param {DataviewInlineApi} dv - Dataview inline render context
     * @param {string} path - CSS style file path
     */
    async importStyle(dv, path) {
        let cssFile = app.metadataCache.getFirstLinkpathDest(path, dv.currentFilePath);
        if (cssFile) {
            let cssContents = await app.vault.read(cssFile);
            cssContents += `\n/*# sourceURL=${location.origin}/${cssFile.path} */`;
            dv.container.createEl("style", { text: cssContents });
        }
    }
}