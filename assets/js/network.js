/* Home-page network animation (same look as before: teal dots, dark links).
   Improvements: pauses when the Home tab is hidden, handles sharp screens,
   and shows a still picture if the visitor prefers reduced motion. */
(function () {
  var canvas = document.getElementById('network-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cfg = { count: 60, link: 100, mouse: 150, speed: 0.5 };
  var w = 0, h = 0, dpr = 1, particles = [], mouse = { x: null, y: null }, running = false;

  function Particle() {
    this.x = Math.random() * w; this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * cfg.speed; this.vy = (Math.random() - 0.5) * cfg.speed;
    this.size = Math.random() * 2 + 1;
  }
  Particle.prototype.update = function () {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;
    if (mouse.x !== null) {                       // gentle repulsion from the cursor
      var dx = mouse.x - this.x, dy = mouse.y - this.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < cfg.mouse && d > 0) {
        var f = (cfg.mouse - d) / cfg.mouse * 3;
        this.x -= dx / d * f; this.y -= dy / d * f;
      }
    }
  };
  Particle.prototype.draw = function () {
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = '#2dd4bf'; ctx.fill();
  };

  function resize() {
    var box = canvas.parentElement.getBoundingClientRect();
    if (!box.width) return false;                 // Home tab is hidden
    dpr = window.devicePixelRatio || 1;
    w = box.width; h = box.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var small = window.innerWidth < 768;
    cfg.count = small ? 30 : 60; cfg.link = small ? 80 : 100;
    particles = [];
    for (var i = 0; i < cfg.count; i++) particles.push(new Particle());
    return true;
  }

  function links() {
    var max2 = cfg.link * cfg.link;
    for (var a = 0; a < particles.length; a++) {
      for (var b = a + 1; b < particles.length; b++) {
        var dx = particles[a].x - particles[b].x, dy = particles[a].y - particles[b].y, d2 = dx * dx + dy * dy;
        if (d2 < max2) {
          ctx.strokeStyle = 'rgba(12,12,12,' + (1 - d2 / max2) * 0.5 + ')';
          ctx.lineWidth = 1; ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y); ctx.stroke();
        }
      }
    }
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < particles.length; i++) { if (!reduce) particles[i].update(); particles[i].draw(); }
    links();
    if (running && !reduce) requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    if (!resize()) return;
    running = true; frame();
  }
  function stop() { running = false; }

  canvas.addEventListener('mousemove', function (e) {
    var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', function () { mouse.x = null; mouse.y = null; });
  window.addEventListener('resize', function () { if (running) resize(); });

  // site.js announces which tab is visible
  window.addEventListener('tabchange', function (e) { if (e.detail === 'home') { stop(); start(); } else stop(); });
  if (document.getElementById('home') && document.getElementById('home').classList.contains('is-active')) start();
})();
