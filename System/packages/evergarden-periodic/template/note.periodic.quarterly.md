<%*
/**
 * Quarterly periodic notes
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
    'note/periodic/quarterly',
    'is/personal'
]);

await tp.file.move(`${Periodic.quarterly.path}/${tp.file.title}`);

let quarter = moment(tp.file.title, 'YYYY-[Q]Q');

// # 2023 Q1
tR += '# ' + quarter.format('YYYY [Q]Q') + '\n';

// 2023
tR += '[[' + quarter.format('YYYY') + ']]' + '\n\n';

// ❮ Q4 | Q1 | Q2 ❯
tR += '❮ [[' + quarter.subtract(1, 'quarters').format('YYYY-[Q]Q|[Q]Q') + ']]';
tR += ' | '  + quarter.add(1, 'quarters').format('[Q]Q')                + ' | ';
tR += '[['   + quarter.add(1, 'quarters').format('YYYY-[Q]Q|[Q]Q')      + ']] ❯\n';
quarter.subtract(1, 'quarters');

// January - February - March
tR += '[[' + quarter.format('YYYY-MM|MMMM')                  + ']] - ';
tR += '[[' + quarter.add(1, 'months').format('YYYY-MM|MMMM') + ']] - ';
tR += '[[' + quarter.add(1, 'months').format('YYYY-MM|MMMM') + ']]';
%>

---
```toggl
SUMMARY
FROM <% quarter.startOf('quarter').format('YYYY-MM-DD') %> TO <% quarter.endOf('quarter').format('YYYY-MM-DD') %>
SORT DESC
TITLE "<% quarter.format('YYYY [Q]Q') %>"
```

# Project Schedule
```dataviewjs
const {Projects} = customJS;
let timeFrame = dv.current().file.name;
let tasks     = Projects.getSchedule(timeFrame);
dv.taskList(tasks);
```
