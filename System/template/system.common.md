<%*
/**
 * Common template for notes across the vault
 *
 * DO NOT use with template when inserting into an empty note, see:
 * [Target file gets overwritten by processFrontMatter() · Issue #1393 · SilentVoid13/Templater](https://github.com/SilentVoid13/Templater/issues/1393)
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Templater } = await cJS();

tp = Templater.wrap(tp);

tp.setFrontMatter({
    created: tp.file.creation_date("YYYY-MM-DDTHH:mm:ss.SSSZ"),  // ISO 8601
});
-%>