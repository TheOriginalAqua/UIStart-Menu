/* ------------------------------------------------------------------
   Training rooms

   Create a room with a name — the game generates a 5-digit join code.
   Anyone can open the room from the list and enter that code to join.

   Rooms live in localStorage under TRAINING_ROOMS_KEY so the list
   survives a refresh. When a backend exists, swap loadRooms/saveRooms
   for fetch calls and check the code server-side.
   ------------------------------------------------------------------ */

(function () {
  "use strict";

  const TRAINING_ROOMS_KEY = "policemp.trainingRooms";
  const CODE_LENGTH = 5;
  const MAX_ROOMS = 7;

  /* ---------- Elements ---------- */

  const $ = (id) => document.getElementById(id);

  const mainMenu = $("main-menu");
  const createScreen = $("create-room");
  const joinScreen = $("join-room");
  const codeScreen = $("room-code");

  if (!createScreen || !joinScreen || !codeScreen) {
    console.warn(
      "[trainingrooms] Missing markup — main.html needs the #create-room, " +
        "#join-room and #room-code screens."
    );
    return;
  }

  const nameStep = $("create-step-name");
  const codeStep = $("create-step-code");
  const nameInput = $("room-name-input");
  const createTitle = $("create-room-title");
  const createSub = $("create-room-sub");
  const createMessage = $("create-room-message");
  const createdName = $("created-room-name");
  const createdCode = $("created-code");
  const copyBtn = $("copy-code-btn");

  const roomListWrap = $("room-list-wrap");
  const roomCount = $("room-count");

  const joinStep = $("room-code-step");
  const joinName = $("join-room-name");
  const joinInput = $("join-code-input");
  const joinMessage = $("room-code-message");
  const joinBtn = $("join-code-btn");

  /* ---------- Screen + step transitions ---------- */

  function swapScreens(from, to) {
    if (typeof window.transitionScreens === "function") {
      window.transitionScreens(from, to);
      return;
    }
    from.hidden = true;
    to.hidden = false;
  }

  // Swaps the body of two screens while the back button and heading stay
  // put — used between create and join so nothing slides around.
  function swapStages(from, to) {
    const fromStage = from.querySelector(".stage");
    const toStage = to.querySelector(".stage");

    if (!fromStage || !toStage) {
      swapScreens(from, to);
      return;
    }

    fromStage.classList.add("fade-hidden");
    window.setTimeout(() => {
      from.hidden = true;
      fromStage.classList.remove("fade-hidden");

      toStage.classList.add("fade-hidden");
      to.hidden = false;
      void toStage.offsetWidth;
      toStage.classList.remove("fade-hidden");
    }, 300);
  }

  function swapSteps(from, to, after) {
    from.classList.add("is-out");
    window.setTimeout(() => {
      from.hidden = true;
      from.classList.remove("is-out");

      to.hidden = false;
      to.classList.add("is-in");
      void to.offsetWidth;
      to.classList.remove("is-in");
      if (after) after();
    }, 380);
  }

  /* ---------- Storage ---------- */

  let memoryRooms = null; // used when localStorage is unavailable

  function loadRooms() {
    if (memoryRooms) return memoryRooms.slice();
    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(TRAINING_ROOMS_KEY) || "[]"
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      memoryRooms = [];
      return [];
    }
  }

  function saveRooms(rooms) {
    try {
      window.localStorage.setItem(TRAINING_ROOMS_KEY, JSON.stringify(rooms));
      memoryRooms = null;
    } catch (error) {
      memoryRooms = rooms.slice();
    }
  }

  function generateCode(rooms) {
    const taken = new Set(rooms.map((room) => room.code));
    const span = Math.pow(10, CODE_LENGTH) - Math.pow(10, CODE_LENGTH - 1);
    const floor = Math.pow(10, CODE_LENGTH - 1);

    for (let attempt = 0; attempt < 200; attempt++) {
      const code = String(floor + Math.floor(Math.random() * span));
      if (!taken.has(code)) return code;
    }
    return String(floor + rooms.length); // every code taken is not realistic
  }

  /* ---------- Messages ---------- */

  function showMessage(element, text, ok) {
    element.textContent = text;
    element.classList.toggle("is-ok", Boolean(ok));
    element.classList.add("is-shown");
  }

  function clearMessage(element) {
    element.classList.remove("is-shown", "is-ok");
  }

  function shake(element) {
    element.classList.remove("shake");
    void element.offsetWidth;
    element.classList.add("shake");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character]));
  }

  /* ---------- Create ---------- */

  function resetCreate() {
    nameInput.value = "";
    nameInput.classList.remove("is-invalid");
    clearMessage(createMessage);
    createTitle.textContent = "Create a training room";
    createSub.textContent = "Name the room and generate a join code";
    codeStep.hidden = true;
    nameStep.hidden = false;
    nameStep.classList.remove("is-out", "is-in");
    if (copyBtn) copyBtn.textContent = "Copy code";
  }

  function renderCode(code) {
    createdCode.innerHTML = "";
    code.split("").forEach((digit, index) => {
      const cell = document.createElement("span");
      cell.className = "code-digit";
      cell.textContent = digit;
      cell.style.animationDelay = `${index * 60}ms`;
      createdCode.appendChild(cell);
    });
  }

  nameStep.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const rooms = loadRooms();

    if (name.length < 3) {
      nameInput.classList.add("is-invalid");
      nameInput.focus();
      showMessage(createMessage, "Room names need at least 3 characters.");
      return;
    }

    if (rooms.length >= MAX_ROOMS) {
      showMessage(
        createMessage,
        `Maximum room capacity met, wait till a room is closed before creating another.`
      );
      return;
    }

    if (rooms.some((room) => room.name.toLowerCase() === name.toLowerCase())) {
      nameInput.classList.add("is-invalid");
      nameInput.select();
      showMessage(createMessage, "A room with that name is already open.");
      return;
    }

    const room = {
      id: `room_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      name,
      host: window.playerName || "User",
      code: generateCode(rooms),
      created: Date.now(),
    };

    rooms.push(room);
    saveRooms(rooms);

    nameInput.classList.remove("is-invalid");
    clearMessage(createMessage);
    createdName.textContent = room.name;
    renderCode(room.code);

    createTitle.textContent = "Room created";
    createSub.textContent = "Share this code with your trainees";
    swapSteps(nameStep, codeStep);
  });

  nameInput.addEventListener("input", () => {
    nameInput.classList.remove("is-invalid");
    clearMessage(createMessage);
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const code = createdCode.textContent.trim();
      const done = () => {
        copyBtn.textContent = "Copied";
        window.setTimeout(() => {
          copyBtn.textContent = "Copy code";
        }, 1600);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done, () => {});
        return;
      }

      const scratch = document.createElement("textarea");
      scratch.value = code;
      document.body.appendChild(scratch);
      scratch.select();
      try {
        document.execCommand("copy");
        done();
      } catch (error) {
        /* clipboard unavailable — the code is on screen anyway */
      }
      document.body.removeChild(scratch);
    });
  }

  /* ---------- Room list ---------- */

  const closeIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12"></path>
    </svg>`;

  // Whoever created the room. Swap window.playerName for the real account
  // name once accounts exist.
  function hostName(room) {
    return (room && room.host) || window.playerName || "User";
  }

  function renderRooms() {
    const rooms = loadRooms().sort((a, b) => b.created - a.created);
    roomListWrap.innerHTML = "";

    // Optional — the join screen works with or without a count line.
    if (roomCount) {
      roomCount.textContent = rooms.length
        ? `${rooms.length} room${rooms.length === 1 ? "" : "s"} open`
        : "No rooms open";
    }

    if (!rooms.length) {
      const empty = document.createElement("div");
      empty.className = "room-empty";
      empty.innerHTML = `
        <div class="room-empty-title">Nothing running yet</div>
        <p class="room-empty-text">Create a room and it appears here for anyone with its code.</p>
      `;

      const create = document.createElement("button");
      create.type = "button";
      create.className = "action";
      create.style.marginTop = "calc(28 * var(--u))";
      create.textContent = "Create a room";
      create.addEventListener("click", openCreate);
      empty.appendChild(create);

      roomListWrap.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "room-list";

    rooms.forEach((room) => {
      const item = document.createElement("div");
      item.className = "room-item";
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `Join ${room.name}`);
      item.innerHTML = `
        <span class="room-body">
          <span class="room-name">${escapeHtml(room.name)}</span>
          <span class="room-meta">Created by ${escapeHtml(hostName(room))}</span>
        </span>
      `;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "room-delete";
      remove.setAttribute("aria-label", `Close ${room.name}`);
      remove.innerHTML = closeIcon;
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!window.confirm(`Close "${room.name}"? Its code stops working.`)) return;
        saveRooms(loadRooms().filter((entry) => entry.id !== room.id));
        renderRooms();
      });
      item.appendChild(remove);

      const open = () => openCodeScreen(room);
      item.addEventListener("click", open);
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });

      list.appendChild(item);
    });

    roomListWrap.appendChild(list);
  }

  /* ---------- Join ---------- */

  let pendingRoom = null;

  function roomCodeMatches(room, attempt) {
    return String(room.code) === attempt;
  }

  function openCodeScreen(room) {
    pendingRoom = room;
    joinName.textContent = room.name;
    joinInput.value = "";
    joinInput.classList.remove("is-invalid");
    joinBtn.disabled = true;
    clearMessage(joinMessage);

    swapScreens(joinScreen, codeScreen);
    window.setTimeout(() => joinInput.focus(), 340);
  }

  joinInput.addEventListener("input", () => {
    const digits = joinInput.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    joinInput.value = digits;
    joinInput.classList.remove("is-invalid");
    clearMessage(joinMessage);
    joinBtn.disabled = digits.length !== CODE_LENGTH;

    // Full code typed — try it without making them reach for the button.
    if (digits.length === CODE_LENGTH) {
      window.setTimeout(() => {
        if (joinInput.value.length === CODE_LENGTH) attemptJoin();
      }, 180);
    }
  });

  joinStep.addEventListener("submit", (event) => {
    event.preventDefault();
    attemptJoin();
  });

  function attemptJoin() {
    if (!pendingRoom) return;
    const attempt = joinInput.value;
    if (attempt.length !== CODE_LENGTH) return;

    if (!roomCodeMatches(pendingRoom, attempt)) {
      joinInput.classList.add("is-invalid");
      joinInput.select();
      joinBtn.disabled = true;
      showMessage(joinMessage, "That code does not match this room.");
      shake(joinStep);
      return;
    }

    showMessage(joinMessage, "Code accepted — joining", true);
    joinBtn.disabled = true;
    window.setTimeout(() => enterTrainingRoom(pendingRoom), 480);
  }

  // Hook this up to whatever loads the room once the game side exists.
  function enterTrainingRoom(room) {
    console.log(`Joining training room "${room.name}" (code ${room.code})`);
    window.dispatchEvent(
      new CustomEvent("trainingroom:joined", { detail: { room } })
    );
  }

  /* ---------- Navigation ---------- */

  function openCreate(from) {
    resetCreate();
    swapScreens(from && from.nodeType ? from : joinScreen, createScreen);
    window.setTimeout(() => nameInput.focus(), 340);
  }

  function openRooms(from, keepFrame) {
    renderRooms();
    if (keepFrame) swapStages(from, joinScreen);
    else swapScreens(from, joinScreen);
  }

  function menuLink(id, label) {
    return (
      $(id) ||
      Array.from(document.querySelectorAll(".menu-primary a")).find(
        (link) => link.textContent.trim().toLowerCase() === label
      )
    );
  }

  function onClick(target, handler) {
    const element = typeof target === "string" ? $(target) : target;
    if (!element) {
      if (typeof target === "string") console.warn(`[trainingrooms] #${target} not found.`);
      return;
    }
    element.addEventListener("click", (event) => {
      event.preventDefault();
      handler();
    });
  }

  onClick(menuLink("create-room-btn", "create a training room"), () =>
    openCreate(mainMenu)
  );
  onClick(menuLink("join-room-btn", "join a training room"), () =>
    openRooms(mainMenu)
  );

  onClick("create-room-back-btn", () => swapScreens(createScreen, mainMenu));
  onClick("create-room-cancel", () => swapScreens(createScreen, mainMenu));
  onClick("open-rooms-btn", () => openRooms(createScreen, true));
  onClick("join-room-back-btn", () => swapScreens(joinScreen, mainMenu));
  onClick("room-code-back-btn", () => {
    pendingRoom = null;
    openRooms(codeScreen);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!createScreen.hidden) swapScreens(createScreen, mainMenu);
    else if (!joinScreen.hidden) swapScreens(joinScreen, mainMenu);
    else if (!codeScreen.hidden) {
      pendingRoom = null;
      openRooms(codeScreen);
    }
  });

  resetCreate();
})();