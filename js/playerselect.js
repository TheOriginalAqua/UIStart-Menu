const unlockedRoles = ["police", "ambulance", "fire", "auxiliary", "flight", "civilian"];


const roleData = {
  police: {
    label: "Select your Division",
    subroles: [
      "Emergency Response Team",
      "Dog Support Unit",
      "Criminal Investigation Department",
      "Roads Transport Policing Command",
      "Authorised Firearms Officer",
    ],
  },
  ambulance: {
    label: "Select your Division",
    subroles: [
      "Paramedic",
      "Hazardous Area Response Team",
      "Helicopter Emergency Medical Service",
    ],
  },
  fire: {
    label: "Select your Division",
    subroles: ["London Fire Fighter", "Fire Rescue Unit"],
  },
  auxiliary: {
    label: "Select your Division",
    subroles: ["Control Room", "National Highways Team"],
  }
};

const subdivisionData = {
  police: {
    "Emergency Response Team": ["Beat Response", "Rapid Response Unit", "Tactical Support", "Custody Escort"],
    "Dog Support Unit": ["General Purpose Dogs", "Firearms Support Dogs", "Search & Detection"],
    "Criminal Investigation Department": ["Major Investigation Team", "Fraud Unit", "Cyber Crime Unit"],
    "Roads Transport Policing Command": ["Traffic Patrol", "Collision Investigation", "ANPR Interceptor"],
    "Authorised Firearms Officer": ["Armed Response Vehicle", "Firearms Support", "Close Protection"],
  },
  ambulance: {
    "Paramedic": ["Frontline Paramedic", "Rapid Response Car", "Community First Responder"],
    "Hazardous Area Response Team": ["HART Operative", "Water Rescue", "Marauding Attack Response"],
    "Helicopter Emergency Medical Service": ["Flight Paramedic", "Critical Care Doctor", "Winchman"],
  },
  fire: {
    "London Fire Fighter": ["Pump Crew", "Breathing Apparatus", "Community Safety"],
    "Fire Rescue Unit": ["Urban Search & Rescue", "Technical Rescue", "Water Rescue Unit"],
  },
  auxiliary: {
    "Control Room": ["Dispatcher", "Call Handler"],
    "National Highways Team": ["Traffic Officer", "Incident Support Unit"],
  },
};

const mainMenu = document.getElementById("main-menu");
const roleSelect = document.getElementById("role-select");
const subRoleSelect = document.getElementById("sub-role-select");
const subRoleTitle = document.getElementById("sub-role-title");
const subRoleList = document.getElementById("sub-role-list");
const subdivisionSelect = document.getElementById("subdivision-select");
const subdivisionTitle = document.getElementById("subdivision-title");
const subdivisionTrack = document.getElementById("subdivision-track");
const subdivisionViewport = subdivisionTrack.parentElement;
const subdivisionArrowLeft = document.getElementById("subdivision-arrow-left");
const subdivisionArrowRight = document.getElementById("subdivision-arrow-right");

const playBtn = document.getElementById("play-btn");
const roleBackBtn = document.getElementById("role-back-btn");
const subRoleBackBtn = document.getElementById("sub-role-back-btn");
const subdivisionBackBtn = document.getElementById("subdivision-back-btn");
const roleItems = document.querySelectorAll(".role-item");

function transitionScreens(from, to, exitClass = "screen-exit", enterClass = "screen-enter") {
  from.classList.add(exitClass);
  from.addEventListener(
    "transitionend",
    () => {
      from.hidden = true;
      from.classList.remove(exitClass);
    },
    { once: true }
  );

  to.hidden = false;
  to.classList.add(enterClass);
  void to.offsetWidth;
  to.classList.remove(enterClass);
}

function showRoleSelect(event) {
  event.preventDefault();
  transitionScreens(mainMenu, roleSelect);
}

function showMainMenu(event) {
  event.preventDefault();
  transitionScreens(roleSelect, mainMenu);
}

/* onSwap receives a `reveal` callback. The incoming screen is mounted
   but still transparent when it runs, so anything that needs to measure
   or position itself can do so unseen and call reveal() when it's
   settled. Previously the fade-in was started first and onSwap ran
   after, so the carousel was laying its cards out while the stage was
   already fading up — you could watch them arrive mid-fade. */
function fadeContentSwap(from, to, onSwap) {
  const fadeSelector = ".brand, .role-list-wrap, .sub-role-list-wrap, .subdivision-carousel-wrap";
  const fromContent = from.querySelectorAll(fadeSelector);
  const toContent = to.querySelectorAll(fadeSelector);

  fromContent.forEach((el) => el.classList.add("fade-hidden"));

  const swap = () => {
    from.hidden = true;
    fromContent.forEach((el) => el.classList.remove("fade-hidden"));

    to.hidden = false;
    toContent.forEach((el) => el.classList.add("fade-hidden"));
    void to.offsetWidth;

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      toContent.forEach((el) => el.classList.remove("fade-hidden"));
    };

    if (onSwap) onSwap(reveal);
    else reveal();
  };

  if (fromContent.length) {
    fromContent[0].addEventListener("transitionend", swap, { once: true });
  } else {
    swap();
  }
}

function showSubRoleSelect(role) {
  const data = roleData[role];
  if (!data) return;

  subRoleTitle.textContent = data.label;
  subRoleList.dataset.role = role;
  subRoleList.innerHTML = "";

  data.subroles.forEach((subrole) => {
    const link = document.createElement("a");
    link.href = "#";
    link.className = "sub-role-item";

    const label = document.createElement("span");
    label.className = "sub-role-name";
    label.textContent = subrole;
    link.appendChild(label);

    link.addEventListener("click", (event) => {
      event.preventDefault();
      const divisions = subdivisionData[role];
      if (divisions && divisions[subrole] && divisions[subrole].length) {
        showSubdivisionSelect(role, subrole);
      } else {
        spawnPlayer(role, subrole);
      }
    });
    subRoleList.appendChild(link);
  });

  fadeContentSwap(roleSelect, subRoleSelect);
}

function showRoleSelectFromSubRole(event) {
  event.preventDefault();
  fadeContentSwap(subRoleSelect, roleSelect);
}



const CAROUSEL = {
  visibleRings: 2,
  /* Slots past the stage that a card fades across. The slot sits on the
     same even spacing as every other one, so a card arrives by easing in
     over one normal gap rather than flying in from off screen. */
  fadeRings: 1,
  step: 1.02,
  scaleDecay: 0.8,
  gap: 0.07,
  anchorHysteresis: 0.65,
  flingMs: 130,
  maxFling: 2,
};

let carouselItems = [];
let carouselPos = 0;
let carouselIndex = 0;
let carouselAnchor = 0;
let carouselMin = 0;
let carouselMax = 0;
let carouselWraps = false;
let carouselRings = 2;
let carouselRole = null;
let cardWidthCache = 0;
let dragState = null;

const clamp = (value, low, high) => Math.min(Math.max(value, low), high);
const clampIndex = (index) => clamp(index, carouselMin, carouselMax);


function updateCarouselAnchor(pos) {
  if (Math.abs(pos - carouselAnchor) > CAROUSEL.anchorHysteresis) {
    carouselAnchor = clampIndex(Math.round(pos));
  }
}

function carouselOffset(index, pos) {
  const total = carouselItems.length;
  let delta = index - carouselAnchor;

  if (carouselWraps) {
    delta = ((delta % total) + total) % total;
    if (delta > total / 2) delta -= total;
  }
  return delta + (carouselAnchor - pos);
}


let slotTable = [0];

/* Slots are evenly spaced all the way out, including the ones past the
   stage. Earlier revisions pushed the outer slots clear of the viewport
   so a third card could never be seen; that worked, but cards then had
   to cross open space to reach the stage and appeared to fly in from
   the sides. The outer slot now sits one ordinary gap beyond the last
   visible one and is simply drawn at zero opacity, so nothing is on
   screen that shouldn't be and arrivals are a fade over a short, even
   step. */
function buildSlotTable(maxRings) {
  const { scaleDecay, gap } = CAROUSEL;
  const table = [0];

  for (let ring = 1; ring <= maxRings; ring++) {
    const inner = Math.pow(scaleDecay, ring - 1);
    const outer = Math.pow(scaleDecay, ring);
    table[ring] = table[ring - 1] + (inner + outer) / 2 + gap;
  }
  slotTable = table;
}


function slotDistance(rings) {
  const last = slotTable.length - 1;
  if (rings >= last) return slotTable[last];

  const index = Math.floor(rings);
  const t = rings - index;
  return slotTable[index] + (slotTable[index + 1] - slotTable[index]) * t;
}


/* Opacity is a visibility control, not a shading one.
   Every card on stage is painted at 1 — a card two rings back is the
   same colour as one at the centre, so a whole row of unselectable
   cards reads as one flat grey instead of a gradient of greys.

   The ramp lives entirely past the stage, so nothing visible is ever
   half faded and no extra card shows at the edge. Because the outer
   slot is one ordinary gap out, a card arriving crosses a short, even
   step while it fades up, and leaves the same way — it eases in and
   out near the edge rather than travelling in from off screen.

   The smoothstep matters during a drag, where rings is fractional:
   it flattens the ramp at both ends so a card doesn't start or stop
   fading abruptly as it crosses the boundary. */
function ringOpacity(rings, onStage, maxRings) {
  const band = Math.max(maxRings - onStage, 1);
  const t = clamp((maxRings - rings) / band, 0, 1);
  return t * t * (3 - 2 * t);
}

function cardMetrics(rings, cardWidth, onStage, maxRings) {
  return {
    distance: slotDistance(rings) * cardWidth,
    scale: Math.pow(CAROUSEL.scaleDecay, rings),
    opacity: ringOpacity(rings, onStage, maxRings),
  };
}

function writeCard(item, x, scale, opacity, zIndex) {
  const transform =
    `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0, 0) scale(${scale.toFixed(4)})`;
  if (item._transform !== transform) {
    item.style.transform = transform;
    item._transform = transform;
  }
  const alpha = opacity.toFixed(3);
  const gone = opacity <= 0.001;

  /* Cleared BEFORE the opacity write, set AFTER it. A card coming back
     has to be paintable in the same style pass that starts its fade-in,
     or the opening frames of the fade are never drawn. */
  if (!gone && item._gone !== false) {
    item.classList.remove("is-gone");
    item._gone = false;
  }

  if (item._opacity !== alpha) {
    item.style.opacity = alpha;
    item._opacity = alpha;
  }

  if (gone && item._gone !== true) {
    item.classList.add("is-gone");
    item._gone = true;
  }

  /* Nothing writes visibility inline. is-gone hides the card with a
     delayed, zero-duration flip once the fade has finished; doing it
     from here would either cut the fade short or need animating, and
     both have been tried. pointer-events and tabIndex below already
     take an invisible card out of reach. */
  if (item._zIndex !== zIndex) {
    item.style.zIndex = String(zIndex);
    item._zIndex = zIndex;
  }
}

/* Returns false when the cards can't be measured yet — the caller
   decides whether to retry. This used to schedule its own retry and
   return silently, which meant the opening sequence could drop
   is-dragging (and so re-enable transitions) before a single card had
   been positioned. */
function layoutCarousel(pos = carouselPos) {
  if (!carouselItems.length) return true;

  const cardWidth = carouselItems[0].offsetWidth;
  if (!cardWidth) return false;
  cardWidthCache = cardWidth;

  const maxRings = carouselRings + CAROUSEL.fadeRings;
  if (slotTable.length !== maxRings + 1) buildSlotTable(maxRings);
  updateCarouselAnchor(pos);
  const centre = clampIndex(Math.round(pos));

  carouselItems.forEach((item, index) => {
    const offset = carouselOffset(index, pos);
    const direction = offset === 0 ? 0 : Math.sign(offset);
    const rings = Math.min(Math.abs(offset), maxRings);

    const { distance, scale, opacity } = cardMetrics(rings, cardWidth, carouselRings, maxRings);
    const x = direction * distance;
    const zIndex = Math.round(100 - rings * 10);

    const previous = item._offset;
    const jumped = previous !== undefined && Math.abs(offset - previous) > 1.5;
    if (jumped) {
      const staged = cardMetrics(maxRings, cardWidth, carouselRings, maxRings);
      item.classList.add("no-anim");
      item.style.transform =
        `translate(-50%, -50%) translate3d(${(direction * staged.distance).toFixed(2)}px, 0, 0)` +
        ` scale(${staged.scale.toFixed(4)})`;
      item.style.opacity = "0";
      item.classList.add("is-gone");
      item._transform = null;
      item._opacity = null;
      item._gone = true;
      void item.offsetWidth;
      item.classList.remove("no-anim");
    }
    item._offset = offset;

    writeCard(item, x, scale, opacity, zIndex);

    const selectable =
      Math.abs(offset) <= carouselRings + 0.5 &&
      index >= carouselMin &&
      index <= carouselMax;
    item.style.pointerEvents = selectable ? "auto" : "none";
    item.tabIndex = selectable ? 0 : -1;

    const isCentre = index === centre;
    item.classList.toggle("is-centre", isCentre);
    item.setAttribute("aria-current", isCentre ? "true" : "false");
  });

  updateCarouselArrows();
  return true;
}

function settleCarousel(index) {
  const target = clampIndex(index);
  carouselIndex = target;
  carouselPos = target;
  layoutCarousel();
}

function rotateCarousel(delta) {
  if (!carouselItems.length || !delta) return;
  settleCarousel(carouselIndex + delta);
}

function rotateCarouselTo(index) {
  if (index === carouselIndex || index < carouselMin || index > carouselMax) return;
  settleCarousel(index);
}

function updateCarouselArrows() {
  subdivisionArrowLeft.disabled = carouselIndex <= carouselMin;
  subdivisionArrowRight.disabled = carouselIndex >= carouselMax;
}

/* Position the ring for the first time, then hand control back.
   Nothing is revealed until a layout has actually happened: while the
   screen is mid-swap the cards can measure zero, and letting the
   opening frame through in that state showed every card stacked at the
   centre, fully opaque, before they slid apart — the flash of cards to
   the left and right that then vanished. */
function layoutCarouselWhenReady(reveal) {
  if (subdivisionSelect.hidden) {
    subdivisionViewport.classList.remove("is-dragging");
    subdivisionTrack.classList.remove("no-anim", "is-entering");
    if (reveal) reveal();
    return;
  }

  if (!layoutCarousel()) {
    requestAnimationFrame(() => layoutCarouselWhenReady(reveal));
    return;
  }

  /* Placed, still transparent, still holding the entrance pose. Fade
     the stage up as one piece. */
  if (reveal) reveal();

  requestAnimationFrame(() => {
    subdivisionViewport.classList.remove("is-dragging");
    subdivisionTrack.classList.remove("no-anim");

    /* A frame later, so the track has its transition back before the
       pose is released — otherwise both changes land in one style pass
       and it snaps to place instead of settling. */
    requestAnimationFrame(() => subdivisionTrack.classList.remove("is-entering"));
  });
}

function showSubdivisionSelect(role, activeSubrole) {
  const divisions = subdivisionData[role];
  if (!divisions) return;

  carouselRole = role;
  subdivisionTitle.textContent = "Select your subdivision";
  subdivisionTrack.dataset.role = role;
  subdivisionTrack.innerHTML = "";

  carouselItems = [];
  carouselMin = null;
  carouselMax = null;

  /* Lay the whole tree out flat first, then rotate it so the division
     you picked lands in the middle of the ring. Built in declaration
     order, a division at either end of the tree opened with empty air
     on one side and every other division stacked on the other. Rotating
     is cyclic, so the chosen division stays contiguous and whatever
     falls off one end reappears on the other — which is what puts a
     different division on each side whichever one you click. */
  const cards = [];
  Object.keys(divisions).forEach((subrole) => {
    divisions[subrole].forEach((subdivision) => {
      cards.push({ subrole, subdivision, isActiveGroup: subrole === activeSubrole });
    });
  });

  const activeAt = cards.reduce(
    (acc, card, i) => (card.isActiveGroup ? { first: acc.first === null ? i : acc.first, last: i } : acc),
    { first: null, last: null }
  );

  let ordered = cards;
  if (activeAt.first !== null && cards.length > 1) {
    const activeCentre = Math.floor((activeAt.first + activeAt.last) / 2);
    const ringCentre = Math.floor((cards.length - 1) / 2);
    const shift = (((activeCentre - ringCentre) % cards.length) + cards.length) % cards.length;
    ordered = cards.slice(shift).concat(cards.slice(0, shift));
  }

  ordered.forEach(({ subrole, subdivision, isActiveGroup }) => {
    const link = document.createElement("a");
    link.href = "#";
    link.className = `subdivision-item is-gone ${isActiveGroup ? "active" : "muted"}`;
    /* A card with no inline styles yet sits at the track's centre at
       full opacity. Born hidden instead, so the only thing that can
       ever paint it is a layout pass that knows where it goes. */
    link.style.opacity = "0";
    link._gone = true;
    link.dataset.subrole = subrole;
    link.dataset.subdivision = subdivision;

    const groupLabel = document.createElement("span");
    groupLabel.className = "subdivision-group-label";
    groupLabel.textContent = subrole;
    link.appendChild(groupLabel);

    const name = document.createElement("span");
    name.className = "subdivision-name";
    name.textContent = subdivision;
    link.appendChild(name);

    const hint = document.createElement("span");
    hint.className = "subdivision-hint";
    hint.textContent = "Select";
    link.appendChild(hint);

    const index = carouselItems.length;
    if (isActiveGroup) {
      if (carouselMin === null) carouselMin = index;
      carouselMax = index;
    }

    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (dragState && dragState.moved) return;
      if (!isActiveGroup) return;

      if (index !== carouselIndex) {
        rotateCarouselTo(index);
        return;
      }
      spawnPlayer(role, subrole, subdivision);
    });

    carouselItems.push(link);
    subdivisionTrack.appendChild(link);
  });

  if (carouselMin === null) {
    carouselMin = 0;
    carouselMax = Math.max(0, carouselItems.length - 1);
  }

  carouselIndex = Math.floor((carouselMin + carouselMax) / 2);
  carouselPos = carouselIndex;
  carouselAnchor = carouselIndex;

  const total = carouselItems.length;
  carouselRings = Math.min(CAROUSEL.visibleRings, Math.floor((total - 1) / 2));
  const maxRings = carouselRings + CAROUSEL.fadeRings;
  /* Wrapping is what makes a card teleport from one edge of the ring
     to the other. That jump is only invisible if the card has already
     faded out by the time it happens, so wrap only when the boundary
     sits past the end of the fade band. Below that count the ring is
     short enough that the far cards simply park off-stage instead. */
  carouselWraps = total >= 2 * (maxRings + 1);
  buildSlotTable(maxRings);

  fadeContentSwap(subRoleSelect, subdivisionSelect, (reveal) => {
    subdivisionViewport.classList.add("is-dragging");
    subdivisionTrack.classList.add("no-anim", "is-entering");
    layoutCarouselWhenReady(reveal);
  });
}

function showSubRoleSelectFromSubdivision(event) {
  event.preventDefault();
  fadeContentSwap(subdivisionSelect, subRoleSelect);
}



function pixelsPerCard() {
  const width = cardWidthCache || carouselItems[0]?.offsetWidth || 280;
  return slotDistance(1) * width;
}


function resistEdges(pos) {
  if (pos < carouselMin) return carouselMin - Math.pow(carouselMin - pos, 0.55) * 0.5;
  if (pos > carouselMax) return carouselMax + Math.pow(pos - carouselMax, 0.55) * 0.5;
  return pos;
}

subdivisionViewport.addEventListener("pointerdown", (event) => {
  if (!carouselItems.length || event.button !== 0) return;

  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    lastX: event.clientX,
    lastTime: performance.now(),
    startPos: carouselPos,
    pos: carouselPos,
    velocity: 0,
    stepPx: pixelsPerCard(),
    moved: false,
    frame: 0,
  };

  subdivisionViewport.setPointerCapture(event.pointerId);
  subdivisionViewport.classList.add("is-dragging");
});

subdivisionViewport.addEventListener("pointermove", (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  const now = performance.now();
  const dt = Math.max(now - dragState.lastTime, 1);
  const stepDelta = (event.clientX - dragState.lastX) / dragState.stepPx;

  dragState.velocity = dragState.velocity * 0.72 + (-stepDelta / dt) * 0.28;
  dragState.lastX = event.clientX;
  dragState.lastTime = now;

  const travelled = (event.clientX - dragState.startX) / dragState.stepPx;
  dragState.pos = resistEdges(dragState.startPos - travelled);

  if (Math.abs(event.clientX - dragState.startX) > 4) dragState.moved = true;

  if (!dragState.frame) {
    dragState.frame = requestAnimationFrame(() => {
      if (!dragState) return;
      dragState.frame = 0;
      carouselPos = dragState.pos;
      layoutCarousel(carouselPos);
    });
  }
});

function endDrag(event) {
  if (!dragState) return;
  if (event && event.pointerId !== dragState.pointerId) return;

  if (dragState.frame) cancelAnimationFrame(dragState.frame);

  const fling = clamp(
    dragState.velocity * CAROUSEL.flingMs,
    -CAROUSEL.maxFling,
    CAROUSEL.maxFling
  );
  const target = clampIndex(Math.round(dragState.pos + fling));

  subdivisionViewport.classList.remove("is-dragging");
  settleCarousel(target);

  const finished = dragState;
  setTimeout(() => {
    if (dragState === finished) dragState = null;
  }, 0);
}

subdivisionViewport.addEventListener("pointerup", endDrag);
subdivisionViewport.addEventListener("pointercancel", endDrag);

let wheelAccumulator = 0;
let wheelResetTimer = 0;

subdivisionViewport.addEventListener(
  "wheel",
  (event) => {
    if (subdivisionSelect.hidden || !carouselItems.length) return;

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    event.preventDefault();

    wheelAccumulator += delta;
    if (Math.abs(wheelAccumulator) >= 55) {
      rotateCarousel(Math.sign(wheelAccumulator));
      wheelAccumulator = 0;
    }

    clearTimeout(wheelResetTimer);
    wheelResetTimer = setTimeout(() => { wheelAccumulator = 0; }, 200);
  },
  { passive: false }
);

document.addEventListener("keydown", (event) => {
  if (subdivisionSelect.hidden) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    rotateCarousel(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    rotateCarousel(1);
  } else if (event.key === "Enter" || event.key === " ") {
    const centre = carouselItems[carouselIndex];
    if (centre && centre.classList.contains("active")) {
      event.preventDefault();
      spawnPlayer(carouselRole, centre.dataset.subrole, centre.dataset.subdivision);
    }
  }
});

let resizeFrame = 0;
window.addEventListener("resize", () => {
  if (subdivisionSelect.hidden) return;
  cardWidthCache = 0;
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    layoutCarousel();
  });
});

function spawnPlayer(role, subrole, subdivision) {
  if (subdivision) {
    console.log(`Spawning as ${subdivision} (${subrole} / ${role})`);
  } else {
    console.log(`Spawning as ${subrole} (${role})`);
  }
}

playBtn.addEventListener("click", showRoleSelect);
roleBackBtn.addEventListener("click", showMainMenu);
subRoleBackBtn.addEventListener("click", showRoleSelectFromSubRole);
subdivisionBackBtn.addEventListener("click", showSubRoleSelectFromSubdivision);

subdivisionArrowLeft.addEventListener("click", () => rotateCarousel(-1));
subdivisionArrowRight.addEventListener("click", () => rotateCarousel(1));

roleItems.forEach((item) => {
  const role = item.dataset.role;
  const isUnlocked = unlockedRoles.includes(role);

  if (isUnlocked) {
    item.classList.add("unlocked");
  } else {
    item.classList.add("locked");
    item.addEventListener("click", (event) => event.preventDefault());
  }

  item.addEventListener("click", (event) => {
    if (!item.classList.contains("unlocked")) return;
    event.preventDefault();

    const data = roleData[role];
    if (data && Array.isArray(data.subroles) && data.subroles.length) {
      showSubRoleSelect(role);
    } else if (data) {
      spawnPlayer(role, data.label);
    }
  });
});