/* Settings */
const settings = document.getElementById('map').dataset;

const LIVE_UPDATE_INTERVAL = Number( settings.liveUpdateInterval );
const MAP_MARKER_CAPACITY  = Number( settings.mapMarkerCapacity  );
const FETCH_DAY_URL        = String( settings.fetchDayUrl        );
const FETCH_LIVE_URL       = String( settings.fetchLiveUrl       );

/* Timeline input */
let timeline = {
    element: document.getElementById('timeline'),
    trackElement: document.getElementById('timelineTrack'),
    fillElement: document.getElementById('timelineFill'),
    thumbElement: document.getElementById('timelineThumb'),
    maxValue: 24*60 - 1,
    value: 0,
    isLive: false,
    _valueBeforeTap: 0,
    _isDragging: false,
    _isHovering: false,

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

    _setThumbText(value, isLive) {
        if (isLive) {
            this.thumbElement.textContent = 'ЛАЙВ';
            this.thumbElement.classList.add('live');
            return;
        }

        function getTimeString(value) {
            const hours = Math.trunc(value / 60);
            const minutes = value % 60;
            return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
        }
        this.thumbElement.textContent = getTimeString(value);    
        this.thumbElement.classList.remove('live');
    },

    _setThumbPosition(value) {
        this.thumbElement.style.left = `${this._calcPercent(value)}%`;
    },

    _setFillPosition(value) {
        this.fillElement.style.width = `${this._calcPercent(value)}%`;
    },

    getValue() {
        if (this.isLive) {
            const now = new Date();
            return now.getHours()*60 + now.getMinutes();
        }
        return this.value;
    },

    setValue(value, notify = true, resetLive = true) {
        if (resetLive) this.isLive = false;
        this.value = value;
        this._setThumbText(value, this.isLive);
        this._setThumbPosition(value);
        this._setFillPosition(value);
        if (notify)
            this.element.dispatchEvent(new CustomEvent('change'));
    },

    setLive(notify = true) {
        this.isLive = true;
        this.setValue(this.getValue(), notify, false);
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
        if (this._isDragging) {
            this.setValue(value);
        } else {
            this._setThumbText(value, false);
            this._setThumbPosition(value);
        }
    },
    _onPointerEnter(e) {
        this._valueBeforeTap = this.value;
        this.thumbElement.classList.add('hover');
    },
    _onPointerLeave(e) {
        this.thumbElement.classList.remove('hover');
        this.setValue(this.value, false, false);
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

let calendar = {
    button: document.getElementById('calendar'),
    input: document.getElementById('calendarInput'),
    output: document.getElementById('calendarOutput'),
    value: new Date(),

    _stringToDate(value) {
        return new Date(`${value}T00:00`);
    },

    setValue(value, notify = true) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        
        this.input.value = `${year}-${month}-${day}`;
        this.output.textContent = `${day}.${month}`;
        this.value = this._stringToDate(this.input.value);

        if (notify)
            this.input.dispatchEvent(Event('change', { bubbles: true }));
    },

    _onButtonClick(e) {
        this.input.showPicker();
    },

    _onInputChange(e) {
        if (!this.input.value) {
            this.input.value = this._oldValue;
            e.stopImmediatePropagation();
            alert('Введена неверная дата');
            return;
        }

        this.setValue(this._stringToDate(this.input.value), false);
    },

    setToday(notify = true) {
        this.setValue(new Date(), notify);
        this.output.textContent = 'Сегодня';
    },

    init() {
        this.button.addEventListener('click', this._onButtonClick.bind(this));
        this.input.addEventListener('change', this._onInputChange.bind(this));
    },
};

let map = {
    element: document.getElementById('map'),
    markerCapacity: MAP_MARKER_CAPACITY,
    _smallMarkers: [],
    _bigMarker: undefined,

    _validateCapacity() {
        if (this._smallMarkers.length + (this._bigMarker !== undefined) > this.markerCapacity) {
            this._smallMarkers.shift().remove();
        }
    },

    validateBigMarker() {
        if (this._bigMarker !== undefined) return;
        if (this._smallMarkers.length == 0) return;

        this._bigMarker = this._smallMarkers.pop();
        this._bigMarker.classList.add('big');
    },

    normalizeBigMarker() {
        if (this._bigMarker === undefined) return;

        this._bigMarker.classList.remove('big');
        this._smallMarkers.push(this._bigMarker);
        this._bigMarker = undefined;
        this._validateCapacity();
    },

    createMarker(pos, isBig = false) {
        const newMarker = document.createElement('div');
        newMarker.style.left = pos.x + '%';
        newMarker.style.top  = pos.y + '%';
        newMarker.classList.add('marker');
        newMarker.appendChild(document.createElement('div'));

        if (isBig) {
            if (this._bigMarker !== undefined) {
                this._bigMarker.classList.remove('big');
                this._smallMarkers.push(this._bigMarker);
                this._bigMarker = undefined;
            }
        }

        this._smallMarkers.push(newMarker);
        this.element.appendChild(newMarker);
        if (isBig)
            this.validateBigMarker();

        this._validateCapacity();
    },

    clear() {
        if (this._bigMarker !== undefined) {
            this._bigMarker.remove();
            this._bigMarker = undefined;
        }
        this._smallMarkers.forEach((element) => {
            element.remove();
        });
        this._smallMarkers = [];
    }
};

timeline.init();
calendar.init();

/* Global variables */
var locations = [];
var isLive = false;
var liveUpdateTimerId = null;
var liveElapsedTimeTimerId = null;

function GetSelectedTime() {
    const selectedDateTime = new Date(calendar.value);
    selectedDateTime.setMinutes(selectedDateTime.getMinutes() + timeline.value);
    return selectedDateTime.getTime()/1000;
}


/* Markers drawing */
function DrawHistory() {
    map.clear();

    const selectedTime = GetSelectedTime();
    let i;
    for (i = locations.length - 1; i > map.markerCapacity; i--) {
        if (locations[i].time <= selectedTime) break;
    }

    for (let j = Math.max(0, i - map.markerCapacity + 1); j <= i; j++) {
        map.createMarker(locations[j]);
    }
    
    map.validateBigMarker();
}

function DrawLive(newLocations) {
    map.normalizeBigMarker();

    for (
        let i = Math.max(0, newLocations.length - map.markerCapacity);
        i < newLocations.length;
        i++
    ) {
        map.createMarker(newLocations[i]);
    }

    map.validateBigMarker();
}


/* API requests */
async function FetchDay() {
    let response;
    try {
        response = await fetch(
            FETCH_DAY_URL.replace('PLACEHOLDER', calendar.input.value)
        );
        if (!response.ok) throw Error();
    } catch (error) {
        alert('Не удалось загрузить день');
        locations = [];
        return;
    }

    const data = await response.json();

    if (!isLive)
        locations = data;
}

async function FetchLiveUpdates() {
    const lastTime = (locations.length > 0) ? locations[locations.length-1].time : 0;

    let response;
    try {
        response = await fetch(
            FETCH_LIVE_URL.replace('0', lastTime)
        );
        if (!response.ok) throw Error();
    } catch (error) {
        alert('Не удалось загрузить лайв данные');
        return;
    }

    const data = await response.json();
    
    if (isLive) {
        DrawLive(data);
        locations = locations.concat(data);
    }
}


/* Live mode */
async function CheckLiveUpdates() {
    calendar.setToday(false);
    timeline.setLive(false);
    await FetchLiveUpdates();
}

function UpdateElapsedTime() {
    if (locations.length == 0) {
        calendar.output.textContent = 'Нет данных';
    } else {
        const now = new Date();
        const currentTime = Math.floor(now.getTime()/1000 - now.getTimezoneOffset()*60);
        const elapsedTime = currentTime - locations[locations.length - 1].time;
        if (elapsedTime < 0) {
            // TODO пофиксить
            calendar.output.textContent = 'только что';
        } else
            calendar.output.textContent = `${Math.floor(elapsedTime)} сек назад`;
    }
}

async function StartLiveTimer() {
    if (liveUpdateTimerId === null)
        liveUpdateTimerId = setInterval(CheckLiveUpdates, LIVE_UPDATE_INTERVAL*1000);
    if (liveElapsedTimeTimerId === null)
        liveElapsedTimeTimerId = setInterval(UpdateElapsedTime, 1000);
    await CheckLiveUpdates();
    UpdateElapsedTime();
}

function StopLiveTimer() {
    clearInterval(liveUpdateTimerId);
    clearInterval(liveElapsedTimeTimerId);
    liveUpdateTimerId = null;
    liveElapsedTimeTimerId = null;
}

async function EnableLiveMode() {
    if (!isLive) {
        isLive = true;
        StartLiveTimer();
    }
}

function DisableLiveMode() {
    isLive = false;
    StopLiveTimer();
}


/* Events */
async function onVisibilityChange() {
    if (isLive) {
        if (document.hidden) StopLiveTimer();
        else StartLiveTimer();
    }
}

async function onTimelineChange() {
    if (GetSelectedTime()/60 >= Math.floor((new Date()).getTime()/1000/60)) {
        timeline.setLive(false);
        await EnableLiveMode();
        return;
    }

    if (isLive) {
        DisableLiveMode();
        calendar.output.textContent = 'Сегодня';
    }

    DrawHistory();
}

async function onCalendarChange() {
    map.clear();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (calendar.value.getTime() >= today.getTime()) {
        calendar.setToday(false);
        UpdateElapsedTime();
        await EnableLiveMode();
        return;
    }

    if (isLive)
        DisableLiveMode();

    await FetchDay();
    timeline.setValue(timeline.value);
}

calendar.input.addEventListener('change', onCalendarChange);
timeline.element.addEventListener('change', onTimelineChange);
document.addEventListener('visibilitychange', onVisibilityChange);

EnableLiveMode();