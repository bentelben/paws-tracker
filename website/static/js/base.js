const menuButton = document.getElementById('menuButton');
const menuWrapper = document.getElementById('menuWrapper');
const statusWrapper = document.getElementById('statusWrapper');

const FETCH_STATUS_URL = statusWrapper.dataset.fetchUrl;
const STATUS_UPDATE_INTERVAL = Number(statusWrapper.dataset.updateInterval)*1000;

const status1 = document.getElementById('status1');
const status2 = document.getElementById('status2');

var statusUpdateTimer = null;

async function UpdateStatus() {
    const response = await fetch(FETCH_STATUS_URL);
    
    if (!response.ok) {
        alert('Не удалось загрузить статус');
        return;
    }

    const text = (await response.json()).text;

    status1.textContent = text;
    status2.textContent = text;
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden && statusUpdateTimer !== null) {
        clearInterval(statusUpdateTimer);
        statusUpdateTimer = null;
    } else if (!document.hidden && statusUpdateTimer === null) {
        statusUpdateTimer = setInterval(UpdateStatus, STATUS_UPDATE_INTERVAL);
        UpdateStatus();
    }
});
statusUpdateTimer = setInterval(UpdateStatus, STATUS_UPDATE_INTERVAL);
UpdateStatus();

menuButton.addEventListener('click', () => {
    menuWrapper.classList.toggle('shown');
});

document.querySelectorAll('.menu__item').forEach(element => {
    if (element.href === window.location.href)
        element.classList.add('active');
});