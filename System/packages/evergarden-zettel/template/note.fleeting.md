<%*
/**
 * Fleeting notes
 * 
 * Fleeting notes creation process:
 * 1. Unique note creator (core plugin) creates an empty note with file name
 *    format: YYYY-MMDD-HHmm
 * 2. Templater inserts folder template "system.main.md" for root folder
 * 3. "system.main.md" detects file name, then includes "note.fleeting.md"
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Templater } = await cJS();

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");
-%>
#zettel/fleeting

# <% tp.file.title %>

<% tp.file.cursor() %>