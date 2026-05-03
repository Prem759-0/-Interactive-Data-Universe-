// ============================================================
// DATA
// ============================================================
const CATEGORIES = {
  AI: { color: '#00d4ff', label: 'Artificial Intelligence' },
  WEB: { color: '#7c3aed', label: 'Web Technologies' },
  DATA: { color: '#10b981', label: 'Data Science' },
  SYSTEMS: { color: '#f59e0b', label: 'Systems & Infra' },
  MATH: { color: '#f43f5e', label: 'Mathematics' },
  DESIGN: { color: '#38bdf8', label: 'Design & UX' },
};
 
const NODES_DATA = [
  // AI cluster
  { id:0, name:'Neural Networks', cat:'AI', desc:'Layered computational models inspired by the human brain, forming the backbone of modern deep learning.' },
  { id:1, name:'Transformers', cat:'AI', desc:'Self-attention based architectures that revolutionized NLP and now dominate computer vision tasks.' },
  { id:2, name:'Reinforcement Learning', cat:'AI', desc:'Training agents to make decisions through reward signals in complex environments.' },
  { id:3, name:'Computer Vision', cat:'AI', desc:'Enabling machines to extract meaning from images and video through deep feature extraction.' },
  { id:4, name:'Generative Models', cat:'AI', desc:'Architectures like GANs, VAEs, and diffusion models that synthesize new data distributions.' },
  { id:5, name:'NLP', cat:'AI', desc:'Natural Language Processing — understanding, generating, and manipulating human language.' },
  // WEB
  { id:6, name:'WebGL / GLSL', cat:'WEB', desc:'Low-level GPU rendering API enabling complex 3D graphics and shader programming in the browser.' },
  { id:7, name:'React', cat:'WEB', desc:'Declarative component-based UI library with a virtual DOM and unidirectional data flow.' },
  { id:8, name:'TypeScript', cat:'WEB', desc:'Statically typed superset of JavaScript enabling large-scale application development.' },
  { id:9, name:'WebAssembly', cat:'WEB', desc:'Binary instruction format enabling near-native performance for browser-based applications.' },
  { id:10, name:'CSS Animations', cat:'WEB', desc:'Keyframe-based motion system and advanced timing functions for fluid UI transitions.' },
  // DATA
  { id:11, name:'Graph Theory', cat:'DATA', desc:'Mathematical structures modeling pairwise relations — foundational to network analysis.' },
  { id:12, name:'Dimensionality Reduction', cat:'DATA', desc:'Techniques like t-SNE, UMAP, PCA that project high-dimensional data to lower spaces.' },
  { id:13, name:'Data Pipelines', cat:'DATA', desc:'ETL architectures transforming raw data streams into structured, queryable datasets.' },
  { id:14, name:'Vector Databases', cat:'DATA', desc:'Purpose-built stores optimised for similarity search across embedding spaces.' },
  // SYSTEMS
  { id:15, name:'Distributed Systems', cat:'SYSTEMS', desc:'Coordinating computation across multiple networked machines for reliability and scale.' },
  { id:16, name:'Kubernetes', cat:'SYSTEMS', desc:'Container orchestration platform automating deployment, scaling, and self-healing.' },
  { id:17, name:'Edge Computing', cat:'SYSTEMS', desc:'Processing data closer to the source, reducing latency in real-time applications.' },
  // MATH
  { id:18, name:'Linear Algebra', cat:'MATH', desc:'The mathematical language of machine learning — vectors, matrices, and tensor operations.' },
  { id:19, name:'Calculus', cat:'MATH', desc:'The mathematics of change — central to gradient-based optimisation in neural networks.' },
  { id:20, name:'Topology', cat:'MATH', desc:'Studying properties preserved under continuous deformation, key to manifold learning.' },
  // DESIGN
  { id:21, name:'Motion Design', cat:'DESIGN', desc:'Applying animation principles to interface transitions for intuitive user guidance.' },
  { id:22, name:'Spatial UI', cat:'DESIGN', desc:'Three-dimensional interface paradigms for XR environments and data visualization.' },
  { id:23, name:'Design Systems', cat:'DESIGN', desc:'Unified component libraries ensuring visual consistency and accelerating development.' },
];
 
const EDGES_DATA = [
  [0,1],[0,2],[0,3],[0,4],[0,5],[0,18],[0,19],
  [1,5],[1,14],[1,18],
  [2,11],[2,18],
  [3,12],[3,6],
  [4,5],[4,12],[4,14],
  [5,8],[5,14],
  [6,10],[6,9],[6,22],
  [7,8],[7,10],[7,23],
  [8,9],[8,13],
  [9,15],
  [11,12],[11,18],[11,20],
  [12,18],[12,20],
  [13,14],[13,15],
  [15,16],[15,17],
  [16,17],
  [18,19],[18,20],
  [21,22],[21,23],[21,10],
  [22,6],[22,3],
];
 
// ============================================================
// STATE
// ============================================================
const canvas = document.getElementById('universe-canvas');
const ctx = canvas.getContext('2d');
 
let W, H, dpr, cx, cy;
let nodes = [];
let edges = [];
let selectedNode = null;
let hoveredNode = null;
let searchQuery = '';
let sidebarOpen = false;
 
let showTrails = true;
let autoOrbit = false;
let simSpeed = 5;
let linkDistance = 100;
 
let camX = 0, camY = 0, camScale = 1;
let targetCamX = 0, targetCamY = 0, targetCamScale = 1;
let isDragging = false;
let dragStartX, dragStartY, dragStartCamX, dragStartCamY;
let orbitAngle = 0;
 
let trailCanvas, trailCtx;
let particlesPool = [];
let fpsFrames = 0, fpsTime = 0, fps = 60;
let lastTime = 0;
let animRunning = false;
 
// ============================================================
// INIT
// ============================================================
function resize() {
  dpr = window.devicePixelRatio || 1;
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  cx = W / 2; cy = H / 2;
 
  if (trailCanvas) {
    trailCanvas.width = W * dpr; trailCanvas.height = H * dpr;
    trailCanvas.style.width = W + 'px'; trailCanvas.style.height = H + 'px';
    trailCtx.scale(dpr, dpr);
  }
}
 
function initTrailCanvas() {
  trailCanvas = document.createElement('canvas');
  trailCanvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;';
  document.body.appendChild(trailCanvas);
  trailCtx = trailCanvas.getContext('2d');
}
 
function buildGraph() {
  const catCenters = {
    AI:      { cx: W*0.35, cy: H*0.38 },
    WEB:     { cx: W*0.62, cy: H*0.32 },
    DATA:    { cx: W*0.55, cy: H*0.62 },
    SYSTEMS: { cx: W*0.30, cy: H*0.65 },
    MATH:    { cx: W*0.22, cy: H*0.42 },
    DESIGN:  { cx: W*0.72, cy: H*0.58 },
  };
 
  nodes = NODES_DATA.map(d => {
    const cc = catCenters[d.cat];
    const angle = Math.random() * Math.PI * 2;
    const r = 40 + Math.random() * 80;
    return {
      ...d,
      x: cc.cx + Math.cos(angle) * r,
      y: cc.cy + Math.sin(angle) * r,
      vx: 0, vy: 0,
      radius: d.cat === 'AI' ? 14 : 11,
      mass: 1,
      pinned: false,
      pulsePhase: Math.random() * Math.PI * 2,
      glowSize: 0,
      targetGlow: 0,
    };
  });
 
  edges = EDGES_DATA.map(([a, b]) => ({ a, b, strength: 0.3 + Math.random() * 0.4 }));
  document.getElementById('stat-nodes').textContent = nodes.length;
  document.getElementById('stat-edges').textContent = edges.length;
  document.getElementById('stat-clusters').textContent = Object.keys(CATEGORIES).length;
}
 
// ============================================================
// FORCE SIMULATION
// ============================================================
function simulateForces(dt) {
  const speed = simSpeed / 5;
  const targetDist = linkDistance;
 
  // Repulsion (Barnes-Hut approximation omitted for clarity; direct O(n²))
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i], n2 = nodes[j];
      const dx = n2.x - n1.x, dy = n2.y - n1.y;
      const d2 = dx*dx + dy*dy + 0.01;
      const d = Math.sqrt(d2);
      const force = (6000 / d2) * speed;
      const fx = (dx / d) * force, fy = (dy / d) * force;
      if (!n1.pinned) { n1.vx -= fx; n1.vy -= fy; }
      if (!n2.pinned) { n2.vx += fx; n2.vy += fy; }
    }
  }
 
  // Attraction along edges
  for (const e of edges) {
    const n1 = nodes[e.a], n2 = nodes[e.b];
    const dx = n2.x - n1.x, dy = n2.y - n1.y;
    const d = Math.sqrt(dx*dx + dy*dy) || 1;
    const force = (d - targetDist) * 0.035 * e.strength * speed;
    const fx = (dx / d) * force, fy = (dy / d) * force;
    if (!n1.pinned) { n1.vx += fx; n1.vy += fy; }
    if (!n2.pinned) { n2.vx -= fx; n2.vy -= fy; }
  }
 
  // Center gravity
  for (const n of nodes) {
    if (n.pinned) continue;
    n.vx += (cx - n.x) * 0.002 * speed;
    n.vy += (cy - n.y) * 0.002 * speed;
    n.vx *= 0.85;
    n.vy *= 0.85;
    n.x += n.vx;
    n.y += n.vy;
  }
}
 
// ============================================================
// PARTICLES
// ============================================================
class Particle {
  constructor() { this.reset(); }
  reset() {
    this.active = false;
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.life = 0; this.maxLife = 0;
    this.color = '#fff'; this.size = 2;
  }
  spawn(x, y, color) {
    this.active = true;
    this.x = x; this.y = y;
    this.vx = (Math.random()-0.5)*1.5;
    this.vy = (Math.random()-0.5)*1.5;
    this.life = 1;
    this.maxLife = 40 + Math.random() * 60;
    this.color = color;
    this.size = 1 + Math.random() * 2;
  }
  update() {
    if (!this.active) return;
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.97; this.vy *= 0.97;
    this.life -= 1 / this.maxLife;
    if (this.life <= 0) this.active = false;
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.globalAlpha = this.life * 0.7;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI*2);
    ctx.fill();
  }
}
 
function getParticle() {
  for (const p of particlesPool) if (!p.active) return p;
  const p = new Particle();
  particlesPool.push(p);
  return p;
}
 
function spawnParticlesOnEdge(edge, t) {
  const n1 = nodes[edge.a], n2 = nodes[edge.b];
  const x = n1.x + (n2.x - n1.x) * t;
  const y = n1.y + (n2.y - n1.y) * t;
  const color = CATEGORIES[n1.cat].color;
  const p = getParticle();
  p.spawn(worldToScreen(x, y).x, worldToScreen(x, y).y, color);
}
 
// ============================================================
// CAMERA & TRANSFORM
// ============================================================
function worldToScreen(wx, wy) {
  return {
    x: (wx - camX) * camScale + cx,
    y: (wy - camY) * camScale + cy,
  };
}
 
function screenToWorld(sx, sy) {
  return {
    x: (sx - cx) / camScale + camX,
    y: (sy - cy) / camScale + camY,
  };
}
 
function lerpCam() {
  camX += (targetCamX - camX) * 0.09;
  camY += (targetCamY - camY) * 0.09;
  camScale += (targetCamScale - camScale) * 0.09;
}
 
// ============================================================
// RENDER
// ============================================================
let frameCount = 0;
 
function renderEdges() {
  for (const e of edges) {
    const n1 = nodes[e.a], n2 = nodes[e.b];
    const s1 = worldToScreen(n1.x, n1.y);
    const s2 = worldToScreen(n2.x, n2.y);
 
    const isHighlighted = selectedNode && (selectedNode.id === e.a || selectedNode.id === e.b);
    const isSearch = searchQuery && (n1.name.toLowerCase().includes(searchQuery) || n2.name.toLowerCase().includes(searchQuery));
 
    ctx.save();
    if (isHighlighted) {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = CATEGORIES[n1.cat].color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = CATEGORIES[n1.cat].color;
      ctx.shadowBlur = 8;
    } else if (isSearch) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
    } else {
      ctx.globalAlpha = selectedNode ? 0.08 : 0.2;
      ctx.strokeStyle = `rgba(255,255,255,0.5)`;
      ctx.lineWidth = 0.5;
    }
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
    ctx.restore();
 
    // Animated particle on edge
    if (showTrails && isHighlighted && Math.random() < 0.08) {
      spawnParticlesOnEdge(e, Math.random());
    }
  }
}
 
function renderNodes(t) {
  for (const n of nodes) {
    const s = worldToScreen(n.x, n.y);
    const color = CATEGORIES[n.cat].color;
    const isSelected = selectedNode && selectedNode.id === n.id;
    const isHovered = hoveredNode && hoveredNode.id === n.id;
    const isNeighbor = selectedNode && edges.some(e =>
      (e.a === selectedNode.id && e.b === n.id) ||
      (e.b === selectedNode.id && e.a === n.id));
    const inSearch = searchQuery && n.name.toLowerCase().includes(searchQuery.toLowerCase());
 
    const pulse = Math.sin(t * 0.002 + n.pulsePhase) * 0.3 + 0.7;
    let r = n.radius * camScale;
 
    // Fade non-connected nodes when something is selected
    let alpha = 1;
    if (selectedNode && !isSelected && !isNeighbor) alpha = 0.15;
    if (searchQuery && !inSearch) alpha *= 0.2;
 
    ctx.save();
    ctx.globalAlpha = alpha;
 
    // Outer glow ring
    if (isSelected || isHovered) {
      const glowR = r * 2.2;
      const grad = ctx.createRadialGradient(s.x, s.y, r, s.x, s.y, glowR);
      grad.addColorStop(0, color.replace(')', ',0.35)').replace('rgb', 'rgba').replace('#', 'rgba(').replace('rgba(', 'rgba(').replace(/rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2}),/, (_, r,g,b) => `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},`));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = colorWithAlpha(color, 0.12);
      ctx.beginPath(); ctx.arc(s.x, s.y, glowR, 0, Math.PI*2); ctx.fill();
    }
 
    // Pulse ring
    if (!selectedNode || isSelected || isNeighbor) {
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.globalAlpha = alpha * pulse * 0.4;
      ctx.beginPath(); ctx.arc(s.x, s.y, r * 1.6, 0, Math.PI*2); ctx.stroke();
    }
 
    // Core circle
    ctx.globalAlpha = alpha;
    const coreGrad = ctx.createRadialGradient(s.x - r*0.3, s.y - r*0.3, 0, s.x, s.y, r);
    coreGrad.addColorStop(0, lighten(color, 0.6));
    coreGrad.addColorStop(1, color);
    ctx.fillStyle = coreGrad;
    ctx.shadowColor = color;
    ctx.shadowBlur = isSelected ? 24 : (isHovered ? 16 : 8);
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
 
    // Label
    if (camScale > 0.55 || isSelected || isHovered || inSearch) {
      ctx.globalAlpha = alpha * (isSelected || isHovered || inSearch ? 1 : Math.min(1, (camScale - 0.5) * 4));
      ctx.fillStyle = isSelected ? '#fff' : (isHovered ? '#fff' : 'rgba(255,255,255,0.75)');
      ctx.font = `${isSelected ? 500 : 400} ${Math.max(9, 12 * camScale)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(n.name, s.x, s.y + r + 5);
    }
 
    ctx.restore();
  }
}
 
function colorWithAlpha(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function lighten(hex, amt) {
  const r = Math.min(255, parseInt(hex.slice(1,3),16) + Math.round(255*amt));
  const g = Math.min(255, parseInt(hex.slice(3,5),16) + Math.round(255*amt));
  const b = Math.min(255, parseInt(hex.slice(5,7),16) + Math.round(255*amt));
  return `rgb(${r},${g},${b})`;
}
 
function renderBackground() {
  ctx.fillStyle = '#020408';
  ctx.fillRect(0, 0, W, H);
 
  // Star field
  if (!renderBackground._stars) {
    renderBackground._stars = Array.from({length:200}, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.2,
      a: Math.random() * 0.5 + 0.1,
    }));
  }
  ctx.save();
  for (const s of renderBackground._stars) {
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
 
function renderParticles() {
  if (!showTrails) return;
  trailCtx.clearRect(0, 0, W, H);
  trailCtx.save();
  for (const p of particlesPool) { p.update(); p.draw(trailCtx); }
  trailCtx.restore();
  trailCtx.globalAlpha = 1;
}
 
function render(ts) {
  if (!animRunning) return;
  requestAnimationFrame(render);
 
  const dt = ts - lastTime; lastTime = ts;
  frameCount++;
 
  // FPS
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 500) {
    fps = Math.round(fpsFrames / (fpsTime / 1000));
    fpsFrames = 0; fpsTime = 0;
    document.getElementById('fps-counter').textContent = fps + ' fps';
  }
 
  simulateForces(dt);
 
  // Auto orbit
  if (autoOrbit) {
    orbitAngle += 0.003;
    targetCamX = cx + Math.sin(orbitAngle) * 60 - cx;
    // gentle rotation: just shift cam target slightly
    for (const n of nodes) { /* orbit is visual via camX shift */ }
  }
 
  lerpCam();
 
  renderBackground();
 
  ctx.save();
  renderEdges();
  renderNodes(ts);
  ctx.restore();
 
  renderParticles();
 
  // Passive particle spawn from selected node
  if (showTrails && selectedNode && Math.random() < 0.25) {
    const n = nodes[selectedNode.id];
    const s = worldToScreen(n.x, n.y);
    const p = getParticle();
    p.spawn(s.x, s.y, CATEGORIES[n.cat].color);
  }
}
 
// ============================================================
// INTERACTION
// ============================================================
function getNodeAtScreen(sx, sy) {
  const world = screenToWorld(sx, sy);
  let closest = null, minD2 = Infinity;
  for (const n of nodes) {
    const dx = n.x - world.x, dy = n.y - world.y;
    const d2 = dx*dx + dy*dy;
    const hitR = n.radius / camScale + 8;
    if (d2 < hitR*hitR && d2 < minD2) { minD2 = d2; closest = n; }
  }
  return closest;
}
 
function selectNode(n) {
  selectedNode = n;
  if (!n) {
    document.getElementById('node-info').classList.remove('visible');
    return;
  }
  document.getElementById('node-info').classList.add('visible');
  document.getElementById('node-name').textContent = n.name;
  document.getElementById('node-type').textContent = CATEGORIES[n.cat].label;
  document.getElementById('node-type').style.color = CATEGORIES[n.cat].color;
  document.getElementById('node-desc').textContent = n.desc;
  const connCount = edges.filter(e => e.a === n.id || e.b === n.id).length;
  document.getElementById('node-connections').textContent = connCount + ' connections';
 
  if (!sidebarOpen) toggleSidebar();
}
 
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  document.getElementById('cursor-dot').style.left = mouseX + 'px';
  document.getElementById('cursor-dot').style.top = mouseY + 'px';
  document.getElementById('cursor-ring').style.left = mouseX + 'px';
  document.getElementById('cursor-ring').style.top = mouseY + 'px';
 
  if (isDragging) {
    targetCamX = dragStartCamX - (e.clientX - dragStartX) / camScale;
    targetCamY = dragStartCamY - (e.clientY - dragStartY) / camScale;
    return;
  }
 
  const n = getNodeAtScreen(e.clientX, e.clientY);
  hoveredNode = n;
  document.body.classList.toggle('hovering', !!n);
 
  const tooltip = document.getElementById('tooltip');
  if (n) {
    tooltip.textContent = n.name;
    tooltip.style.left = e.clientX + 'px';
    tooltip.style.top = e.clientY + 'px';
    tooltip.classList.add('visible');
  } else {
    tooltip.classList.remove('visible');
  }
});
 
canvas.addEventListener('mousedown', e => {
  if (e.target !== canvas) return;
  isDragging = true;
  dragStartX = e.clientX; dragStartY = e.clientY;
  dragStartCamX = camX; dragStartCamY = camY;
});
 
canvas.addEventListener('mouseup', e => {
  const wasDrag = Math.abs(e.clientX - dragStartX) > 4 || Math.abs(e.clientY - dragStartY) > 4;
  isDragging = false;
  if (!wasDrag) {
    const n = getNodeAtScreen(e.clientX, e.clientY);
    selectNode(n);
  }
});
 
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.91;
  const wx = (e.clientX - cx) / camScale + camX;
  const wy = (e.clientY - cy) / camScale + camY;
  targetCamScale = Math.max(0.2, Math.min(4, targetCamScale * factor));
  // Zoom toward cursor
  targetCamX = wx - (e.clientX - cx) / targetCamScale;
  targetCamY = wy - (e.clientY - cy) / targetCamScale;
}, { passive: false });
 
document.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') {
    targetCamX = 0; targetCamY = 0; targetCamScale = 1;
    selectNode(null);
  }
  if (e.key === 'Escape') selectNode(null);
});
 
// Search
document.getElementById('search-input').addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  if (searchQuery) {
    const match = nodes.find(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (match) { targetCamX = match.x - cx/camScale; targetCamY = match.y - cy/camScale; }
  }
});
 
// Sidebar toggle
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar').classList.toggle('open', sidebarOpen);
}
document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
 
// Toggle controls
function setupToggle(id, cb) {
  const el = document.getElementById(id);
  el.addEventListener('click', () => {
    el.classList.toggle('active');
    cb(el.classList.contains('active'));
  });
}
setupToggle('toggle-trails', v => { showTrails = v; if (!v) trailCtx.clearRect(0,0,W,H); });
setupToggle('toggle-orbit', v => { autoOrbit = v; });
document.getElementById('speed-slider').addEventListener('input', e => simSpeed = +e.target.value);
document.getElementById('distance-slider').addEventListener('input', e => linkDistance = +e.target.value);
 
// Legend
function buildLegend() {
  const container = document.getElementById('legend');
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<div class="legend-dot" style="background:${cat.color};color:${cat.color};"></div><span>${cat.label}</span>`;
    item.addEventListener('click', () => {
      // Filter to this category
      searchQuery = '';
      document.getElementById('search-input').value = '';
      selectNode(null);
      // Highlight all nodes of this type
      selectedNode = null;
      const catNodes = nodes.filter(n => n.cat === key);
      if (catNodes.length) {
        const avgX = catNodes.reduce((s,n)=>s+n.x,0)/catNodes.length;
        const avgY = catNodes.reduce((s,n)=>s+n.y,0)/catNodes.length;
        targetCamX = avgX; targetCamY = avgY;
        targetCamScale = 1.2;
      }
    });
    container.appendChild(item);
  }
}
 
// ============================================================
// BOOT
// ============================================================
window.addEventListener('resize', () => { resize(); });
 
function boot() {
  resize();
  initTrailCanvas();
  buildGraph();
  buildLegend();
 
  setTimeout(() => {
    document.getElementById('loading').classList.add('fade-out');
    setTimeout(() => document.getElementById('loading').remove(), 900);
    animRunning = true;
    requestAnimationFrame(render);
  }, 1200);
}
 
boot();
