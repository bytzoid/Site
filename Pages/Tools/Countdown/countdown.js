const output = document.getElementById("output");

const scheduleLabels = [
    "Period 1 Start", "Period 1 End",
    "Period 2 Start", "Period 2 End",
    "Period 3 Start", "Period 3 End",
    "Period 4 Start", "Period 4 End",
    "Study Hall Start", "Study Hall End",
    "Period 5 Start", "5A Lunch End",
    "5B Lunch Start", "5B Lunch End",
    "5C Lunch Start", "Period 5 End",
    "Period 6 Start", "Period 6 End",
    "Period 7 Start", "Period 7 End"
];

const scheduleLabelsWednsday = [
    "Period 1 Start", "Period 1 End",
    "Period 2 Start", "Period 2 End",
    "Period 3 Start", "Period 3 End",
    "Study Hall Start", "Study Hall End",
    "Period 4 Start", "Period 4 End",
    "Period 5 Start", "5A Lunch End",
    "5B Lunch Start", "5B Lunch End",
    "5C Lunch Start", "Period 5 End",
    "Period 6 Start", "Period 6 End",
    "Period 7 Start", "Period 7 End"
];

const scheduleTimesInMinutes = [
    460, 506, // Period 1 (7:40 am - 8:26 am)
    512, 558, // Period 2 (8:32 am - 9:18 am)
    564, 610, // Period 3 (9:24 am - 10:10 am)
    616, 662, // Period 4 (10:16 am - 11:02 am)
    662, 689, // Study Hall (11:02 am - 11:29 am)
    689, 721, // Period 5 Start (11:29 am) to 5A Lunch End (12:01 pm)
    725, 755, // 5B Lunch Start (12:05 pm) to 5B Lunch End (12:35 pm)
    759, 791, // 5C Lunch Start (12:39 pm) to Period 5 End (1:11 pm)
    797, 843, // Period 6 (1:17 pm - 2:03 pm)
    849, 895  // Period 7 (2:09 pm - 2:55 pm)
];

const scheduleTimesInMinutesWednesday = [
    490, 530, // Period 1 (8:10 am - 8:50 am)
    536, 576, // Period 2 (8:56 am - 9:36 am)
    582, 622, // Period 3 (9:42 am - 10:22 am)
    628, 655, // Study Hall / Homeroom (10:28 am - 10:55 am)
    661, 701, // Period 4 (11:01 am - 11:41 am)
    701, 733, // Period 5 Start (11:41 am) to 5A Lunch End (12:13 pm)
    737, 767, // 5B Lunch Start (12:17 pm) to 5B Lunch End (12:47 pm)
    771, 803, // 5C Lunch Start (12:51 pm) to Period 5 End (1:23 pm)
    809, 849, // Period 6 (1:29 pm - 2:09 pm)
    855, 895  // Period 7 (2:15 pm - 2:55 pm)
];

function Check(label, lunch) {
    if (lunch == "5A") {
        if (label.includes("5B") || label.includes("5C"))
            return false;
    }
    if (lunch == "5B") {
        if (label.includes("5A") || label.includes("5C"))
            return false;
    }
    if (lunch == "5C") {
        if (label.includes("5A") || label.includes("5B"))
            return false;
    }
    return true;
}
const dropdown = document.getElementById('myDropdown');
if (localStorage.getItem("lunch"))
    dropdown.value = localStorage.getItem("lunch");
function Update() {
    const type = dropdown.value;
    localStorage.setItem("lunch", type);
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const totalMinutes = (hours * 60) + minutes;
    const minsec = totalMinutes + seconds / 60 + now.getMilliseconds() / 60000;
    let i = 0;
    let percentDone = 0;
    if (now.getDay() == 3) {
        if (totalMinutes > scheduleTimesInMinutesWednesday[scheduleTimesInMinutesWednesday.length - 1]) {
            output.textContent = scheduleTimesInMinutes[0] + 1440 - totalMinutes - 1 + " minutes, " + (59 - seconds) + " seconds till " + "Period 1 Start";
            percentDone = totalMinutes / (scheduleTimesInMinutes[0] + 1440);
        } else {
            while (totalMinutes >= scheduleTimesInMinutesWednesday[i] || !Check(scheduleLabelsWednsday[i], type))
                i++;
            if (i == 0) {
                percentDone = minsec / scheduleTimesInMinutesWednesday[0];
            } else {
                let previ = i - 1;
                while (!Check(scheduleLabelsWednsday[previ], type))
                    previ--;
                percentDone = (minsec - scheduleTimesInMinutesWednesday[previ]) / (scheduleTimesInMinutesWednesday[i] - scheduleTimesInMinutesWednesday[previ]);
            }
            output.textContent = scheduleTimesInMinutesWednesday[i] - totalMinutes - 1 + " minutes, " + (59 - seconds) + " seconds till " + scheduleLabelsWednsday[i];
        }
    } else {
        if (totalMinutes > scheduleTimesInMinutes[scheduleTimesInMinutes.length - 1])
            output.textContent = (now.getDay() == 2 ? scheduleTimesInMinutesWednesday[0] : scheduleTimesInMinutes[0]) + 1440 - totalMinutes - 1 + " minutes, " + (59 - seconds) + " seconds till " + "Period 1 Start";
        else {
            while (totalMinutes >= scheduleTimesInMinutes[i] || !Check(scheduleLabels[i], type))
                i++;
            if (i == 0) {
                percentDone = minsec / scheduleTimesInMinutes[0];
            } else {
                let previ = i - 1;
                while (!Check(scheduleLabels[previ], type))
                    previ--;
                percentDone = (minsec - scheduleTimesInMinutes[previ]) / (scheduleTimesInMinutes[i] - scheduleTimesInMinutes[previ]);
            }
            output.textContent = scheduleTimesInMinutes[i] - totalMinutes - 1 + " minutes, " + (59 - seconds) + " seconds till " + scheduleLabels[i];
        }
    }
    window.top.document.title = output.textContent;
    const boxElement = document.querySelector('.circle-loader');
    if (boxElement) {
        boxElement.innerHTML = `${Math.round(percentDone*1000) / 10}%`;
        boxElement.style.setProperty('--progress', `${percentDone * 100}%`);
    }
};

setInterval(Update, 50);