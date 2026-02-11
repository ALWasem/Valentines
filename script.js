(function () {
  "use strict";

  const HEART = "❤️";
  const DECOYS = ["🌸", "⭐", "🔶", "🔷", "💎", "🍀", "🌺", "🎀", "✨"];
  const TOTAL_CELLS = 9;
  const NUM_HEARTS = 3;

  const captchaScreen = document.getElementById("captcha-screen");
  const valentineScreen = document.getElementById("valentine-screen");
  const captchaGrid = document.getElementById("captcha-grid");
  const captchaHint = document.getElementById("captcha-hint");
  const verifyBtn = document.getElementById("verify-btn");
  const yesBtn = document.getElementById("yes-btn");
  const noBtn = document.getElementById("no-btn");
  const valentineResponse = document.getElementById("valentine-response");

  let heartIndices = [];
  let selectedIndices = new Set();

  function shuffle(array) {
    const out = array.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function initCaptcha() {
    heartIndices = [];
    selectedIndices = new Set();
    captchaGrid.innerHTML = "";
    captchaHint.textContent = "";
    verifyBtn.disabled = true;

    const indices = Array.from({ length: TOTAL_CELLS }, (_, i) => i);
    const shuffled = shuffle(indices);
    heartIndices = shuffled.slice(0, NUM_HEARTS).sort((a, b) => a - b);

    const decoysShuffled = shuffle([...DECOYS]);
    let decoyIndex = 0;

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "captcha-cell";
      cell.setAttribute("aria-label", heartIndices.includes(i) ? "Heart – select" : "Not a heart");
      const isHeart = heartIndices.includes(i);
      cell.textContent = isHeart ? HEART : decoysShuffled[decoyIndex++ % decoysShuffled.length];
      cell.dataset.index = String(i);
      cell.addEventListener("click", () => toggleCell(i, cell));
      captchaGrid.appendChild(cell);
    }
  }

  function toggleCell(index, cell) {
    if (!heartIndices.includes(index)) {
      captchaHint.textContent = "That’s not a heart. Select only the hearts!";
      return;
    }
    if (selectedIndices.has(index)) {
      selectedIndices.delete(index);
      cell.classList.remove("selected");
    } else {
      selectedIndices.add(index);
      cell.classList.add("selected");
    }
    captchaHint.textContent = "";
    updateVerifyButton();
  }

  function updateVerifyButton() {
    const allHeartsSelected =
      heartIndices.length > 0 &&
      heartIndices.every((i) => selectedIndices.has(i));
    verifyBtn.disabled = !allHeartsSelected;
  }

  function showValentineScreen() {
    captchaScreen.classList.remove("active");
    captchaScreen.setAttribute("aria-hidden", "true");
    valentineScreen.classList.add("active");
    valentineScreen.setAttribute("aria-hidden", "false");
  }

  function distancePointToRect(px, py, left, top, w, h) {
    const nearestX = Math.max(left, Math.min(px, left + w));
    const nearestY = Math.max(top, Math.min(py, top + h));
    return Math.hypot(px - nearestX, py - nearestY);
  }

  function rectsOverlap(aLeft, aTop, aW, aH, bLeft, bTop, bW, bH) {
    return aLeft < bLeft + bW && aLeft + aW > bLeft &&
           aTop < bTop + bH && aTop + aH > bTop;
  }

  function moveNoButton(ev) {
    const container = noBtn.closest(".valentine-buttons");
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();
    const bw = noBtn.offsetWidth;
    const bh = noBtn.offsetHeight;
    const cw = containerRect.width;
    const ch = containerRect.height;
    const noHalfDiag = Math.hypot(bw, bh) / 2;
    const minDistanceFromMouse = Math.max(bw, bh) * 1.5;
    const minCenterDistanceFromMouse = minDistanceFromMouse + noHalfDiag;
    const mouseX = ev && typeof ev.clientX === "number"
      ? ev.clientX - containerRect.left
      : null;
    const mouseY = ev && typeof ev.clientY === "number"
      ? ev.clientY - containerRect.top
      : null;
    const gap = 12;
    const yesLeft = yesRect.left - containerRect.left - gap;
    const yesTop = yesRect.top - containerRect.top - gap;
    const yesRight = yesRect.right - containerRect.left + gap;
    const yesBottom = yesRect.bottom - containerRect.top + gap;
    const yesW = yesRight - yesLeft;
    const yesH = yesBottom - yesTop;
    function noOverlapYes(l, t) {
      return !rectsOverlap(l, t, bw, bh, yesLeft, yesTop, yesW, yesH);
    }
    function farEnoughFromMouse(l, t) {
      if (mouseX == null || mouseY == null) return true;
      return distancePointToRect(mouseX, mouseY, l, t, bw, bh) >= minDistanceFromMouse;
    }
    function valid(l, t) {
      return noOverlapYes(l, t) && farEnoughFromMouse(l, t);
    }
    let left = 0;
    let top = 0;
    let found = false;
    if (mouseX != null && mouseY != null) {
      for (let attempt = 0; attempt < 80; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = minCenterDistanceFromMouse + Math.random() * Math.max(cw, ch) * 0.5;
        const centerX = mouseX + dist * Math.cos(angle);
        const centerY = mouseY + dist * Math.sin(angle);
        const candidateLeft = Math.max(0, Math.min(cw - bw, centerX - bw / 2));
        const candidateTop = Math.max(0, Math.min(ch - bh, centerY - bh / 2));
        if (valid(candidateLeft, candidateTop)) {
          left = candidateLeft;
          top = candidateTop;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      for (let attempt = 0; attempt < 200; attempt++) {
        const candidateLeft = Math.random() * Math.max(0, cw - bw);
        const candidateTop = Math.random() * Math.max(0, ch - bh);
        if (valid(candidateLeft, candidateTop)) {
          left = candidateLeft;
          top = candidateTop;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      for (let attempt = 0; attempt < 100; attempt++) {
        const candidateLeft = Math.random() * Math.max(0, cw - bw);
        const candidateTop = Math.random() * Math.max(0, ch - bh);
        if (noOverlapYes(candidateLeft, candidateTop)) {
          left = candidateLeft;
          top = candidateTop;
          found = true;
          break;
        }
      }
    }
    if (found) {
      noBtn.style.position = "absolute";
      noBtn.style.left = left + "px";
      noBtn.style.top = top + "px";
      noBtn.style.transform = "none";
    }
  }

  verifyBtn.addEventListener("click", function () {
    const allHeartsSelected =
      heartIndices.length > 0 &&
      heartIndices.every((i) => selectedIndices.has(i));
    if (allHeartsSelected) {
      showValentineScreen();
    }
  });

  noBtn.addEventListener("mouseenter", moveNoButton);
  noBtn.addEventListener("focus", function (e) { moveNoButton(e); });

  noBtn.addEventListener("click", function (e) {
    moveNoButton(e);
  });

  yesBtn.addEventListener("click", function () {
    valentineResponse.textContent = "Yay! Happy Valentine’s Day! 💕";
    yesBtn.style.display = "none";
    noBtn.style.display = "none";
  });

  initCaptcha();
})();
