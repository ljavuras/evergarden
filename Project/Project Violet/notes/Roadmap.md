---
created: 2025-04-13T15:29:33.905+08:00
template/name: "[[note.project.notes]]"
template/version: 3
project/main: "[[Project Violet]]"
---
```datacoretsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-project", "Navigation");
```
# Roadmap

- [ ] Sort out dependencies for all existing packages
- [ ] [[Violet Package Service]]
    - [ ] Download packages
    - [ ] CustomJS
- [ ] Stable package API
    - [ ] `VPS.Package`
    - [ ] `VPS.require()`