
/* DOM Elements */
const mapWrapper = document.getElementById('mapWrapper');
const dayInput = document.getElementById('dayInput');
const timeInput = document.getElementById('timeInput');

/* Loading consts */
const liveUpdateInterval = Number( mapWrapper.dataset.liveUpdateInterval );
const historyPeriod      = Number( mapWrapper.dataset.historyPeriod      );
const fetchDayUrl        = String( mapWrapper.dataset.fetchDayUrl        );
const fetchLiveUrl       = String( mapWrapper.dataset.fetchLiveUrl       );

/* Global variables */
var locations = [];
var markers = [];
var isLive = false;
var liveTimerId = null;

function GetSelectedDateTime() {
    const selectedDateTime = new Date(`${dayInput.value}T00:00`);
    selectedDateTime.setSeconds(selectedDateTime.getSeconds() + parseInt(timeInput.value))
    return selectedDateTime;
}

/* Markers drawing */

function CreateMarker(loc) {
    const newMarker = {
        'element': document.createElement('div'),
        'location': loc
    };

    newMarker.element.style.left = loc.x + '%';
    newMarker.element.style.top  = loc.y + '%';
    mapWrapper.appendChild(newMarker.element);
    SetMarkerSmall(newMarker);
    markers.push(newMarker);
    return newMarker;
}

function DeleteMarker(marker) {
    marker.element.remove();
}

function SetMarkerSmall(marker) {
    marker.element.classList.remove('map-big-marker');
    marker.element.classList.add('map-small-marker');
}

function SetMarkerBig(marker) {
    marker.element.classList.add('map-big-marker');
    marker.element.classList.remove('map-small-marker');
}

function DrawHistory() {
    const selectedTime = GetSelectedDateTime().getTime()/1000;

    markers.forEach(marker => {
        DeleteMarker(marker);
    });
    markers = [];

    locations.forEach(loc => {
        if (selectedTime - historyPeriod <= loc.time && loc.time <= selectedTime)
            CreateMarker(loc);
    });
    
    if (markers.length > 0)
        SetMarkerBig(markers[markers.length - 1]);
}

function DrawLive(newLocations) {
    const selectedTime = GetSelectedDateTime().getTime()/1000;

    while (markers.length > 0 && markers[0].location.time < selectedTime - historyPeriod) {
        DeleteMarker(markers[0]);
        markers.shift();
    }

    if (newLocations.length === 0)
        return;

    if (markers.length > 0)
        SetMarkerSmall(markers[markers.length - 1]);

    newLocations.forEach(loc => {
        if (selectedTime - historyPeriod < loc.time)
            CreateMarker(loc);
    });

    if (markers.length > 0)
        SetMarkerBig(markers[markers.length - 1]);
}

/* API requests */

async function FetchDay() {
    const response = await fetch(
        fetchDayUrl.replace('PLACEHOLDER', dayInput.value)
    );

    if (!response.ok) {
        alert('Не удалось загрузить день');
        locations = [];
        return;
    }

    data = await response.json();

    if (!isLive)
        locations = data;
}

async function FetchLiveUpdates() {
    const lastTime = (locations.length > 0) ? locations[locations.length-1].time : 0;

    const response = await fetch(
        fetchLiveUrl.replace('0', lastTime)
    );
    
    if (!response.ok) {
        alert('Не удалось загрузить лайв данные');
        return;
    }

    data = await response.json();
    
    if (isLive) {
        DrawLive(data);
        locations = locations.concat(data);
    }

}

/* Live mode */

function ResetDayInput() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    dayInput.value = `${year}-${month}-${day}`;
}

function ResetTimeInput() {
    const now = new Date();
    timeInput.value = now.getHours()*60*60 + now.getMinutes()*60 + now.getSeconds();
}

async function CheckLiveUpdates() {
    ResetDayInput();
    ResetTimeInput();
    await FetchLiveUpdates();
}

async function StartLiveTimer() {
    if (liveTimerId === null)
        liveTimerId = setInterval(CheckLiveUpdates, liveUpdateInterval*1000);
    await CheckLiveUpdates();
}

function StopLiveTimer() {
    clearInterval(liveTimerId);
}

async function EnableLiveMode() {
    ResetDayInput();
    ResetTimeInput();
    isLive = true;
    StartLiveTimer();
}

function DisableLiveMode() {
    isLive = false;
    StopLiveTimer();
    liveTimerId = null;
}

async function onVisibilityChange() {
    if (isLive) {
        if (document.hidden) StopLiveTimer();
        else StartLiveTimer();
    }
}

/* Inputs */

async function onDayInputChange() {
    const dayStr = dayInput.value;
    if (!dayStr) {
        alert('Неверная дата')
        return;
    }

    const selectedDay = new Date(dayStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDay.getTime() >= today.getTime()) {
        await EnableLiveMode();
        return;
    }

    if (isLive) DisableLiveMode();

    await FetchDay();
    await onTimeInputChange();
}

async function onTimeInputChange() {
    if (GetSelectedDateTime().getTime() >= (new Date()).getTime()) {
        await EnableLiveMode();
        return;
    }
    if (isLive) DisableLiveMode();

    DrawHistory();
}

dayInput.addEventListener('change', onDayInputChange);
timeInput.addEventListener('change', onTimeInputChange);
document.addEventListener('visibilitychange', onVisibilityChange);

EnableLiveMode();