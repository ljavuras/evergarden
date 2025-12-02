---
tags:
  - is/dynamic
---
```datacoretsx
await cJS(({ Datacore }) => { dc = Datacore.wrap(dc); })
const Clock = await dc.require("evergarden-clock", "Clock");
return function() {
    return <Clock locale="zh-TW" />
}
```