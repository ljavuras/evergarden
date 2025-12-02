<%*
/**
 * Convo notes
 * 
 * Convo notes are created by Convo widgets, and inserted with Templater 
 * 
 * @version 1
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Templater, Script } = await cJS();

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");

// Template info
Script.template.setInfo(tp);

tp.addTags(['note/convo']);
-%>