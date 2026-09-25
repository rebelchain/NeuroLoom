import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  Matrix4,
  ShaderMaterial,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";
import { BAR, sampleMark } from "./mark-geometry";
import { CAMERA_Z, FOV_DEGREES, MARK_HALF_EXTENT, fieldState, gateShape } from "./field-state";
import { markPosition } from "./mark-position";
import { scrollNow } from "./scroll";
import { calmRect } from "./calm";
import { markSlot, nearestFigure } from "./figure-slot";
import { cursorInMarkSpace } from "./cursor-space";
import { dockRect } from "./dock";

/**
 * The field: a doorway, the mark, and the light behind both.
 *
 */

const COUNT = 9000;
const MARK_SCALE = 9;
// const MARK_SCALE = 15;
const BLOB_RADIUS = 3.6;
const RIM_JITTER = 0.08;
const MARK_DRIFT = 0.055;

const GATE_EDGE = 1500;
const GATE_RISING = 320;
const GATE_STAIN = 0.85;

const BORDER_POINTS = 420;
const STARS_NEAR = 700;
const STARS_FAR = 900;

const vertexShader = `
attribute vec3 aColor;
attribute float aSize;
attribute float aSoft;
attribute float aPhase;
attribute float aRise;
attribute float aStain;
attribute vec3 aScatterDir;
uniform float uScale;
uniform float uTime;
uniform float uMotion;
uniform float uScatter;
uniform float uMinPx;
uniform float uGateBottom;
uniform float uGateHeight;
/** xy: where the cursor is, in this object's own space. z: reach. w: strength. */
uniform vec4 uStain;
/** xy: centre of the quiet the type keeps. zw: its half extents. */
uniform vec4 uCalm;
uniform float uCalmOn;
uniform float uAspect;
/** xyz: the cursor in this object's own space. w: the radius it clears. */
uniform vec4 uDisperse;
/** xy: where the light is. z: how far it carries. w: how much of the cloud is
    held back to it — 0 leaves the whole cloud lit. */
uniform vec4 uReveal;
/** How awake this cloud is: its points' full size and softness. */
uniform float uLife;
uniform float uDisperseAmount;
varying vec3 vColor;
varying float vAlpha;
varying float vSoft;

void main() {
  vColor = aColor;
  vSoft = aSoft * uLife;

  vec3 p = position + aScatterDir * uScatter;

  // Points with a rise drift up the gate and wrap, fading at both ends so they
  // are never seen to appear or to stop.
  float fade = 1.0;
  if (aRise > 0.0) {
    float y = mod(p.y - uGateBottom + uTime * aRise * uMotion, uGateHeight);
    fade = smoothstep(0.0, 0.08, y / uGateHeight) * (1.0 - smoothstep(0.86, 1.0, y / uGateHeight));
    p.y = uGateBottom + y;
  }

  // The cursor clears a space around itself: anything within its reach is
  // pushed out along the line from its centre, leaving a hollow sphere where it
  // rests. Depth counts toward the distance, or the hollow would be a tube
  // bored through the mark and would read wrong the moment the mark turns.
  if (uDisperseAmount > 0.0) {
    vec3 away = p - uDisperse.xyz;
    float distance = length(away);
    if (distance < uDisperse.w && distance > 0.0001) {
      p += away * ((uDisperse.w / distance - 1.0) * uDisperseAmount);
    }
  }

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float depth = max(-mv.z, 0.1);
  // Awake, a point is its own size and softness; asleep it is a hard pinprick.
  gl_PointSize = max(mix(0.115, aSize, uLife) * uScale / depth, uMinPx);
  float twinkle = 1.0 - 0.45 * uMotion * (0.5 + 0.5 * sin(uTime * (1.4 + fract(aPhase) * 1.3) + aPhase * 6.283));
  vAlpha = twinkle * fade * smoothstep(0.12, 1.1, depth) * (1.0 - uScatter * 0.55);
  gl_Position = projectionMatrix * mv;

  // The green is the cursor's own light: it falls on what is near it, and what
  // it falls on burns a little brighter, so the lit part reads as a glow rather
  // than as a patch of different paint.
  if (uStain.w > 0.0) {
    float near = 1.0 - smoothstep(0.0, uStain.z, length(p.xy - uStain.xy));
    float lit = aStain * uStain.w * near;
    
    vColor = mix(vColor, vec3(0.545, 0.361, 0.965), lit);
    
    vAlpha *= 1.0 + lit * 1.5;
  }

  // Some clouds are only there where the cursor is: the rest of them is not
  // dimmed, it is simply not drawn.
  if (uReveal.w > 0.0) {
    float near = 1.0 - smoothstep(0.0, uReveal.z, length(p.xy - uReveal.xy));
    vAlpha *= mix(1.0, near, uReveal.w);
  }

  // Type keeps a quiet around itself: points behind it are dimmed where they
  // are rather than moved out of the way.
  if (uCalmOn > 0.0) {
    vec2 sp = gl_Position.xy / max(gl_Position.w, 1e-4);
    sp.x *= uAspect;
    vec2 away = max(abs(sp - uCalm.xy) - uCalm.zw, vec2(0.0));
    vAlpha *= 1.0 - uCalmOn * 0.78 * (1.0 - smoothstep(0.0, 0.42, length(away)));
  }
}
`;

const fragmentShader = `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
varying float vSoft;

void main() {
  vec2 q = gl_PointCoord - vec2(0.5);
  float d2 = dot(q, q) * 4.0;
  if (d2 >= 1.0) discard;
  float inv = 1.0 - d2;

  // A tight point and a soft one, mixed per particle: most are pinpricks, a few
  // are out of focus, which is what stops the field reading as confetti.
  float tight = min(1.0, inv * 1.9);
  float soft = inv * inv;
  float a = mix(tight, soft * 0.55, vSoft) * vAlpha * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

interface Cloud {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  softness: Float32Array;
  phases: Float32Array;
  rise: Float32Array;
  stain: Float32Array;
  scatter: Float32Array;
  sphere: Float32Array;
  formDelay: Float32Array;
  rimJitter: Float32Array;
  drift: Float32Array;
}

/**
 * Three populations, each with its own focus..
 */
function fineFocus(): { size: number; soft: number } {
  const roll = Math.random();
  if (roll < 0.58) return { size: 0.045 + Math.random() * 0.045, soft: 0.08 };
  if (roll < 0.85) return { size: 0.1 + Math.random() * 0.09, soft: 0.45 };
  return { size: 0.24 + Math.random() * 0.3, soft: 1 };
}

function bokehFocus(): { size: number; soft: number } {
  const roll = Math.random();
  if (roll < 0.3) return { size: 0.08 + Math.random() * 0.07, soft: 0.25 };
  if (roll < 0.62) return { size: 0.22 + Math.random() * 0.16, soft: 0.75 };
  return { size: 0.42 + Math.random() * 0.5, soft: 1 };
}

function distantFocus(): { size: number; soft: number } {
  const roll = Math.random();
  if (roll < 0.62) return { size: 0.08 + Math.random() * 0.08, soft: 0.15 };
  if (roll < 0.88) return { size: 0.2 + Math.random() * 0.16, soft: 0.65 };
  return { size: 0.46 + Math.random() * 0.5, soft: 1 };
}

function emptyCloud(count: number): Cloud {
  return {
    positions: new Float32Array(count * 3),
    colors: new Float32Array(count * 3),
    sizes: new Float32Array(count),
    softness: new Float32Array(count),
    phases: new Float32Array(count),
    rise: new Float32Array(count),
    stain: new Float32Array(count),
    scatter: new Float32Array(count * 3),
    sphere: new Float32Array(count * 3),
    formDelay: new Float32Array(count),
    rimJitter: new Float32Array(count),
    drift: new Float32Array(count),
  };
}

function toGeometry(cloud: Cloud): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(cloud.positions, 3));
  geometry.setAttribute("aColor", new BufferAttribute(cloud.colors, 3));
  geometry.setAttribute("aSize", new BufferAttribute(cloud.sizes, 1));
  geometry.setAttribute("aSoft", new BufferAttribute(cloud.softness, 1));
  geometry.setAttribute("aPhase", new BufferAttribute(cloud.phases, 1));
  geometry.setAttribute("aRise", new BufferAttribute(cloud.rise, 1));
  geometry.setAttribute("aStain", new BufferAttribute(cloud.stain, 1));
  geometry.setAttribute("aScatterDir", new BufferAttribute(cloud.scatter, 3));
  geometry.setAttribute("aSphere", new BufferAttribute(cloud.sphere, 3));
  geometry.setAttribute("aFormDelay", new BufferAttribute(cloud.formDelay, 1));
  return geometry;
}

function makeMaterial(reduced: boolean, door: { bottom: number; height: number }) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader,
    fragmentShader,
    uniforms: {
      uOpacity: { value: 0 },
      uScale: { value: 1 },
      uTime: { value: 0 },
      uMotion: { value: reduced ? 0 : 1 },
      uScatter: { value: 0 },
      uMinPx: { value: 1.2 },
      uGateBottom: { value: door.bottom },
      uGateHeight: { value: door.height },
      uStain: { value: new Vector4(0, 0, 1, 0) },
      uCalm: { value: new Vector4(0, 0, 0, 0) },
      uCalmOn: { value: 0 },
      uAspect: { value: 1 },
      uDisperse: { value: new Vector4(0, 0, 0, 1) },
      uReveal: { value: new Vector4(0, 0, 1, 0) },
      uLife: { value: 1 },
      uDisperseAmount: { value: 0 },
    },
  });
}

/** The mark itself, sampled from the logo's three shapes. */
function buildMark(): Cloud {
  const cloud = emptyCloud(COUNT);
  const { positions, roles } = sampleMark({
    count: COUNT,
    outlineShare: 0.26,
    depthJitter: 0.09,
    seed: 1,
  });

  for (let i = 0; i < COUNT; i++) {
    cloud.positions[i * 3] = positions[i * 3] * MARK_SCALE;
    cloud.positions[i * 3 + 1] = positions[i * 3 + 1] * MARK_SCALE;
    cloud.positions[i * 3 + 2] = positions[i * 3 + 2] * MARK_SCALE;

    const shade = 0.78 + Math.random() * 0.22;
    cloud.colors[i * 3] = shade;
    cloud.colors[i * 3 + 1] = shade;
    cloud.colors[i * 3 + 2] = shade;
    cloud.stain[i] = roles[i] === BAR ? 0.7 : 1;

    const spot = fineFocus();
    cloud.sizes[i] = spot.size;
    cloud.softness[i] = spot.soft;
    cloud.phases[i] = Math.random() * 6.283;


    const ballTheta = Math.random() * Math.PI * 2;
    const ballPhi = Math.acos(2 * Math.random() - 1);
    const ballRadius = BLOB_RADIUS * Math.pow(Math.random(), 1 / 2.4);
    cloud.sphere[i * 3] = ballRadius * Math.sin(ballPhi) * Math.cos(ballTheta);
    cloud.sphere[i * 3 + 1] = ballRadius * Math.sin(ballPhi) * Math.sin(ballTheta);
    cloud.sphere[i * 3 + 2] = ballRadius * Math.cos(ballPhi);
    cloud.formDelay[i] = Math.random();

    cloud.rimJitter[i] = 1 + (Math.random() * 2 - 1) * RIM_JITTER;
    cloud.drift[i] = MARK_DRIFT * (0.4 + Math.random() * 0.6);

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const reach = 4 + Math.random() * 7;
    cloud.scatter[i * 3] = Math.sin(phi) * Math.cos(theta) * reach;
    cloud.scatter[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * reach;
    cloud.scatter[i * 3 + 2] = Math.cos(phi) * reach;
  }
  return cloud;
}

/**
 * The gate: an equilateral triangle standing on its point, drawn in points.
 */
function buildGate(): Cloud {
  const total = GATE_EDGE + GATE_RISING;
  const cloud = emptyCloud(total);

  const { positions } = sampleMark({
    count: total,
    outlineShare: 0,
    depthJitter: 0.15,
    seed: 42, 
  });

  const GATE_MARK_SCALE = 28;

  for (let i = 0; i < total; i++) {
    cloud.positions[i * 3] = positions[i * 3] * GATE_MARK_SCALE;
    cloud.positions[i * 3 + 1] = positions[i * 3 + 1] * GATE_MARK_SCALE;
    cloud.positions[i * 3 + 2] = positions[i * 3 + 2] * GATE_MARK_SCALE;

    cloud.colors[i * 3] = 0.545;
    cloud.colors[i * 3 + 1] = 0.361;
    cloud.colors[i * 3 + 2] = 0.965;

    cloud.stain[i] = GATE_STAIN;

    const spot = bokehFocus();
    cloud.sizes[i] = spot.size * 1.5;
    cloud.softness[i] = spot.soft;
    cloud.phases[i] = Math.random() * 6.283;

    cloud.rise[i] = 0.1 + Math.random() * 0.2;
  }

  return cloud;
}

/**
 * The border the install line wears. The points hold a position along a
 * perimeter and an offset from it; where that perimeter actually is gets
 * written every frame, because the line moves.
 */
function buildBorder(): { cloud: Cloud; along: Float32Array; offset: Float32Array } {
  const cloud = emptyCloud(BORDER_POINTS);
  const along = new Float32Array(BORDER_POINTS);
  const offset = new Float32Array(BORDER_POINTS);

  for (let i = 0; i < BORDER_POINTS; i++) {
    along[i] = (i + Math.random() * 0.9) / BORDER_POINTS;
    // a spray either side of the line rather than a rule drawn along it: packed
    // tightly enough and small enough, points stop reading as points
    offset[i] = (Math.random() * 2 - 1) * Math.abs(Math.random()) * 0.17;

    const shade = 0.72 + Math.random() * 0.28;
    cloud.colors[i * 3] = shade;
    cloud.colors[i * 3 + 1] = shade;
    cloud.colors[i * 3 + 2] = shade * 0.99;
    cloud.stain[i] = 1;

    const spot = bokehFocus();
    cloud.sizes[i] = spot.size * 0.7;
    cloud.softness[i] = spot.soft;
    cloud.phases[i] = Math.random() * 6.283;
  }

  return { cloud, along, offset };
}

/** A shell of distant light, flattened a little and pushed behind the camera plane. */
function buildStars(count: number, near: number, far: number): Cloud {
  const cloud = emptyCloud(count);
  for (let i = 0; i < count; i++) {
    const radius = near + Math.random() * (far - near);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    cloud.positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    cloud.positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
    cloud.positions[i * 3 + 2] = -Math.abs(radius * Math.cos(phi)) * 0.6 - 4;

    const shade = 0.45 + Math.random() * 0.35;
    cloud.colors[i * 3] = shade;
    cloud.colors[i * 3 + 1] = shade;
    cloud.colors[i * 3 + 2] = shade;

    const spot = distantFocus();
    cloud.sizes[i] = spot.size;
    cloud.softness[i] = spot.soft;
    cloud.phases[i] = Math.random() * 6.283;
  }
  return cloud;
}

/** The same curve the shader's smoothstep draws, for the work done here. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0 || 1e-6)));
  return t * t * (3 - 2 * t);
}

/** Builds the field into `host`. Returns a teardown. */
export function mountMarkField(host: HTMLElement): () => void {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    throw new Error("no webgl");
  }
  if (!renderer.getContext()) throw new Error("no webgl");

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  host.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV_DEGREES, innerWidth / innerHeight, 0.1, 300);
  camera.position.z = CAMERA_Z;

  // The gate is sized against what the camera can see, so it frames the
  // wordmark at any viewport rather than at one.
  const gate = gateShape();
  const door = { bottom: gate.apexY, height: gate.height };

  const markMaterial = makeMaterial(reduced, door);
  const doorMaterial = makeMaterial(reduced, door);
  const starMaterial = makeMaterial(reduced, door);

  const markCloud = buildMark();
  // The geometry writes into the cloud's own array every frame, so the logo's
  // positions are copied out first. Reading a target out of the buffer you are
  // animating means the target walks away from you.
  const logo = new Float32Array(markCloud.positions);
  const markGeometry = toGeometry(markCloud);
  // The mark is moved on the processor rather than in the shader, so each point
  // can carry its own memory: where it is drifting to, and how far the cursor
  // has pushed it. Points then trail behind a fast cursor and flow back one by
  // one, which a single value shared by all of them cannot do.
  const settled = new Float32Array(logo);
  const pushed = new Float32Array(COUNT * 3);
  const doorGeometry = toGeometry(buildGate());
  const nearGeometry = toGeometry(buildStars(STARS_NEAR, 25, 80));
  const farGeometry = toGeometry(buildStars(STARS_FAR, 30, 90));

  const mark = new Points(markGeometry, markMaterial);
  mark.frustumCulled = false;
  const group = new Group();
  group.add(mark);

  const doorPoints = new Points(doorGeometry, doorMaterial);
  doorPoints.frustumCulled = false;
  const doorGroup = new Group();
  doorGroup.add(doorPoints);

  const border = buildBorder();
  const borderGeometry = toGeometry(border.cloud);
  const borderMaterial = makeMaterial(reduced, door);
  const borderPoints = new Points(borderGeometry, borderMaterial);
  borderPoints.frustumCulled = false;

  const near = new Points(nearGeometry, starMaterial);
  const far = new Points(farGeometry, starMaterial);
  near.frustumCulled = false;
  far.frustumCulled = false;

 scene.add(group, doorGroup, borderPoints, near, far);

  const setScale = () => {
    const scale = renderer.domElement.height * 0.5;
    markMaterial.uniforms.uScale.value = scale;
    borderMaterial.uniforms.uScale.value = scale;
    doorMaterial.uniforms.uScale.value = scale;
    starMaterial.uniforms.uScale.value = scale;
  };

  const resize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    setScale();
  };
  setScale();
  addEventListener("resize", resize);

  // The cursor leads the mark around inside the gate. Held in NDC; the clamp
  // that keeps it inside the triangle lives in field-state.
  let pointer: { x: number; y: number } | undefined;
  const onPointerMove = (event: PointerEvent) => {
    pointer = {
      x: (event.clientX / innerWidth) * 2 - 1,
      y: -(event.clientY / innerHeight) * 2 + 1,
    };
  };
  const onPointerLeave = () => {
    pointer = undefined;
  };
  if (!reduced && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    addEventListener("pointermove", onPointerMove, { passive: true });
    addEventListener("pointerleave", onPointerLeave);
  }

  let raf = 0;
  let followX = 0;
  let followY = 0;
  let disperse = 0;
  let borderGlow = 0;
  const cursorLocal = new Vector3();
  const inverseRotation = new Matrix4();
  const start = performance.now();

  // How far the cursor's light reaches across the gate, and — in the mark's own
  // units — how far its light reaches into the mark and how big a space it
  // clears there. The hole is a fraction of the mark, not the whole of it.
  const STAIN_REACH = gate.side * 0.34;
  const MARK_LIGHT = 2.4;
  const MARK_CLEARS = 0.78;

  let previous = start;
  // Eased rather than snapped: the mark crosses to the other half as the next figure arrives, the
  // way the reference's star drifts opposite each card.
  let slotX = 0;
  let slotY = 0;
  const frame = (now: number) => {
    const time = (now - start) / 1000;
    // Time-based rather than per-frame, so easing takes the same wall-clock
    // time whatever rate the display or the tab is running at.
    const delta = Math.min(0.1, (now - previous) / 1000);
    previous = now;
    const settle = (rate: number) => 1 - Math.exp(-rate * delta);

    // Where everything stands, and how brightly, is computed apart from here so
    // the rule that the mark never sits on the text can be held to by test.
    const state = fieldState({
      scrollY: scrollNow(),
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      docHeight: document.documentElement.scrollHeight,
      pointer,
    });

    // eased toward the cursor rather than pinned to it, so the mark is led
    // rather than dragged
    const lead = settle(6);
    followX += (state.markOffsetX - followX) * lead;
    followY += (state.markOffsetY - followY) * lead;

    // Which figure the reader is on, and therefore which half is free. The page's figures publish
    // their own side; the mark takes the other one. See lib/figure-slot.
   const perUnitNow =
     innerHeight /
     (2 * Math.tan((25 * Math.PI) / 180) * (16 - state.positionZ));

   let wantX = state.positionX;
   let wantY = 0;

   // PERBAIKAN: Pindai elemen [data-figure] secara real-time setiap frame
   // Ini memastikan WebGL sinkron dengan render React/Next.js
   const figures = document.querySelectorAll("[data-figure]");
   let activeFigure: Element | null = null;
   let minDistance = Infinity;

   for (let i = 0; i < figures.length; i++) {
     const el = figures[i];
     const rect = el.getBoundingClientRect();
     const centerY = rect.top + rect.height / 2;

     // Cari section mana yang posisinya paling dekat dengan tengah layar
     const distance = Math.abs(centerY - innerHeight / 2);

     // Jika section masuk ke area pandang (kurang dari 75% tinggi layar)
     if (distance < minDistance && distance < innerHeight * 0.75) {
       minDistance = distance;
       activeFigure = el;
     }
   }

   if (activeFigure) {
     const side = activeFigure.getAttribute("data-figure");
     const rect = activeFigure.getBoundingClientRect();
     const figureCenterY = rect.top + rect.height / 2;

     // Jarak menghindar (Lebar kolom teks dibagi 2 + margin ruang napas)
     const offsetPx = Math.min(768, innerWidth - 64) / 2 + 150;

     if (side === "left") {
       // Teks di Kiri -> Paksa N pindah ke KANAN
       wantX = offsetPx / perUnitNow;
     } else if (side === "right") {
       // Teks di Kanan -> Paksa N pindah ke KIRI
       wantX = -offsetPx / perUnitNow;
     }

     // Pastikan N mengikuti tinggi (Y) dari section yang aktif
     wantY = (innerHeight / 2 - figureCenterY) / perUnitNow;
   }

   const toSlot = settle(3.2);
   slotX += (wantX - slotX) * toSlot;
   slotY += (wantY - slotY) * toSlot;

    group.position.x = slotX + followX;
    group.position.y = slotY + followY;
    group.position.z = state.positionZ;
    group.scale.setScalar(state.scale);
    group.rotation.y = state.rotationY + (reduced ? 0 : time * 0.06);
    group.rotation.x = state.rotationX;

    // Blend, wobble, drift, inertia and the cursor's hollow, per point.
    {
      const positions = markGeometry.attributes.position.array as Float32Array;
      const inertia = settle(5);
      const towardHollow = settle(15);
      const backFromHollow = settle(3.4);
      const life = state.markLife;
      const hollow = MARK_CLEARS;
      const cursorOn = disperse > 0.002;

      for (let i = 0; i < COUNT; i++) {
        const at = i * 3;
        const join = smoothstep(markCloud.formDelay[i] * 0.45, 1, state.markForm);
        const loose = 1 - join;
        const phase = markCloud.phases[i];

        // where this point wants to be, right now
        let wantX = markCloud.sphere[at] + (logo[at] - markCloud.sphere[at]) * join;
        let wantY = markCloud.sphere[at + 1] + (logo[at + 1] - markCloud.sphere[at + 1]) * join;
        let wantZ = markCloud.sphere[at + 2] + (logo[at + 2] - markCloud.sphere[at + 2]) * join;

        if (!reduced) {
          // unformed, it breathes; awake, it wanders — the two never overlap
          const breath = 0.36 * loose;
          const wander = markCloud.drift[i] * life * join;
          wantX += Math.sin(time * 0.9 + phase * 2.1) * breath + Math.sin(time * 0.31 + phase) * wander;
          wantY += Math.sin(time * 0.78 + phase * 3.3) * breath + Math.sin(time * 0.27 + phase * 1.7) * wander;
          wantZ += Math.sin(time * 0.63 + phase * 1.7) * breath + Math.sin(time * 0.23 + phase * 2.3) * wander;
        }

        // the mark carries weight: it eases toward where it wants to be
        settled[at] += (wantX - settled[at]) * inertia;
        settled[at + 1] += (wantY - settled[at + 1]) * inertia;
        settled[at + 2] += (wantZ - settled[at + 2]) * inertia;

        // what the cursor is asking of this point
        let askX = 0;
        let askY = 0;
        let askZ = 0;
        let inReach = false;
        if (cursorOn) {
          const awayX = settled[at] - cursorLocal.x;
          const awayY = settled[at + 1] - cursorLocal.y;
          const awayZ = settled[at + 2] - cursorLocal.z;
          const distance = Math.sqrt(awayX * awayX + awayY * awayY + awayZ * awayZ);
          const rim = hollow * markCloud.rimJitter[i];
          if (distance < rim && distance > 1e-4) {
            const push = (rim / distance - 1) * disperse;
            askX = awayX * push;
            askY = awayY * push;
            askZ = awayZ * push;
            inReach = true;
          }
        }

        // quick to give way, slow to come back
        const rate = inReach ? towardHollow : backFromHollow;
        pushed[at] += (askX - pushed[at]) * rate;
        pushed[at + 1] += (askY - pushed[at + 1]) * rate;
        pushed[at + 2] += (askZ - pushed[at + 2]) * rate;

        positions[at] = settled[at] + pushed[at];
        positions[at + 1] = settled[at + 1] + pushed[at + 1];
        positions[at + 2] = settled[at + 2] + pushed[at + 2];
      }
      markGeometry.attributes.position.needsUpdate = true;
    }

    // the blend, the breathing and the hollow are all done above
    markMaterial.uniforms.uDisperseAmount.value = 0;
    markMaterial.uniforms.uLife.value = state.markLife;
    markMaterial.uniforms.uOpacity.value = state.opacity;
    markMaterial.uniforms.uScatter.value = state.scatter;
    markMaterial.uniforms.uTime.value = time;

    // The cursor's light, and the space it clears, both carried into the mark's
    // own space — through its position, its scale and its rotation — so they
    // stay with it wherever it has turned to.
    const wants = state.pointerPresent && state.opacity > 0.02 ? 1 : 0;
    disperse += (wants - disperse) * settle(wants > disperse ? 9 : 4);

    inverseRotation.makeRotationFromEuler(group.rotation).invert();
    const flat = cursorInMarkSpace(
      state.pointerWorldX,
      state.pointerWorldY,
      state.depthRatio,
      group.position.x,
      group.position.y,
      state.scale,
    );
    cursorLocal.set(flat.x, flat.y, 0).applyMatrix4(inverseRotation);

    markMaterial.uniforms.uStain.value.set(cursorLocal.x, cursorLocal.y, MARK_LIGHT, disperse);
    // the hollow the cursor clears is a sphere about that point, not a tube


    // Lay the border onto wherever the install line has got to. Its points are
    // written in world units at the camera's own plane, so a pixel on screen is
    // a pixel wherever the line has moved to.
    if (dockRect.on) {
      const perWorld = innerHeight / (2 * Math.tan((FOV_DEGREES / 2) * (Math.PI / 180)) * CAMERA_Z);
      const halfWidth = dockRect.width / 2 / perWorld;
      const halfHeight = dockRect.height / 2 / perWorld;
      const centreX = (dockRect.left + dockRect.width / 2 - innerWidth / 2) / perWorld;
      const centreY = (innerHeight / 2 - (dockRect.top + dockRect.height / 2)) / perWorld;
      const perimeter = 4 * halfWidth + 4 * halfHeight;
      const positions = borderGeometry.attributes.position.array as Float32Array;

      for (let i = 0; i < BORDER_POINTS; i++) {
        let walk = border.along[i] * perimeter;
        let x: number;
        let y: number;
        let outX: number;
        let outY: number;
        if (walk < 2 * halfWidth) {
          x = -halfWidth + walk;
          y = halfHeight;
          outX = 0;
          outY = 1;
        } else if ((walk -= 2 * halfWidth) < 2 * halfHeight) {
          x = halfWidth;
          y = halfHeight - walk;
          outX = 1;
          outY = 0;
        } else if ((walk -= 2 * halfHeight) < 2 * halfWidth) {
          x = halfWidth - walk;
          y = -halfHeight;
          outX = 0;
          outY = -1;
        } else {
          x = -halfWidth;
          y = -halfHeight + (walk - 2 * halfWidth);
          outX = -1;
          outY = 0;
        }

        positions[i * 3] = centreX + x + outX * border.offset[i];
        positions[i * 3 + 1] = centreY + y + outY * border.offset[i];
        positions[i * 3 + 2] = 0;
      }
      borderGeometry.attributes.position.needsUpdate = true;

      // The border is not a frame the line wears; it is what the line does when
      // the cursor comes to it, and it goes again when the cursor leaves.
      const wanted = dockRect.hovered ? 1 : 0;
      borderGlow += (wanted - borderGlow) * settle(dockRect.hovered ? 7 : 4);
      borderMaterial.uniforms.uOpacity.value = 0.62 * borderGlow;
      // only the stretch of border the cursor is beside comes up
      borderMaterial.uniforms.uReveal.value.set(
        state.pointerWorldX,
        state.pointerWorldY,
        Math.max(halfHeight * 3.4, halfWidth * 0.5),
        1,
      );
      borderMaterial.uniforms.uTime.value = time;
      // the cursor's light and the space it clears, in the same world units
      borderMaterial.uniforms.uStain.value.set(
        state.pointerWorldX,
        state.pointerWorldY,
        halfWidth * 0.9,
        disperse,
      );
      borderMaterial.uniforms.uDisperse.value.set(
        state.pointerWorldX,
        state.pointerWorldY,
        0,
        halfHeight * 1.6,
      );
      borderMaterial.uniforms.uDisperseAmount.value = disperse * 0.55;
    }
    borderPoints.visible = dockRect.on && borderGlow > 0.004;

    // The type's quiet applies to everything drawn behind it.
    const aspect = innerWidth / innerHeight;
    for (const material of [markMaterial, doorMaterial, starMaterial, borderMaterial]) {
      material.uniforms.uCalm.value.set(
        calmRect.x,
        calmRect.y,
        calmRect.halfWidth,
        calmRect.halfHeight,
      );
      material.uniforms.uCalmOn.value = calmRect.on ? 1 : 0;
      material.uniforms.uAspect.value = aspect;
    }

    doorGroup.scale.setScalar(state.doorScale);
    doorMaterial.uniforms.uOpacity.value = state.doorOpacity;
    doorMaterial.uniforms.uTime.value = time;
    doorMaterial.uniforms.uStain.value.set(
      state.pointerWorldX / state.doorScale,
      state.pointerWorldY / state.doorScale,
      STAIN_REACH / state.doorScale,
      disperse,
    );
    doorPoints.visible = state.doorOpacity > 0.002;

    starMaterial.uniforms.uOpacity.value = state.starfieldOpacity;
    starMaterial.uniforms.uTime.value = time;
    near.rotation.y = reduced ? 0 : time * 0.006;
    far.rotation.y = reduced ? 0 : -time * 0.004;

    // Report where the mark has got to, so the hero can light the words it
    // passes behind.
    const perUnit = innerHeight / (2 * Math.tan((25 * Math.PI) / 180) * (16 - group.position.z));
    markPosition.x = innerWidth / 2 + group.position.x * perUnit;
    markPosition.y = innerHeight / 2 - group.position.y * perUnit;
    markPosition.radius = 4.5 * state.scale * perUnit;
    markPosition.visible = state.opacity > 0.05;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    markPosition.visible = false;
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    removeEventListener("pointermove", onPointerMove);
    removeEventListener("pointerleave", onPointerLeave);
    host.removeChild(renderer.domElement);
    for (const geometry of [markGeometry, doorGeometry, borderGeometry, nearGeometry, farGeometry]) {
      geometry.dispose();
    }
    for (const material of [markMaterial, doorMaterial, starMaterial, borderMaterial]) material.dispose();
    renderer.dispose();
  };
}
