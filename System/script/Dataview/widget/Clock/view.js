/**
 * Clock widget built upon Dataview plugin
 * 
 * @author ljavuras <ljavuras.py@gmail.com>
 */

const clockFormat = {
    'en-US': "MMM Do, dddd",
    'zh-TW': "MMMDo dddd",
}

const { Obsidian, Periodic } = await cJS();

const containerEl = (input?.containerEl ?? dv.container)
    .createDiv({ cls: "evergarden clock" });

const timeEl = containerEl.createDiv({ cls: "evergarden time" });
function updateTime() {
    timeEl.innerHTML = moment().format("HH:mm");
    setTimeout(() => {
        updateTime();
    }, moment().endOf('minute').diff(moment()) + 1);
}
updateTime();

const dateEl = containerEl.createDiv({ cls: "evergarden date" });
function updateDate() {
    Obsidian.renderMarkdown(
        "[[" + moment().format(Periodic.daily.format) + '|'
        + moment().locale(input.locale).format(clockFormat[input.locale]) + "]]",
        dateEl,
        dv.currentFilePath,
        dv.component
    );
    setTimeout(() => {
        updateDate();
    }, moment().endOf('day').diff(moment()) + 1);
}
updateDate();