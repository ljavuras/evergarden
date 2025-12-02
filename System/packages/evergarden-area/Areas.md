---
tags:
  - is/dynamic
---
# Areas
```datacoretsx
return function() {
    const areas = dc.useQuery("@page and #note/area");
    return (
        <dc.VanillaTable
            rows={areas}
            columns={[
                {
                    id: "area",
                    title: "Area",
                    value: (page) => page.$link.withDisplay(page.$name.slice(2))
                }
            ]}
        />
    )
}
```
