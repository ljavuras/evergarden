---
tags:
  - is/dynamic
---
```datacoretsx
await cJS(({Datacore}) => dc = Datacore.wrap(dc));
dc.config.dev = true;
const { TemplatesOverview } = await dc.require(
    "evergarden-templates",
    "TemplatesOverview"
);
return TemplatesOverview;
```