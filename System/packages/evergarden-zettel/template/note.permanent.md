<%*
/**
 * Permanent notes
 * 
 * @version 1
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Templater, Script } = await cJS();

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");
Script.template.setInfo(tp);
await tp.include("[[system.cmd.cursor.move.eof]]")
-%>
#zettel/permanent

# <% tp.file.title %>

