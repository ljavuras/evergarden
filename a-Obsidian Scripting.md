---
created: 2025-11-27T00:34:44.796+08:00
area/super:
  - "[[a-Programming]]"
tags:
  - is/dynamic
  - note/area
template/name: "[[note.area]]"
template/version: 1
---
```datacoretsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-area", "Area");
```