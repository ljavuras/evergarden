<%*
/**
 * Area
 * 
 * @version 1
 */
const { Templater, Area, Script } = await cJS();

tp = Templater.wrap(tp);

tR += await tp.include("[[system.common]]");

Script.template.setInfo(tp);
tp.setFrontMatter({
    "area/super": "",
    "tags": ["is/dynamic", "note/area"],
});

tp.hooks.on_all_templates_executed(() => {
    Area.push(tp.config.target_file.path);
});
-%>
```datacoretsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-area", "Area");
```