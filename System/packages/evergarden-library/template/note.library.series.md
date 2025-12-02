<%*
/**
 * Book series
 * 
 * @version 1
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Templater, Script } = await cJS();

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");
Script.template.setInfo(tp);

// Contents of this page is dependent on other notes
tp.addTags(['is/dynamic']);
-%>
```datacoretsx
await cJS(({Datacore}) => dc = Datacore.wrap(dc));
const { BookSeries } = await dc.require("evergarden-library", "Book");
return BookSeries;
```