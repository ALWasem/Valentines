(function () {
  "use strict";

  const GRID_SIZE = 3;
  const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

  const captchaScreen = document.getElementById("captcha-screen");
  const valentineScreen = document.getElementById("valentine-screen");
  const captchaGrid = document.getElementById("captcha-grid");
  const captchaHint = document.getElementById("captcha-hint");
  const moveCounter = document.getElementById("move-counter");
  const verifyBtn = document.getElementById("verify-btn");
  const yesBtn = document.getElementById("yes-btn");
  const noBtn = document.getElementById("no-btn");
  const valentineResponse = document.getElementById("valentine-response");

  let tiles = []; // tiles[position] = tileId
  let moves = 0;
  let solved = false;
  let tileCanvases = [];
  let dragSourcePos = null;

  /* ── Image loading & square crop ── */

  function loadImage() {
    return new Promise(function (resolve, reject) {
      var img = document.getElementById("puzzle-photo");
      if (!img) { reject("No image element found"); return; }
      if (img.complete && img.naturalWidth > 0) { resolve(img); return; }
      img.onload = function () { resolve(img); };
      img.onerror = reject;
    });
  }

  function cropSquare(img) {
    const size = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - size) / 2;
    const sy = (img.naturalHeight - size) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.getContext("2d").drawImage(img, sx, sy, size, size, 0, 0, size, size);
    return canvas;
  }

  function sliceTiles(squareCanvas) {
    const tileSize = squareCanvas.width / GRID_SIZE;
    const canvases = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const col = i % GRID_SIZE;
      const row = Math.floor(i / GRID_SIZE);
      const c = document.createElement("canvas");
      c.width = tileSize;
      c.height = tileSize;
      c.getContext("2d").drawImage(
        squareCanvas,
        col * tileSize, row * tileSize, tileSize, tileSize,
        0, 0, tileSize, tileSize
      );
      canvases.push(c.toDataURL());
    }
    return canvases;
  }

  /* ── Puzzle logic ── */

  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function isSolved(arr) {
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (arr[i] !== i) return false;
    }
    return true;
  }

  function generatePuzzle() {
    var arr;
    do {
      arr = shuffle(Array.from({ length: TOTAL_CELLS }, function (_, i) { return i; }));
    } while (isSolved(arr));
    return arr;
  }

  function swapTiles(posA, posB) {
    if (solved || posA === posB) return;
    var tmp = tiles[posA];
    tiles[posA] = tiles[posB];
    tiles[posB] = tmp;
    moves++;
    moveCounter.textContent = "Moves: " + moves;
    renderGrid();

    if (isSolved(tiles)) {
      solved = true;
      captchaHint.textContent = "Puzzle complete!";
      verifyBtn.disabled = false;
      renderGrid();
    }
  }

  /* ── Rendering ── */

  function renderGrid() {
    captchaGrid.innerHTML = "";
    for (let pos = 0; pos < TOTAL_CELLS; pos++) {
      const tileId = tiles[pos];
      const cell = document.createElement("div");
      cell.className = "captcha-cell";
      cell.draggable = !solved;
      cell.style.backgroundImage = "url('" + tileCanvases[tileId] + "')";
      cell.style.backgroundSize = "cover";
      cell.setAttribute("aria-label", "Tile " + (tileId + 1));
      cell.dataset.pos = String(pos);

      if (solved) {
        cell.classList.add("solved");
        cell.draggable = false;
      } else if (tileId === pos) {
        cell.classList.add("correct");
      }

      // Drag events
      cell.addEventListener("dragstart", function (e) {
        dragSourcePos = pos;
        cell.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(pos));
      });

      cell.addEventListener("dragend", function () {
        cell.classList.remove("dragging");
        dragSourcePos = null;
        clearDropHighlights();
      });

      cell.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragSourcePos !== null && dragSourcePos !== pos) {
          cell.classList.add("drag-over");
        }
      });

      cell.addEventListener("dragleave", function () {
        cell.classList.remove("drag-over");
      });

      cell.addEventListener("drop", function (e) {
        e.preventDefault();
        cell.classList.remove("drag-over");
        var srcPos = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (!isNaN(srcPos) && srcPos !== pos) {
          swapTiles(srcPos, pos);
        }
      });

      // Touch support
      cell.addEventListener("touchstart", handleTouchStart, { passive: false });
      cell.addEventListener("touchmove", handleTouchMove, { passive: false });
      cell.addEventListener("touchend", handleTouchEnd, { passive: false });

      captchaGrid.appendChild(cell);
    }
  }

  /* ── Touch drag support ── */

  let touchDragEl = null;
  let touchSourcePos = null;
  let touchClone = null;
  let touchStartX = 0;
  let touchStartY = 0;

  function handleTouchStart(e) {
    if (solved) return;
    const touch = e.touches[0];
    const cell = e.currentTarget;
    touchSourcePos = parseInt(cell.dataset.pos, 10);
    touchDragEl = cell;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    // Create a floating clone
    touchClone = cell.cloneNode(true);
    touchClone.className = "captcha-cell touch-clone";
    const rect = cell.getBoundingClientRect();
    touchClone.style.width = rect.width + "px";
    touchClone.style.height = rect.height + "px";
    touchClone.style.left = (touch.clientX - rect.width / 2) + "px";
    touchClone.style.top = (touch.clientY - rect.height / 2) + "px";
    document.body.appendChild(touchClone);

    cell.classList.add("dragging");
    e.preventDefault();
  }

  function handleTouchMove(e) {
    if (!touchClone) return;
    const touch = e.touches[0];
    const rect = touchClone.getBoundingClientRect();
    touchClone.style.left = (touch.clientX - rect.width / 2) + "px";
    touchClone.style.top = (touch.clientY - rect.height / 2) + "px";

    // Highlight the cell under the finger
    clearDropHighlights();
    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elUnder && elUnder.classList.contains("captcha-cell") && elUnder !== touchDragEl) {
      elUnder.classList.add("drag-over");
    }
    e.preventDefault();
  }

  function handleTouchEnd(e) {
    if (touchClone) {
      document.body.removeChild(touchClone);
      touchClone = null;
    }
    if (touchDragEl) {
      touchDragEl.classList.remove("dragging");
    }
    clearDropHighlights();

    const touch = e.changedTouches[0];
    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elUnder && elUnder.classList.contains("captcha-cell") && elUnder.dataset.pos !== undefined) {
      var targetPos = parseInt(elUnder.dataset.pos, 10);
      if (touchSourcePos !== null && targetPos !== touchSourcePos) {
        swapTiles(touchSourcePos, targetPos);
      }
    }

    touchDragEl = null;
    touchSourcePos = null;
    e.preventDefault();
  }

  function clearDropHighlights() {
    var cells = captchaGrid.querySelectorAll(".drag-over");
    for (var i = 0; i < cells.length; i++) {
      cells[i].classList.remove("drag-over");
    }
  }

  /* ── Init ── */

  function initCaptcha() {
    moves = 0;
    solved = false;
    moveCounter.textContent = "Moves: 0";
    captchaHint.textContent = "Drag a tile onto another to swap them";
    verifyBtn.disabled = true;

    loadImage().then(function (img) {
      const square = cropSquare(img);
      tileCanvases = sliceTiles(square);
      tiles = generatePuzzle();
      renderGrid();
    }).catch(function () {
      captchaHint.textContent = "Could not load image.";
    });
  }

  /* ── Screen transition ── */

  function showValentineScreen() {
    captchaScreen.classList.remove("active");
    captchaScreen.setAttribute("aria-hidden", "true");
    valentineScreen.classList.add("active");
    valentineScreen.setAttribute("aria-hidden", "false");
  }

  verifyBtn.addEventListener("click", function () {
    if (solved) showValentineScreen();
  });

  /* ── No-button evasion ── */

  /*
    Both buttons are position:absolute inside .valentine-buttons.
    JS places Yes once (centered, never moves), then cycles No
    through fixed spots that never overlap Yes or the heading.
    All coordinates are relative to .valentine-buttons container.
  */

  var buttonsContainer = document.getElementById("valentine-buttons");
  var BTN_W = 100; // matches CSS width
  var BTN_H = 44;  // matches CSS height
  var noPosIndex = -1;

  function initValentineButtons() {
    var box = buttonsContainer.getBoundingClientRect();
    var containerW = box.width;
    var containerH = buttonsContainer.offsetHeight; // 160px from CSS

    // Place Yes: horizontally centered, vertically at top
    var yesLeft = (containerW / 2) - BTN_W / 2;
    yesBtn.style.left = yesLeft + "px";
    yesBtn.style.top = "0px";

    // Place No: right next to Yes initially
    noBtn.style.left = (yesLeft + BTN_W + 16) + "px";
    noBtn.style.top = "0px";
  }

  function moveNoButton() {
    var containerW = buttonsContainer.offsetWidth;
    var containerH = buttonsContainer.offsetHeight;

    // Yes button position (fixed, never changes after init)
    var yesLeft = parseFloat(yesBtn.style.left);
    var yesTop = parseFloat(yesBtn.style.top);

    // Build list of valid spots inside the container
    // Spots are pixel positions [left, top]
    var pad = 4;
    var spots = [
      [pad, pad],                                         // top-left
      [containerW - BTN_W - pad, pad],                    // top-right
      [pad, containerH - BTN_H - pad],                    // bottom-left
      [containerW - BTN_W - pad, containerH - BTN_H - pad], // bottom-right
      [(containerW - BTN_W) / 2, containerH - BTN_H - pad], // bottom-center
      [pad, (containerH - BTN_H) / 2],                   // mid-left
      [containerW - BTN_W - pad, (containerH - BTN_H) / 2], // mid-right
    ];

    // Filter out any spot that overlaps Yes button
    var margin = 16;
    var valid = [];
    for (var i = 0; i < spots.length; i++) {
      var sl = spots[i][0], st = spots[i][1];
      var overlaps = !(
        sl + BTN_W + margin <= yesLeft ||
        sl >= yesLeft + BTN_W + margin ||
        st + BTN_H + margin <= yesTop ||
        st >= yesTop + BTN_H + margin
      );
      if (!overlaps) valid.push(spots[i]);
    }

    if (valid.length === 0) valid = spots; // fallback

    // Cycle to next valid position
    noPosIndex = (noPosIndex + 1) % valid.length;
    noBtn.style.left = valid[noPosIndex][0] + "px";
    noBtn.style.top = valid[noPosIndex][1] + "px";
  }

  noBtn.addEventListener("mouseenter", moveNoButton);
  noBtn.addEventListener("click", moveNoButton);
  noBtn.addEventListener("touchstart", function (e) {
    e.preventDefault();
    moveNoButton();
  });

  yesBtn.addEventListener("click", function () {
    valentineResponse.textContent = "Yay! Happy Valentine's Day! \uD83D\uDC95";
    yesBtn.style.display = "none";
    noBtn.style.display = "none";
  });

  // Position buttons when valentine screen becomes visible
  var observer = new MutationObserver(function () {
    if (valentineScreen.classList.contains("active")) {
      initValentineButtons();
      observer.disconnect();
    }
  });
  observer.observe(valentineScreen, { attributes: true, attributeFilter: ["class"] });

  initCaptcha();
})();
