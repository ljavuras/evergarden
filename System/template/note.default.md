<%*
/**
 * Default note template
 */

const { Templater } = await cJS();

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");

// Move cursor to end of file
await tp.include("[[system.cmd.cursor.move.eof]]");
-%>
# <% tp.file.title %>

