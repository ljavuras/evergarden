---
created: 2025-12-08T18:57:53.306+08:00
aliases:
  - Clock
  - evergarden-clock
---
# Clock

A *Datacore* component that displays current time and a link to today's daily note.

![[Clock example.png]]

## Usage

````
```datacoretsx
await cJS(({ Datacore }) => { dc = Datacore.wrap(dc); })
const Clock = await dc.require("evergarden-clock", "Clock");
return function() {
    return <Clock locale="en-US" />
}
```
````

### Changing date format

`evergarden-clock` comes with three pre-built locales: `en-US`, `zh-TW`, and `ja`. To add more locales and date formats, edit `dateFormat` in `Clock.tsx`:

```js
const dateFormat = {
    'en-US': "MMM Do, dddd",
    'zh-TW': "MMMDo dddd",
    'ja': "MMMDo dddd",
    // Add your locale and date format here
}
```

You can lookup available locales [here](https://github.com/moment/moment/tree/develop/locale), or run `moment.locales()` in the developer console to list all locales. Refer to *Moment.js* docs to find [available formats](https://momentjs.com/docs/#/displaying/format/).

### Linking daily notes

If you aren't using `customJS.Periodic` from `evergarden-periodic`, update the following line in `Clock.tsx` to match the filename format of your daily notes:

```js
const dailyFormat = Periodic?.daily.format ?? "YYYY-MM-DD";  // Change "YYYY-MM-DD" to your daily note format
```

Again, check out available formats in [Moment.js docs](https://momentjs.com/docs/#/displaying/format/).

## Dataview version

The *Dataview* version of clock isn't included in this package, but it remains in *Evergarden* under the path `System/script/Dataview/widget/Clock`.