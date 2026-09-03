// Scroll-based fade-in animation
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

// Event countdown: Sept 17, 2026, 7:00 PM America/New_York
const COUNTDOWN_TZ = 'America/New_York';

function getTimeZoneOffsetMs(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(utcMs));

  const map = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') map[part.type] = part.value;
  });

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  return asUtc - utcMs;
}

function wallTimeToUtcMs(year, month, day, hour, minute, timeZone) {
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 3; i += 1) {
    const offset = getTimeZoneOffsetMs(utc, timeZone);
    utc = Date.UTC(year, month - 1, day, hour, minute, 0) - offset;
  }
  return utc;
}

const eventStartMs = wallTimeToUtcMs(2026, 9, 17, 19, 0, COUNTDOWN_TZ);
const daysEl = document.querySelector('[data-unit="days"]');
const hoursEl = document.querySelector('[data-unit="hours"]');
const minutesEl = document.querySelector('[data-unit="minutes"]');
const secondsEl = document.querySelector('[data-unit="seconds"]');
const countdownGrid = document.getElementById('countdown-timer');
const countdownEnded = document.getElementById('countdown-ended');

function pad(value) {
  return String(value).padStart(2, '0');
}

function updateCountdown() {
  const remaining = eventStartMs - Date.now();

  if (remaining <= 0) {
    if (countdownGrid) countdownGrid.hidden = true;
    if (countdownEnded) countdownEnded.hidden = false;
    return;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (daysEl) daysEl.textContent = pad(days);
  if (hoursEl) hoursEl.textContent = pad(hours);
  if (minutesEl) minutesEl.textContent = pad(minutes);
  if (secondsEl) secondsEl.textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);
