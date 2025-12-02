<%*
/**
 * Metadata notes for binary files (images/videos/audio/pdfs...etc)
 *
 * This template is inserted by Binary Files Manager, then post-processed by
 * Templater.
 * 
 * @todo Replace Binary Files Manager with QuickAdd
 * @version 1
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Templater, Utility, Script } = await cJS();

tp = Templater.wrap(tp);

// Add template info
Script.template.setInfo(tp);

tp.setFrontMatter({
    created: "{{CDATE:YYYY-MM-DDTHH:mm:ss.SSSZ}}",
    ['metadata/basename']: "{{NAME}}",
    ['metadata/extension']: "{{EXTENSION}}",
    ['metadata/name']: "{{FULLNAME}}",
    ['metadata/path']: "{{PATH}}",
    ['metadata/link']: "{{LINK}}",
});

let note_tag = 'note/metadata';
let file_type = Utility.fileType.lookup('{{EXTENSION}}');
if (file_type) { note_tag += '/' + file_type; }

tp.addTags([note_tag]);

-%>
{{EMBED}}