<%*
/**
 * Monthly periodic notes
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
    'note/periodic/monthly',
    'is/personal'
]);

await tp.file.move(`${Periodic.monthly.path}/${tp.file.title}`);

let month = moment(tp.file.title);

// # 2023 January
tR += '# ' + month.format('YYYY MMMM') + '\n';

// 2023 / Q1
tR += '[[' + month.format('YYYY')           + ']] / ';
tR += '[[' + month.format('YYYY-[Q]Q|[Q]Q') + ']]\n\n';

// ❮ December | January | February ❯
tR += '❮ [[' + month.subtract(1, 'months').format('YYYY-MM|MMMM') + ']]';
tR += ' | '  + month.add(1, 'months').format('MMMM')              + ' | ';
tR += '[['   + month.add(1, 'months').format('YYYY-MM|MMMM')      + ']] ❯';
month.subtract(1, 'months');
tR += '\n';

// Week 52 - Week 1 - Week 2 - Week 3 - Week 4 - Week 5
const thisMonth = month.month();
month.startOf('week');
do {
    tR += '[[' + month.format('YYYY-[W]ww|[Week] w') + ']]';
    month.add(1, 'weeks');
    if (month.month() == thisMonth) {
        tR += ' - ';
    }
} while (month.month() == thisMonth);
month.subtract(1, 'weeks');
%>

---
```toggl
SUMMARY
FROM <% month.startOf('month').format('YYYY-MM-DD') %> TO <% month.endOf('month').format('YYYY-MM-DD') %>
SORT DESC
TITLE "<% month.format('YYYY MMMM') %>"
```

# Project Schedule
```dataviewjs
const {Projects} = customJS;
let timeFrame = dv.current().file.name;
let tasks     = Projects.getSchedule(timeFrame);
dv.taskList(tasks);
```
