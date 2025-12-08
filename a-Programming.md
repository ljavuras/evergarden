---
created: 2025-02-12T19:47:04.307+08:00
area/super: []
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