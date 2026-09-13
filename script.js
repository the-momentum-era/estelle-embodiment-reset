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

// Testimonial carousel: gentle right-to-left auto-loop, arrows, dots, swipe
(function () {
  const carousel = document.getElementById('tCarousel');
  if (!carousel) return;

  const viewport = carousel.querySelector('.carousel-viewport');
  const track = carousel.querySelector('.carousel-track');
  const dotsWrap = carousel.querySelector('.carousel-dots');
  const prevBtn = carousel.querySelector('.carousel-arrow.prev');
  const nextBtn = carousel.querySelector('.carousel-arrow.next');

  const realSlides = Array.from(track.children);
  const total = realSlides.length;
  if (total < 2) return; // nothing to slide

  // Clones for seamless looping in both directions
  const firstClone = realSlides[0].cloneNode(true);
  const lastClone = realSlides[total - 1].cloneNode(true);
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  track.insertBefore(lastClone, realSlides[0]);
  track.appendChild(firstClone);

  const TRANSITION = 'transform 0.6s ease';
  const DURATION = 640; // ms; snap fallback slightly > transition
  let pos = 1;          // first real slide (index 0 is the last-slide clone)
  let animating = false;
  let snapTimer = null;

  function apply(animate) {
    track.style.transition = animate ? TRANSITION : 'none';
    track.style.transform = 'translateX(' + (-pos * 100) + '%)';
  }

  function realIndex() {
    if (pos === 0) return total - 1;
    if (pos === total + 1) return 0;
    return pos - 1;
  }
  function updateDots() {
    const ri = realIndex();
    for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('active', i === ri);
  }

  // Settle after a move: normalise clone positions, release the lock.
  function settle() {
    if (snapTimer) { clearTimeout(snapTimer); snapTimer = null; }
    if (pos === total + 1) { pos = 1; apply(false); }
    else if (pos === 0) { pos = total; apply(false); }
    updateDots();
    animating = false;
  }
  // Guarded move: one slide in flight at a time; timer guarantees settle
  // even if transitionend never fires (e.g. hidden/backgrounded tab).
  function move(step) {
    if (animating) return;
    animating = true;
    pos += step;
    apply(true);
    updateDots();
    snapTimer = setTimeout(settle, DURATION);
  }
  function goTo(target) {
    if (animating || target === pos) return;
    animating = true;
    pos = target;
    apply(true);
    updateDots();
    snapTimer = setTimeout(settle, DURATION);
  }
  function next() { move(1); }
  function prev() { move(-1); }

  track.addEventListener('transitionend', function (e) {
    if (e.propertyName === 'transform' && animating) settle();
  });

  // Pagination dots
  const dots = [];
  for (let i = 0; i < total; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Testimonial ' + (i + 1));
    b.addEventListener('click', function () { stop(); goTo(i + 1); start(); });
    dotsWrap.appendChild(b);
    dots.push(b);
  }

  // Autoplay (respects reduced-motion preference)
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = null;
  let hovering = false;
  const DELAY = 4500;
  function start() { if (!reduceMotion && !hovering && !timer) timer = setInterval(next, DELAY); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  nextBtn.addEventListener('click', function () { stop(); next(); start(); });
  prevBtn.addEventListener('click', function () { stop(); prev(); start(); });

  // Pause on hover (desktop) and when the tab is hidden
  carousel.addEventListener('mouseenter', function () { hovering = true; stop(); });
  carousel.addEventListener('mouseleave', function () { hovering = false; start(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  // Swipe gestures (mobile)
  let startX = 0, dx = 0, swiping = false;
  viewport.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX; dx = 0; swiping = true; stop();
  }, { passive: true });
  viewport.addEventListener('touchmove', function (e) {
    if (swiping) dx = e.touches[0].clientX - startX;
  }, { passive: true });
  viewport.addEventListener('touchend', function () {
    if (!swiping) return;
    swiping = false;
    if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); }
    start();
  });

  apply(false);
  updateDots();
  start();
})();
