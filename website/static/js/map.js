/* Timeline input */
let timeline = {
    'element': document.getElementById('timeline'),
    'trackElement': document.getElementById('timelineTrack'),
    'fillElement': document.getElementById('timelineFill'),
    'thumbElement': document.getElementById('timelineThumb'),
    'maxValue': 24*60 - 1,
    'value': 0,
    '_valueBeforeTap': 0,
    '_lastDisplayedValue': '',
    '_isDragging': false,
    '_isHovering': false,

    _calcHoverValue(clientX) {
        const rect = this.trackElement.getBoundingClientRect();
        return Math.trunc(
                this.maxValue * Math.min(
                1,
                Math.max(
                    0,
                    (clientX - rect.left) / rect.width
                )
            )
        );
    },

    _calcPercent(value) {
        return 100 * value / this.maxValue;
    },

    setThumbText(value) {
        function getTimeString(value) {
            const hours = Math.trunc(value / 60);
            const minutes = value % 60;
            return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
        }
        this.thumbElement.textContent = getTimeString(value);
    },

    setThumbPosition(value) {
        this.thumbElement.style.left = `${this._calcPercent(value)}%`;
    },

    setFillPosition(value) {
        this.fillElement.style.width = `${this._calcPercent(value)}%`;
    },

    setValue(value, notify = true) {
        this.value = value;
        this.setThumbText(value);
        this.setThumbPosition(value);
        this.setFillPosition(value);
        if (notify)
            this.element.dispatchEvent(new CustomEvent('change'));
        this._lastDisplayedValue = this.thumbElement.textContent;
    },

    _onPointerDown(e) {
        this._isDragging = true;
        this.setValue(this._calcHoverValue(e.clientX));
        this.element.setPointerCapture(e.pointerId);
        e.preventDefault();
    },
    _onPointerUp(e) {
        if (!this._isDragging) return;
        this._isDragging = false;
        this.setValue(this._calcHoverValue(e.clientX));
        e.preventDefault();
    },
    _onPointerMove(e) {
        const value = this._calcHoverValue(e.clientX);
        if (this._isDragging)
            this.setFillPosition(value);
        this.setThumbText(value);
        this.setThumbPosition(value);
    },
    _onPointerEnter(e) {
        this._valueBeforeTap = this.value;
        this._lastDisplayedValue = this.thumbElement.textContent;
        this.thumbElement.classList.add('hover');
    },
    _onPointerLeave(e) {
        this.thumbElement.classList.remove('hover');
        this.setThumbPosition(this.value);
        this.thumbElement.textContent = this._lastDisplayedValue;
    },
    _onPointerCancel(e) {
        this.setValue(this._valueBeforeTap);
    },

    init() {
        this.element.addEventListener('pointerdown', this._onPointerDown.bind(this));
        this.element.addEventListener('pointerup', this._onPointerUp.bind(this));
        this.element.addEventListener('pointermove', this._onPointerMove.bind(this));
        this.element.addEventListener('pointerenter', this._onPointerEnter.bind(this));
        this.element.addEventListener('pointerleave', this._onPointerLeave.bind(this));
        this.element.addEventListener('pointercancel', this._onPointerCancel.bind(this));
    }

};

timeline.init();


/* Calendar input */
const calendarButton = document.getElementById('calendarButton');
calendarButton.addEventListener('click', () => { dayInput.showPicker(); });

/* DOM Elements */
const mapWrapper = document.getElementById('mapWrapper');
const dayInput = document.getElementById('dayInput');
const dateContainer = document.getElementById('dateContainer');

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
    selectedDateTime.setSeconds(selectedDateTime.getSeconds() + timeline.value*60); // TODO replace with minutes
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
    dateContainer.textContent = 'Сегодня';
}

function SetLiveTimeline() {
    const now = new Date();
    if (!timeline._isDragging) {
        timeline.setValue(now.getHours()*60 + now.getMinutes(), false)
        timeline.thumbElement.textContent = 'ЛАЙВ';
    }
}

async function CheckLiveUpdates() {
    ResetDayInput();
    SetLiveTimeline();
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
    SetLiveTimeline();
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
async function onTimelineChange() {
    if (GetSelectedDateTime().getTime() >= (new Date()).getTime()) {
        await EnableLiveMode();
        return;
    }
    if (isLive) DisableLiveMode();

    DrawHistory();
}

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

    dateContainer.textContent = new Intl.DateTimeFormat(
        'ru-RU', { day: '2-digit', month: '2-digit' }
    ).format(selectedDay);

    await FetchDay();
    await onTimelineChange();
}

dayInput.addEventListener('change', onDayInputChange);
timeline.element.addEventListener('change', onTimelineChange);
document.addEventListener('visibilitychange', onVisibilityChange);

EnableLiveMode();