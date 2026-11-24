import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const KEY = "memoryscape-3d-v1";
const $ = (id) => document.getElementById(id);

function designFromMemory(title, body) {
  const text = `${title} ${body}`.toLowerCase();
  const has = (...words) => words.some((w) => text.includes(w));

  let biome = "interior";
  if (has("beach", "ocean", "sea", "shore", "sand", "wave")) biome = "coast";
  else if (has("forest", "woods", "tree", "trail", "camp")) biome = "forest";
  else if (has("city", "street", "apartment", "subway", "neon", "bar")) biome = "city";
  else if (has("school", "classroom", "hallway", "locker")) biome = "school";
  else if (has("church", "temple", "chapel")) biome = "sacred";
  else if (has("snow", "winter", "ice", "cold")) biome = "winter";
  else if (has("garden", "park", "yard", "field")) biome = "garden";
  else if (has("kitchen", "home", "house", "bedroom", "living", "basement", "attic")) biome = "home";
  else if (has("rain", "storm", "night")) biome = "rain";

  const mood = has("sad", "grief", "lonely", "loss", "funeral", "goodbye") ? "somber"
    : has("joy", "laugh", "party", "celebrate", "love", "warm") ? "warm"
    : has("fear", "dark", "afraid", "nightmare") ? "tense"
    : has("quiet", "peace", "calm", "still") ? "calm"
    : "neutral";

  const palettes = {
    coast: { floor: 0xc2b280, wall: 0x4a7c8a, accent: 0xf0d7a2, light: 0xffe7b8, fog: 0x9ec5d0 },
    forest: { floor: 0x3d4a32, wall: 0x2a3a28, accent: 0x6b8f5e, light: 0xc9e0a8, fog: 0x1a2618 },
    city: { floor: 0x2a2e36, wall: 0x1a1e28, accent: 0x6eb4b1, light: 0xa8c8ff, fog: 0x0c1018 },
    school: { floor: 0x8b7355, wall: 0xd4c4a8, accent: 0x4a6fa5, light: 0xfff2d0, fog: 0xc8bda8 },
    sacred: { floor: 0x4a4038, wall: 0x6b5c4e, accent: 0xc9a46c, light: 0xffe6b8, fog: 0x2a241c },
    winter: { floor: 0xdde6ef, wall: 0x8aa0b5, accent: 0xb8d4e8, light: 0xffffff, fog: 0xb0c4d4 },
    garden: { floor: 0x5a7a48, wall: 0x7a9a68, accent: 0xe8c4d8, light: 0xfff5d0, fog: 0xc8d8b0 },
    home: { floor: 0x8b6914, wall: 0xd4b896, accent: 0xc45c3e, light: 0xffd8a0, fog: 0xc8b090 },
    rain: { floor: 0x3a424c, wall: 0x2a323c, accent: 0x5c9496, light: 0xa0b8c8, fog: 0x1a222c },
    interior: { floor: 0x6b5a48, wall: 0xa89078, accent: 0xc9a46c, light: 0xffe0b8, fog: 0x2a241c }
  };

  const p = palettes[biome];
  const props = [];
  if (has("table", "kitchen", "dinner", "food")) props.push("table", "chairs");
  if (has("bed", "sleep", "bedroom")) props.push("bed");
  if (has("tree", "forest", "garden", "park")) props.push("trees");
  if (has("car", "drive", "road")) props.push("car");
  if (has("water", "ocean", "lake", "pool", "beach")) props.push("water");
  if (has("book", "library", "study", "school")) props.push("shelves");
  if (has("music", "radio", "piano", "song")) props.push("speaker");
  if (has("window", "light", "sun")) props.push("window");
  if (props.length === 0) {
    if (biome === "forest" || biome === "garden") props.push("trees");
    else if (biome === "coast") props.push("water");
    else if (biome === "home") props.push("table", "window");
    else props.push("pillar", "window");
  }

  const size = 18 + Math.min(12, Math.floor(body.length / 40));
  const seed = hash(`${title}|${body}`);
  return { biome, mood, palette: p, props, size, seed, summary: summarize(biome, mood, props) };
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let s = seed || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function summarize(biome, mood, props) {
  const place = {
    coast: "a shoreline of remembered light", forest: "a quiet stand of trees", city: "a night corner of the city",
    school: "a hallway that still echoes", sacred: "a still, high room", winter: "a cold open field",
    garden: "a green pause in the year", home: "rooms that knew you", rain: "a wet street under low cloud",
    interior: "a held interior"
  }[biome];
  const feel = { somber: "soft and heavy", warm: "warm and close", tense: "tight in the chest", calm: "slow and clear", neutral: "familiar" }[mood];
  return `${place} — ${feel}. Anchors: ${props.join(", ")}.`;
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{"memories":[]}'); }
  catch { return { memories: [] }; }
}
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
let store = load();
let currentId = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c121c);
scene.fog = new THREE.Fog(0x0c121c, 8, 42);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 80);
camera.position.set(0, 1.6, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.prepend(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const keys = { f: false, b: false, l: false, r: false };
let zoneGroup = null;
let portals = [];
const clock = new THREE.Clock();
let exploring = false;

const hemi = new THREE.HemisphereLight(0xb8d0e8, 0x2a2018, 0.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0b8, 0.85);
sun.position.set(8, 16, 6);
sun.castShadow = true;
scene.add(sun);
const fill = new THREE.PointLight(0x6eb4b1, 0.5, 30);
fill.position.set(0, 3, 0);
scene.add(fill);

function clearZone() {
  if (zoneGroup) {
    scene.remove(zoneGroup);
    zoneGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }
  zoneGroup = new THREE.Group();
  scene.add(zoneGroup);
  portals = [];
}

function box(w, h, d, color, x, y, z, opts = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.85, metalness: opts.metal ?? 0.05 })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  zoneGroup.add(mesh);
  return mesh;
}

function cylinder(r, h, color, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r * 0.9, h, 10),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  zoneGroup.add(mesh);
  return mesh;
}

function buildZone(mem) {
  clearZone();
  const d = mem.design;
  const rand = rng(d.seed);
  const S = d.size;
  const half = S / 2;
  const { floor, wall, accent, light, fog } = d.palette;

  scene.background = new THREE.Color(fog).lerp(new THREE.Color(0x0c121c), 0.35);
  scene.fog.color = new THREE.Color(fog);
  scene.fog.near = S * 0.35;
  scene.fog.far = S * 1.8;
  sun.color = new THREE.Color(light);
  fill.color = new THREE.Color(accent);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(S * 1.4, S * 1.4),
    new THREE.MeshStandardMaterial({ color: floor, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  zoneGroup.add(ground);

  const wallH = d.biome === "coast" || d.biome === "garden" || d.biome === "winter" ? 1.2 : 3.2;
  for (let i = 0; i < 4; i++) {
    const along = i % 2 === 0;
    const len = S * 1.05;
    const thick = 0.35;
    const mesh = box(along ? len : thick, wallH, along ? thick : len, wall, 0, wallH / 2, 0);
    if (i === 0) mesh.position.set(0, wallH / 2, -half);
    if (i === 1) mesh.position.set(0, wallH / 2, half);
    if (i === 2) mesh.position.set(-half, wallH / 2, 0);
    if (i === 3) mesh.position.set(half, wallH / 2, 0);
    if (d.biome === "coast" || d.biome === "forest") mesh.scale.y = 0.4 + rand() * 0.5;
  }

  const lamp = new THREE.PointLight(light, d.mood === "tense" ? 0.35 : 0.9, S);
  lamp.position.set((rand() - 0.5) * 4, 2.8, (rand() - 0.5) * 4);
  zoneGroup.add(lamp);

  const placeProp = (kind) => {
    const x = (rand() - 0.5) * (S - 4);
    const z = (rand() - 0.5) * (S - 4);
    if (kind === "table") {
      box(1.6, 0.12, 0.9, accent, x, 0.75, z);
      [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]].forEach(([dx, dz]) => box(0.1, 0.75, 0.1, 0x3a2a1a, x + dx, 0.375, z + dz));
    } else if (kind === "chairs") {
      box(0.45, 0.5, 0.45, wall, x + 1.2, 0.25, z);
    } else if (kind === "bed") {
      box(2.0, 0.4, 1.2, 0x4a3a2a, x, 0.3, z);
      box(2.0, 0.15, 1.2, 0xd8d0c0, x, 0.55, z);
    } else if (kind === "trees") {
      for (let t = 0; t < 5; t++) {
        const tx = (rand() - 0.5) * (S - 3);
        const tz = (rand() - 0.5) * (S - 3);
        cylinder(0.18, 1.4, 0x4a3420, tx, 0.7, tz);
        const canopy = new THREE.Mesh(
          new THREE.SphereGeometry(0.9 + rand() * 0.5, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0x3d6b3a, roughness: 0.9 })
        );
        canopy.position.set(tx, 1.8 + rand() * 0.4, tz);
        canopy.castShadow = true;
        zoneGroup.add(canopy);
      }
    } else if (kind === "water") {
      const water = new THREE.Mesh(
        new THREE.CircleGeometry(Math.min(5, S * 0.28), 24),
        new THREE.MeshStandardMaterial({ color: 0x3a7a9a, metalness: 0.4, roughness: 0.25 })
      );
      water.rotation.x = -Math.PI / 2;
      water.position.set(x * 0.3, 0.04, z * 0.3);
      zoneGroup.add(water);
    } else if (kind === "shelves") {
      box(2.2, 2.0, 0.35, 0x5a4030, x, 1.1, z);
      for (let s = 0; s < 4; s++) box(2.0, 0.06, 0.32, accent, x, 0.4 + s * 0.45, z);
    } else if (kind === "speaker") {
      box(0.4, 0.7, 0.3, 0x222228, x, 0.4, z, { metal: 0.3 });
    } else if (kind === "window") {
      const w = box(1.8, 1.4, 0.08, 0x88aacc, x, 2.0, -half + 0.25, { metal: 0.2, rough: 0.2 });
      const glow = new THREE.PointLight(light, 0.6, 8);
      glow.position.copy(w.position);
      zoneGroup.add(glow);
    } else if (kind === "pillar") {
      cylinder(0.25, 3.0, wall, x, 1.5, z);
    } else if (kind === "car") {
      box(2.4, 0.7, 1.2, 0x3a4a5a, x, 0.5, z, { metal: 0.4 });
      box(1.2, 0.5, 1.1, 0x2a3a4a, x - 0.2, 1.05, z, { metal: 0.3 });
    }
  };
  d.props.forEach(placeProp);

  for (let i = 0; i < 6; i++) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: accent })
    );
    orb.position.set((rand() - 0.5) * (S - 2), 0.15 + rand() * 0.2, (rand() - 0.5) * (S - 2));
    zoneGroup.add(orb);
  }

  const links = (mem.links || []).map((id) => store.memories.find((m) => m.id === id)).filter(Boolean);
  links.forEach((target, i) => {
    const angle = (i / Math.max(links.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * (half - 1.5);
    const pz = Math.sin(angle) * (half - 1.5);
    box(1.6, 2.6, 0.2, 0x1e2a4a, px, 1.3, pz);
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.08, 8, 20, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x6eb4b1, emissive: 0x1a4040, emissiveIntensity: 0.6 })
    );
    arch.position.set(px, 2.2, pz);
    arch.rotation.y = Math.atan2(-px, -pz);
    zoneGroup.add(arch);
    const gate = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 2.2),
      new THREE.MeshBasicMaterial({ color: 0x6eb4b1, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    gate.position.set(px, 1.2, pz);
    gate.rotation.y = Math.atan2(-px, -pz);
    zoneGroup.add(gate);
    const pl = new THREE.PointLight(0x6eb4b1, 0.8, 6);
    pl.position.set(px, 1.5, pz);
    zoneGroup.add(pl);
    portals.push({ position: new THREE.Vector3(px, 0, pz), targetId: target.id, title: target.title });
  });

  controls.getObject().position.set(0, 1.6, half - 2.5);
}

function refreshLinkSelect() {
  const sel = $("mem-link");
  const cur = sel.value;
  sel.innerHTML = `<option value="">— none yet —</option>` + store.memories.map((m) =>
    `<option value="${m.id}">${escapeHtml(m.title)}</option>`
  ).join("");
  if ([...sel.options].some((o) => o.value === cur)) sel.value = cur;
  $("btn-enter-last").style.display = store.memories.length ? "inline-block" : "none";
}

function refreshAtlas() {
  const list = $("atlas-list");
  if (!store.memories.length) {
    list.innerHTML = `<p style="color:var(--muted);margin:0">No zones yet. Describe a memory to begin.</p>`;
    return;
  }
  list.innerHTML = store.memories.map((m) => `
    <button class="memory-item" type="button" data-enter="${m.id}">
      <strong>${escapeHtml(m.title)}</strong>
      <span>${escapeHtml(m.design.summary)}</span>
    </button>
  `).join("");
  list.querySelectorAll("[data-enter]").forEach((el) => {
    el.onclick = () => enterMemory(el.getAttribute("data-enter"));
  });
}

function showHome(show) {
  $("screen-home").classList.toggle("hidden", !show);
  $("screen-atlas").classList.add("hidden");
  if (show) {
    exploring = false;
    controls.unlock();
    $("crosshair").classList.remove("on");
    $("hint").classList.remove("show");
    $("side").classList.remove("show");
    $("prompt").classList.remove("show");
    $("zone-chip").textContent = "Atlas";
    refreshLinkSelect();
  }
}

function showAtlas(show) {
  $("screen-atlas").classList.toggle("hidden", !show);
  if (show) {
    $("screen-home").classList.add("hidden");
    refreshAtlas();
    controls.unlock();
    exploring = false;
  }
}

async function generateMemory() {
  const title = $("mem-title").value.trim() || "Untitled memory";
  const body = $("mem-body").value.trim();
  if (!body || body.length < 12) {
    alert("Describe the memory in a bit more detail so the zone can take shape.");
    return;
  }
  const linkTo = $("mem-link").value || null;
  $("gen-status").classList.add("show");
  $("gen-text").textContent = "Reading the memory…";
  await wait(450);
  $("gen-text").textContent = "Choosing light, scale, and anchors…";
  const design = designFromMemory(title, body);
  await wait(550);
  $("gen-text").textContent = `Shaping ${design.biome} space…`;
  await wait(400);

  const mem = {
    id: "m-" + Date.now(),
    title,
    body,
    design,
    links: linkTo ? [linkTo] : [],
    createdAt: Date.now()
  };
  if (linkTo) {
    const other = store.memories.find((m) => m.id === linkTo);
    if (other && !other.links.includes(mem.id)) other.links.push(mem.id);
  }
  store.memories.unshift(mem);
  save(store);
  $("gen-status").classList.remove("show");
  $("mem-title").value = "";
  $("mem-body").value = "";
  enterMemory(mem.id);
}

function enterMemory(id) {
  const mem = store.memories.find((m) => m.id === id);
  if (!mem) return;
  currentId = id;
  showHome(false);
  showAtlas(false);
  buildZone(mem);
  exploring = true;
  $("zone-chip").textContent = mem.title.slice(0, 28);
  $("side-title").textContent = mem.title;
  $("side-meta").textContent = mem.design.summary + "\n\n" + mem.body.slice(0, 180) + (mem.body.length > 180 ? "…" : "");
  const links = (mem.links || []).map((lid) => store.memories.find((m) => m.id === lid)).filter(Boolean);
  $("side-links").innerHTML = links.length
    ? links.map((l) => `<button class="link-btn" type="button" data-jump="${l.id}">→ ${escapeHtml(l.title)}</button>`).join("")
    : `<span style="color:var(--muted);font-size:0.85rem">No portals yet. Create a new memory and link it here.</span>`;
  $("side-links").querySelectorAll("[data-jump]").forEach((el) => {
    el.onclick = () => enterMemory(el.getAttribute("data-jump"));
  });
  $("side").classList.add("show");
  $("hint").classList.add("show");
  $("prompt").classList.add("show");
  $("prompt").innerHTML = `<strong>${escapeHtml(mem.title)}</strong><br/>Click the scene to look around. Walk to a teal portal and press E.`;
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

$("btn-generate").onclick = () => generateMemory();
$("btn-new").onclick = () => showHome(true);
$("btn-atlas").onclick = () => showAtlas(true);
$("btn-atlas-new").onclick = () => showHome(true);
$("btn-atlas-close").onclick = () => {
  showAtlas(false);
  if (currentId) enterMemory(currentId);
  else showHome(true);
};
$("btn-enter-last").onclick = () => {
  if (store.memories[0]) enterMemory(store.memories[0].id);
};

renderer.domElement.addEventListener("click", () => {
  if (!exploring) return;
  if (!controls.isLocked) controls.lock();
});
controls.addEventListener("lock", () => {
  $("crosshair").classList.add("on");
  $("prompt").classList.remove("show");
});
controls.addEventListener("unlock", () => $("crosshair").classList.remove("on"));

addEventListener("keydown", (e) => {
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.f = true;
  if (e.code === "KeyS" || e.code === "ArrowDown") keys.b = true;
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.l = true;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.r = true;
  if (e.code === "KeyE" && exploring) tryPortal();
});
addEventListener("keyup", (e) => {
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.f = false;
  if (e.code === "KeyS" || e.code === "ArrowDown") keys.b = false;
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.l = false;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.r = false;
});

function tryPortal() {
  const pos = controls.getObject().position;
  for (const p of portals) {
    if (pos.distanceTo(p.position) < 2.2) {
      enterMemory(p.targetId);
      return;
    }
  }
  $("prompt").classList.add("show");
  $("prompt").innerHTML = "No portal in range. Walk toward a teal arch.";
  setTimeout(() => $("prompt").classList.remove("show"), 1600);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  if (controls.isLocked && exploring) {
    velocity.x -= velocity.x * 8 * dt;
    velocity.z -= velocity.z * 8 * dt;
    direction.z = Number(keys.f) - Number(keys.b);
    direction.x = Number(keys.r) - Number(keys.l);
    direction.normalize();
    const speed = 12;
    if (keys.f || keys.b) velocity.z -= direction.z * speed * dt;
    if (keys.l || keys.r) velocity.x -= direction.x * speed * dt;
    controls.moveRight(-velocity.x * dt);
    controls.moveForward(-velocity.z * dt);
    controls.getObject().position.y = 1.6;
    const mem = store.memories.find((m) => m.id === currentId);
    if (mem) {
      const lim = mem.design.size / 2 - 0.8;
      const p = controls.getObject().position;
      p.x = Math.max(-lim, Math.min(lim, p.x));
      p.z = Math.max(-lim, Math.min(lim, p.z));
    }
    for (const p of portals) {
      if (controls.getObject().position.distanceTo(p.position) < 2.4) {
        $("prompt").classList.add("show");
        $("prompt").innerHTML = `<strong>Portal</strong> to ${escapeHtml(p.title)} — press <strong>E</strong>`;
        break;
      }
    }
  }
  renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

refreshLinkSelect();
if (store.memories.length) $("btn-enter-last").style.display = "inline-block";
