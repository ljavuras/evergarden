<%*
/**
 * Yearly periodic notes
 * 
 * Use this template by inserting it with Templater
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Templater, Periodic } = await cJS();

tp = Templater.wrap(tp);

// Include common template
tR += await tp.include("[[system.common]]");

// Add tags to frontmatter
tp.addTags([
    'note/periodic/yearly',
    'is/personal'
]);

await tp.file.move(`${Periodic.yearly.path}/${tp.file.title}`);

let year = moment(tp.file.title);

// # 2023
tR += '# ' + year.format('YYYY') + '\n\n\n';

// ❮ 2022 | 2023 | 2024 ❯
tR += '❮ [[' + year.subtract(1, 'years').format('YYYY') + ']]';
tR += ' | '  + year.add(1, 'years').format('YYYY')      + ' | ';
tR += '[['   + year.add(1, 'years').format('YYYY')      + ']] ❯';
year.subtract(1, 'years');
tR += '\n';

// Q1 - Q2 - Q3 - Q4
tR += '[[' + year.format('YYYY-[Q]Q|[Q]Q')                    + ']] - ';
tR += '[[' + year.add(1, 'quarters').format('YYYY-[Q]Q|[Q]Q') + ']] - ';
tR += '[[' + year.add(1, 'quarters').format('YYYY-[Q]Q|[Q]Q') + ']] - ';
tR += '[[' + year.add(1, 'quarters').format('YYYY-[Q]Q|[Q]Q') + ']]';
%>

---
```toggl
SUMMARY
FROM <% year.startOf('year').format('YYYY-MM-DD') %> TO <% year.endOf('year').format('YYYY-MM-DD') %>
SORT DESC
TITLE "<% year.format('YYYY') %>"
```

# Project Schedule
```dataviewjs
const {Projects} = customJS;
let timeFrame = dv.current().file.name;
let tasks     = Projects.getSchedule(timeFrame);
dv.taskList(tasks);
```
