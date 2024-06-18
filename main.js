import './css/base.css';
import * as THREE from 'three';
import fragmentShader from './shaders/fragment.glsl';

// Extract "variation" parameter from the URL
const urlParams = new URLSearchParams(window.location.search);
const variation = urlParams.get('var') || 0;

// Add selected class to link based on variation parameter
const selectedLink = document.querySelector(`[data-var="${variation}"]`);
if (selectedLink) selectedLink.classList.add('selected');

// Scene setup
const scene = new THREE.Scene();
const vMouse = new THREE.Vector2();
const vMouseDamp = new THREE.Vector2();
const vResolution = new THREE.Vector2();

// Viewport setup (updated on resize)
let w = window.innerWidth;
let h = window.innerHeight;

// Orthographic camera setup
let aspect = w / h;
const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000);
camera.position.z = 1; // Set appropriately for orthographic

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff); // Set background color to white
document.body.appendChild(renderer.domElement);

const onPointerMove = (e) => {
  vMouse.set(e.pageX, e.pageY);
};
document.addEventListener('mousemove', onPointerMove);
document.addEventListener('pointermove', onPointerMove);
document.body.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

// Plane geometry covering the full viewport
const geo = new THREE.PlaneGeometry(1, 1); // Scaled to cover full viewport

// Shader material creation
const mat = new THREE.ShaderMaterial({
  vertexShader: /* glsl */`
    varying vec2 v_texcoord;
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        v_texcoord = uv;
    }`,
  fragmentShader, // most of the action happening in the fragment
  uniforms: {
    u_mouse: { value: vMouseDamp },
    u_resolution: { value: vResolution },
    u_time: { value: 0.0 }
  },
  defines: {
    VAR: variation
  }
});

// Mesh creation
const quad = new THREE.Mesh(geo, mat);
scene.add(quad);

// Animation loop to render
let lastTime = 0;
const update = () => {
  const time = performance.now() * 0.001;
  const dt = time - lastTime;
  lastTime = time;

  // Ease mouse motion with damping
  vMouseDamp.lerp(vMouse, dt * 3);

  // Update uniforms
  mat.uniforms.u_mouse.value.copy(vMouseDamp);
  mat.uniforms.u_time.value = time;

  // Render scene
  requestAnimationFrame(update);
  renderer.render(scene, camera);
};
update();

const resize = () => {
  w = window.innerWidth;
  h = window.innerHeight;
  aspect = w / h;

  const dpr = Math.min(window.devicePixelRatio, 2);

  renderer.setSize(w, h);
  renderer.setPixelRatio(dpr);

  camera.left = -aspect;
  camera.right = aspect;
  camera.top = 1;
  camera.bottom = -1;
  camera.updateProjectionMatrix();

  quad.scale.set(w, h, 1);
  vResolution.set(w, h).multiplyScalar(dpr);
  mat.uniforms.u_resolution.value = vResolution;
};
resize();

window.addEventListener('resize', resize);
