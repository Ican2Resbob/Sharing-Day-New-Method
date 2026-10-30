/* =========================================================
   My Journey at AIS · Presentation controller
   - Previous / Next buttons and navigation dots
   - Keyboard: ← → PageUp PageDown Space Home End, F for fullscreen
   - Touch swipe for tablets and phones
   - Progress bar, slide counter, URL hash (#3 opens slide 3)
   ========================================================= */

(function () {
  "use strict";

  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var total = slides.length;
  var current = 0;

  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");
  var dotsWrap = document.getElementById("dots");
  var counter = document.getElementById("counter");
  var progressBar = document.getElementById("progressBar");
  var fsBtn = document.getElementById("fullscreenBtn");
  var fsLabel = document.getElementById("fullscreenLabel");
  var deck = document.getElementById("deck");

  var dots = [];

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /* Build one navigation dot per slide */
  function buildDots() {
    slides.forEach(function (slide, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Go to slide " + (i + 1) + ": " + (slide.dataset.title || ""));
      dot.title = (i + 1) + " · " + (slide.dataset.title || "");
      dot.addEventListener("click", function () {
        goTo(i);
      });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });
  }

  /* Show slide at index, with direction-aware transition classes */
  function goTo(index) {
    if (index < 0 || index >= total || index === current) return;
    slides.forEach(function (slide, i) {
      slide.classList.remove("active", "past");
      if (i < index) slide.classList.add("past");
    });
    slides[index].classList.add("active");
    current = index;
    render();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  /* Update UI elements that depend on the current slide */
  function render() {
    dots.forEach(function (dot, i) {
      dot.classList.toggle("active", i === current);
      dot.setAttribute("aria-selected", i === current ? "true" : "false");
    });
    counter.textContent = pad(current + 1) + " / " + pad(total);
    progressBar.style.width = ((current + 1) / total) * 100 + "%";
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    nextBtn.textContent = current === total - 1 ? "Finish" : "Next →";
    nextBtn.setAttribute("aria-label", current === total - 1 ? "Last slide" : "Next slide");

    if (history.replaceState) {
      history.replaceState(null, "", "#" + (current + 1));
    }
    /* Make the scrollable slide start from the top when it becomes active */
    if (slides[current]) slides[current].scrollTop = 0;
  }

  /* Fullscreen: request on the deck element, keep the label in sync */
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function toggleFullscreen() {
    if (!isFullscreen()) {
      var req = deck.requestFullscreen || deck.webkitRequestFullscreen;
      if (req) {
        var p = req.call(deck);
        if (p && p.catch) p.catch(function () {});
      }
    } else {
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
    }
  }

  function syncFullscreenLabel() {
    var on = isFullscreen();
    fsLabel.textContent = on ? "Exit fullscreen" : "Fullscreen";
    fsBtn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  /* Keyboard navigation */
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    /* A focused button already handles Space/Enter itself; avoid a double step */
    if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case " ":
      case "Enter":
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
      case "Backspace":
        e.preventDefault();
        prev();
        break;
      case "Home":
        e.preventDefault();
        goTo(0);
        break;
      case "End":
        e.preventDefault();
        goTo(total - 1);
        break;
      case "f":
      case "F":
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleFullscreen();
        }
        break;
      default:
        break;
    }
  });

  /* Touch swipe (horizontal gestures only) */
  var touchStartX = null;
  var touchStartY = null;
  deck.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  deck.addEventListener("touchend", function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    touchStartX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next(); else prev();
    }
  }, { passive: true });

  /* Wire up buttons */
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  fsBtn.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", syncFullscreenLabel);
  document.addEventListener("webkitfullscreenchange", syncFullscreenLabel);

  /* Start: honour #N in the URL, otherwise slide 1 */
  function startIndex() {
    var n = parseInt((location.hash || "").replace("#", ""), 10);
    if (!isNaN(n) && n >= 1 && n <= total) return n - 1;
    return 0;
  }

  buildDots();
  var start = startIndex();
  slides.forEach(function (slide, i) {
    slide.classList.toggle("active", i === start);
    slide.classList.toggle("past", i < start);
  });
  current = start;
  render();
  syncFullscreenLabel();
})();
