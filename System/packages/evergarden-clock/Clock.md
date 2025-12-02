---
tags:
  - is/dynamic
---
```datacoretsx
await cJS(({ Datacore }) => { dc = Datacore.wrap(dc); })

return dc.require("evergarden-clock", "Clock");
```