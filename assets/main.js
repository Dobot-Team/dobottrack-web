"use strict";
document.getElementById("copy-citation").addEventListener("click", async () => {
  const text = document.getElementById("bibtex").textContent;
  const status = document.getElementById("copy-status");
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = "BibTeX copied.";
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.getElementById("bibtex"));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = "Citation selected. Press Ctrl+C (or ⌘C) to copy.";
  }
});

function initializeVideoSlider(prefix) {
  const track = document.getElementById(`${prefix}-track`);
  if (!track) return;
  const stage = track.closest(".video-stage");
  const cards = [...track.querySelectorAll(".simulation-example")];
  const videos = cards.map(card => card.querySelector("video"));
  const previous = document.getElementById(`${prefix}-prev`);
  const next = document.getElementById(`${prefix}-next`);
  let active = 0;
  let visible = false;
  let touch = null;

  function playActive() {
    if (visible) videos[active].play().catch(() => {});
  }
  function render(play = false) {
    const width = cards[active].offsetWidth;
    const video = videos[active];
    const ratio = Number(video.getAttribute("width")) / Number(video.getAttribute("height"));
    const mediaHeight = Math.min(width / ratio, window.innerHeight * .68);
    stage.style.setProperty("--media-height", `${mediaHeight}px`);
    const caption = cards[active].querySelector("figcaption");
    stage.style.setProperty("--stage-height", `${mediaHeight + (caption ? caption.offsetHeight + 20 : 0)}px`);
    cards.forEach((card, i) => {
      let delta = (i - active + cards.length) % cards.length;
      if (delta > cards.length / 2) delta -= cards.length;
      card.style.setProperty("--card-offset", `${delta * (width + 32)}px`);
      card.style.setProperty("--card-angle", `${delta === 0 ? 0 : delta > 0 ? -8 : 8}deg`);
      card.classList.toggle("is-active", i === active);
      card.classList.toggle("is-distant", Math.abs(delta) > 2);
      card.dataset.active = String(i === active);
      card.style.zIndex = String(5 - Math.abs(delta));
      videos[i].controls = i === active;
      videos[i].tabIndex = i === active ? 0 : -1;
      if (i !== active) videos[i].pause();
    });
    track.dataset.activeIndex = String(active);
    if (play) playActive();
  }
  function select(index) {
    active = (index + cards.length) % cards.length;
    render(true);
  }
  previous.addEventListener("click", () => select(active - 1));
  next.addEventListener("click", () => select(active + 1));
  cards.forEach((card, i) => {
    card.addEventListener("click", () => { if (i !== active) select(i); });
    videos[i].addEventListener("play", () => {
      document.querySelectorAll("video").forEach(other => { if (other !== videos[i]) other.pause(); });
    });
  });
  track.addEventListener("keydown", event => {
    if (event.target !== track) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault(); select(active + (event.key === "ArrowRight" ? 1 : -1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault(); select(event.key === "Home" ? 0 : cards.length - 1);
    }
  });
  track.addEventListener("touchstart", event => {
    if (event.touches.length === 1) touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  track.addEventListener("touchend", event => {
    if (!touch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) select(active + (dx < 0 ? 1 : -1));
    touch = null;
  }, { passive: true });
  track.addEventListener("touchcancel", () => { touch = null; }, { passive: true });
  new ResizeObserver(() => render()).observe(stage);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .35;
    if (!visible) videos.forEach(video => video.pause());
  }, { threshold: [0, .35] }).observe(track);
  render();
}
initializeVideoSlider("simulation");
initializeVideoSlider("real-world");
