/**
 * Evergarden clock widget
 * 
 * @author ljavuras <ljavuras.py@gmail.com>
 */

const { Periodic } = await cJS();
const { useState, useEffect } = dc;

const clockFormat = {
    'en-US': "MMM Do, dddd",
    'zh-TW': "MMMDo dddd",
}

function currentTime() {
    return moment().format("HH:mm");
}

function currentDayLink(locale) {
    return dc.fileLink(
            moment().format(Periodic.daily.format)
        ).withDisplay(
            moment().locale(locale).format(clockFormat[locale])
        );
}

return function Clock({ locale }) {
    locale = locale ?? "zh-TW";  // TODO: locale is always undefined even if passed value
    const [time, setTime] = useState(currentTime());
    const [link, setLink] = useState(currentDayLink(locale));
    
    useEffect(() => {
        let timeoutID;
        function updateTime() {
            setTime(currentTime());
            timeoutID = setTimeout(() => {
                updateTime();
            }, moment().endOf('minute').diff(moment()) + 1)
        }
        updateTime();
        return () => clearTimeout(timeoutID);
    }, []);

    useEffect(() => {
        let timeoutID;
        function updateLink() {
            setLink(currentDayLink(locale));
            timeoutID = setTimeout(() => {
                updateLink();
            }, moment().endOf('day').diff(moment()) + 1);
        }
        updateLink();
        return () => clearTimeout(timeoutID);
    }, []);
    
    return (
        <div className="evergarden clock">
            <div className="evergarden time">{time}</div>
            <div className="evergarden date">
                <dc.Link link={link} />
            </div>
        </div>
    );
}