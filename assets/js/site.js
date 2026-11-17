/* DELTA website – one script
   1. tiny helpers   2. tab router   3. data loaders   4. one renderer per tab   5. lightbox
   Content lives in /data/*.json – edit those, not this file. */
(function () {
  'use strict';

  // ---------- 1. helpers -------------------------------------------------
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function loadJSON(name) {
    return fetch('data/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name + '.json: HTTP ' + r.status);
      return r.json();
    });
  }
  function onActivate(el, fn) {                      // click + Enter/Space for non-link controls
    el.addEventListener('click', fn);
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
  }
  function fail(sel, name) {
    var el = $(sel);
    if (el) el.innerHTML = '<p class="empty">Could not load ' + esc(name) + '.</p>';
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function monthYear(d) { var p = String(d).split('-'); return (MONTHS[(+p[1] || 1) - 1] || '') + ' ' + p[0]; }
  function stripTags(html) { var t = document.createElement('div'); t.innerHTML = html; return t.textContent || ''; }

  // ---------- 2. tab router (#home, #team, #research, #software, #publications, #news, #contacts)
  var TABS = $$('.tab').map(function (t) { return t.id; });
  function currentTab() {
    var id = (location.hash || '#home').slice(1);
    return TABS.indexOf(id) >= 0 ? id : 'home';
  }
  function showTab(id, scroll) {
    $$('.tab').forEach(function (t) { t.classList.toggle('is-active', t.id === id); });
    $$('.nav a').forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
    var bar = $('.topbar-inner'), cur = $('.nav a[aria-current="page"]');   // keep the active tab visible in the phone menu
    if (bar && cur && bar.scrollWidth > bar.clientWidth) {
      var r = cur.getBoundingClientRect(), br = bar.getBoundingClientRect();
      bar.scrollTo({ left: bar.scrollLeft + (r.left - br.left) - (br.width - r.width) / 2, behavior: 'smooth' });
    }
    window.dispatchEvent(new CustomEvent('tabchange', { detail: id }));
  }
  window.addEventListener('hashchange', function () { showTab(currentTab(), true); });
  showTab(currentTab(), false);

  // ---------- 3+4. renderers ---------------------------------------------
  var data = {};   // filled as JSON files arrive (used by Home for counts/news)

  // ----- TEAM
  var ICONS = { email: 'fas fa-envelope', scholar: 'fas fa-graduation-cap', linkedin: 'fab fa-linkedin-in', twitter: 'fab fa-twitter',
                github: 'fab fa-github', orcid: 'fab fa-orcid', website: 'fas fa-globe' };
  var ICON_TITLES = { email: 'Email', scholar: 'Google Scholar', linkedin: 'LinkedIn', twitter: 'X / Twitter', github: 'GitHub', orcid: 'ORCID', website: 'Website' };
  function renderTeam(t) {
    var html = '';
    if (t.team_photo) html += '<img class="team-photo" src="' + esc(t.team_photo) + '" alt="The DELTA team" loading="lazy">';
    (t.groups || []).forEach(function (g) {
      var people = (t.current || []).filter(function (p) { return p.group === g; });
      if (!people.length) return;
      html += '<h2 class="group-title">' + esc(g) + '</h2><div class="members">' + people.map(memberHTML).join('') + '</div>';
    });
    if ((t.alumni || []).length) {
      html += '<h2 class="group-title">Former members</h2><ul class="alumni">' + t.alumni.map(function (a) {
        return '<li><b>' + esc(a.name) + '</b>' + (a.role ? ' <span>· ' + esc(a.role) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    $('#team-root').innerHTML = html;
  }
  function memberHTML(p) {
    var l = p.links || {}, icons = '';
    Object.keys(ICONS).forEach(function (k) {
      if (!l[k]) return;
      var href = k === 'email' ? 'mailto:' + l[k] : l[k];
      icons += '<a href="' + esc(href) + '"' + (k === 'email' ? '' : ' target="_blank" rel="noopener"') +
               ' aria-label="' + ICON_TITLES[k] + ' – ' + esc(p.name) + '" title="' + ICON_TITLES[k] + '"><i class="' + ICONS[k] + '"></i></a>';
    });
    var img = '';
    if (p.photo) {
      var st = 'object-position:' + esc(p.photo_position || 'center 30%') + ';';
      if (p.photo_zoom) st += 'transform:scale(' + (+p.photo_zoom) + ');transform-origin:' + esc(p.photo_position || 'center') + ';';
      img = '<img src="' + esc(p.photo) + '" alt="' + esc(p.name) + '" loading="lazy" style="' + st + '">';
    }
    return '<div class="member"><div class="avatar">' + img + '</div><h3>' + esc(p.name) + '</h3>' +
      '<div class="role">' + esc(p.role) + '</div>' + (p.dates ? '<div class="dates">' + esc(p.dates) + '</div>' : '') +
      (icons ? '<div class="icons">' + icons + '</div>' : '') + '</div>';
  }

  // ----- CONTACT (open positions come from team.json)
  function renderPositions(t) {
    var list = t.open_positions || [], el = $('#positions-root');
    if (!el) return;
    el.innerHTML = list.length ? '<ul class="positions">' + list.map(function (p) {
      return '<li><b>' + esc(p.title) + '</b> – ' + esc(p.description) +
        (p.contact ? '<br><a class="link" href="mailto:' + esc(p.contact) + '">Send your application to ' + esc(p.contact) + '</a>' : '') + '</li>';
    }).join('') + '</ul>' : '<p class="muted">No open positions at the moment. Spontaneous applications are welcome – write to us.</p>';
  }

  // ----- RESEARCH
  function renderResearch(r) {
    var tools = (data.software && data.software.tools) || [];
    $('#research-root').innerHTML = (r.themes || []).map(function (t) {
      var chips = (t.software || []).filter(function (n) { return tools.some(function (s) { return s.name === n; }); })
        .map(function (n) { return '<a class="pill" href="#software">' + esc(n) + ' <i class="fas fa-arrow-right" style="font-size:.7em"></i></a>'; }).join('');
      return '<article class="card theme"><div class="theme-img"><img src="' + esc(t.image) + '" alt="' + esc(t.alt || t.title) + '" loading="lazy"></div>' +
        '<div><h2>' + esc(t.title) + '</h2>' + (t.summary ? '<p class="summary">' + esc(t.summary) + '</p>' : '') +
        ((t.highlights || []).length ? '<ul class="checks">' + t.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="body prose">' + (t.paragraphs || []).map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>' +
        (chips ? '<div class="tools"><span class="label">Software</span>' + chips + '</div>' : '') + '</div></article>';
    }).join('');
  }

  // ----- SOFTWARE
  function linkIcon(label) {
    var l = label.toLowerCase();
    if (/code|github|gitlab/.test(l)) return 'fas fa-code';
    if (/galaxy/.test(l)) return 'fas fa-flask';
    if (/doc/.test(l)) return 'fas fa-book';
    if (/web|site|server/.test(l)) return 'fas fa-globe';
    return 'fas fa-file-alt';
  }
  function renderSoftware(s) {
    $('#software-root').innerHTML = (s.tools || []).map(function (t) {
      var links = (t.links || []).filter(function (l) { return l.url; }).map(function (l, i) {
        var isPaper = /paper|preprint/i.test(l.label);
        return '<a class="btn' + (isPaper ? ' alt' : '') + '" href="' + esc(l.url) + '" target="_blank" rel="noopener"' +
          (l.note ? ' title="' + esc(l.note) + '"' : '') + '><i class="' + linkIcon(l.label) + '"></i>' + esc(l.label) + '</a>';
      }).join('');
      return '<article class="card tool"><div class="tool-img"><img src="' + esc(t.image) + '" alt="' + esc(t.name) + '" loading="lazy"></div>' +
        '<div><h2>' + esc(t.name) + '</h2><p class="tagline">' + esc(t.tagline) + '</p>' +
        ((t.tags || []).length ? '<div class="pills">' + t.tags.map(function (g) { return '<span class="pill">' + esc(g) + '</span>'; }).join('') + '</div>' : '') +
        '<div class="links">' + links + '</div></div></article>';
    }).join('');
  }

  // ----- NEWS
  var newsState = { tag: '' };
  function renderNews(n) {
    var items = n.news || [];
    var tags = [];
    items.forEach(function (i) { if (i.tag && tags.indexOf(i.tag) < 0) tags.push(i.tag); });
    var chipsEl = $('#news-tags');
    chipsEl.innerHTML = '<button type="button" class="chip is-active" data-tag="">All <span class="n">' + items.length + '</span></button>' + tags.map(function (t) {
      var c = items.filter(function (i) { return i.tag === t; }).length;
      return '<button type="button" class="chip" data-tag="' + esc(t) + '">' + esc(t) + ' <span class="n">' + c + '</span></button>';
    }).join('');
    $$('.chip', chipsEl).forEach(function (b) {
      b.addEventListener('click', function () {
        newsState.tag = b.getAttribute('data-tag');
        $$('.chip', chipsEl).forEach(function (x) { x.classList.toggle('is-active', x === b); });
        drawNews(items);
      });
    });
    drawNews(items);
  }
  function drawNews(items) {
    var shown = items.filter(function (i) { return !newsState.tag || i.tag === newsState.tag; });
    var byYear = {}, years = [];
    shown.forEach(function (i) { var y = String(i.date).slice(0, 4); if (!byYear[y]) { byYear[y] = []; years.push(y); } byYear[y].push(i); });
    $('#news-root').innerHTML = years.map(function (y) {
      return '<section class="year-block"><h2 class="group-title">' + esc(y) + '</h2>' + byYear[y].map(function (i) {
        var thumbs = (i.images || []).map(function (im) {
          return '<button type="button" class="thumb" data-full="' + esc(im.src) + '" aria-label="Enlarge: ' + esc(im.alt) + '"><img src="' + esc(im.src) + '" alt="' + esc(im.alt) + '" loading="lazy"></button>';
        }).join('');
        return '<article class="news-item"><div class="news-date">' + esc(monthYear(i.date)) + '</div><div class="news-body">' +
          '<h3>' + esc(i.title) + (i.tag ? ' <span class="pill">' + esc(i.tag) + '</span>' : '') + '</h3>' +
          '<p class="prose">' + (i.text || '') + '</p>' + (thumbs ? '<div class="thumbs">' + thumbs + '</div>' : '') + '</div></article>';
      }).join('') + '</section>';
    }).join('') || '<p class="empty">No news in this category.</p>';
  }

  // ----- PUBLICATIONS (data/publications.json is also written by fetch_publications.py)
  var TEAM_RX = /^(Hamed Khakzad|Yasaman Karami|Omid Mokhtari|Luiz Felipe Piochi|Sneha Bheemireddy|Ishola Abeeb Akinwumi|Roy González(?:[- ]Alem[aá]n)?|Nicolas Buton|Victor Pryakhin|Jalim Singh|Raul Jorge Carvalho Sofia|Margot Weber)$/;
  var MAX_AUTHORS = 10, SHOWN_AUTHORS = 6;
  var pubState = { q: '', journal: '', type: '' }, pubs = [];
  function pubType(p) {
    var j = p.journal || '';
    if (/rxiv|preprint/i.test(j)) return 'preprint';
    if (/workshop|symposium|conference|proceedings|chapter|macromolecular protein complexes/i.test(j)) return 'workshop';
    return 'journal';
  }
  var PUB_TYPES = { journal: 'Journal articles', preprint: 'Preprints', workshop: 'Workshops & chapters' };
  function plainDoi(v) {                              // accepts "10.x/y", a doi.org URL, or the old <a> snippet
    var m = String(v || '').match(/10\.\d{4,9}\/[^\s"'<>]+/);
    return m ? m[0] : '';
  }
  function authorsHTML(str) {
    var names = String(str || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var h = names.map(function (n) { return TEAM_RX.test(n) ? '<strong>' + esc(n) + '</strong>' : esc(n); });
    if (h.length <= MAX_AUTHORS) return h.join(', ');
    var label = '… +' + (h.length - SHOWN_AUTHORS) + ' more';
    return h.slice(0, SHOWN_AUTHORS).join(', ') + '<span class="more" hidden>, ' + h.slice(SHOWN_AUTHORS).join(', ') + '</span> ' +
      '<span class="toggle" role="button" tabindex="0" aria-expanded="false" data-label="' + label + '">' + label + '</span>';
  }
  function renderPubs(d) {
    var all = d.publications || [], total = all.length, seen = {};
    pubs = all.map(function (p, i) { return Object.assign({}, p, { num: total - i, type: pubType(p), order: i }); })
      .filter(function (p) { var k = (p.title || '').toLowerCase().replace(/\W+/g, '') + p.year; if (seen[k]) return false; seen[k] = 1; return true; });
    pubs.sort(function (a, b) { return (Number(b.year) - Number(a.year)) || (a.order - b.order); });
    // numbering follows the (de-duplicated) list, newest = highest
    pubs.forEach(function (p, i) { p.num = pubs.length - i; });

    var years = pubs.map(function (p) { return +p.year; }).filter(Boolean);
    var venues = {}; pubs.forEach(function (p) { if (p.journal) venues[p.journal] = (venues[p.journal] || 0) + 1; });
    $('#pub-stats').textContent = pubs.length + ' publications · ' + Math.min.apply(null, years) + '–' + Math.max.apply(null, years) + ' · ' + Object.keys(venues).length + ' journals & venues';

    var sel = $('#pub-journal');
    Object.keys(venues).sort(function (a, b) { return a.localeCompare(b); }).forEach(function (j) {
      var o = document.createElement('option'); o.value = j; o.textContent = j + ' (' + venues[j] + ')'; sel.appendChild(o);
    });
    var tc = {}; pubs.forEach(function (p) { tc[p.type] = (tc[p.type] || 0) + 1; });
    var types = $('#pub-types');
    types.innerHTML = '<button type="button" class="chip is-active" data-type="">All <span class="n">' + pubs.length + '</span></button>' +
      ['journal', 'preprint', 'workshop'].filter(function (t) { return tc[t]; }).map(function (t) {
        return '<button type="button" class="chip" data-type="' + t + '">' + PUB_TYPES[t] + ' <span class="n">' + tc[t] + '</span></button>';
      }).join('');
    $$('.chip', types).forEach(function (b) {
      b.addEventListener('click', function () {
        pubState.type = b.getAttribute('data-type');
        $$('.chip', types).forEach(function (x) { x.classList.toggle('is-active', x === b); });
        drawPubs();
      });
    });
    $('#pub-search').addEventListener('input', function (e) { pubState.q = e.target.value.trim().toLowerCase(); drawPubs(); });
    sel.addEventListener('change', function () { pubState.journal = sel.value; drawPubs(); });
    $('#pub-root').addEventListener('click', toggleAuthors);
    $('#pub-root').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') toggleAuthors(e); });
    drawPubs();
  }
  function toggleAuthors(e) {
    var t = e.target.closest('.toggle'); if (!t) return;
    e.preventDefault();
    var more = t.parentNode.querySelector('.more'), open = more.hasAttribute('hidden');
    if (open) more.removeAttribute('hidden'); else more.setAttribute('hidden', '');
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
    t.textContent = open ? 'show less' : t.getAttribute('data-label');
  }
  function drawPubs() {
    var shown = pubs.filter(function (p) {
      if (pubState.journal && p.journal !== pubState.journal) return false;
      if (pubState.type && p.type !== pubState.type) return false;
      if (!pubState.q) return true;
      var hay = [p.title, p.authors, p.journal, p.year, (p.tags || []).join(' ')].join(' ').toLowerCase();
      return pubState.q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    });
    $('#pub-count').textContent = shown.length === pubs.length ? shown.length + ' publications' : shown.length + ' of ' + pubs.length + ' publications';
    var byYear = {}, order = [];
    shown.forEach(function (p) { if (!byYear[p.year]) { byYear[p.year] = []; order.push(p.year); } byYear[p.year].push(p); });
    var jump = $('#pub-years');
    if (!shown.length) { jump.innerHTML = ''; $('#pub-root').innerHTML = '<p class="empty">No publications match your search.</p>'; return; }
    jump.innerHTML = '<span class="label">Jump to</span>' + order.map(function (y) {
      return '<button type="button" class="chip" data-year="' + esc(y) + '">' + esc(y) + ' <span class="n">' + byYear[y].length + '</span></button>';
    }).join('');
    $$('.chip', jump).forEach(function (b) {
      b.addEventListener('click', function () {
        var target = document.getElementById('pub-year-' + b.getAttribute('data-year'));
        if (!target) return;
        var offset = $('#publications .toolbar-sticky').offsetHeight + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 76) + 8;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
      });
    });
    $('#pub-root').innerHTML = order.map(function (y) {
      var items = byYear[y].map(function (p) {
        var title = p.link ? '<a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a>' : esc(p.title);
        var doi = plainDoi(p.doi), info = '';
        if (p.journal) info += '<span class="venue">' + esc(p.journal) + '</span>';
        info += '<span>' + esc(p.year) + '</span>';
        if (p.type === 'preprint') info += '<span class="pill warn">Preprint</span>';
        (p.tags || []).forEach(function (t) { info += '<span class="pill">' + esc(t) + '</span>'; });
        if (p.link) info += '<a class="btn" href="' + esc(p.link) + '" target="_blank" rel="noopener">Paper</a>';
        if (doi) info += '<a class="btn alt" href="https://doi.org/' + esc(doi) + '" target="_blank" rel="noopener">DOI</a>';
        return '<li class="pub"><div class="pub-num">' + p.num + '</div><div class="pub-body"><p class="pub-title">' + title + '</p>' +
          '<p class="pub-authors">' + authorsHTML(p.authors) + '</p><div class="pub-info">' + info + '</div></div></li>';
      }).join('');
      return '<section class="pub-year" id="pub-year-' + esc(y) + '"><h2 class="group-title">' + esc(y) +
        ' <span class="n">' + byYear[y].length + ' publication' + (byYear[y].length > 1 ? 's' : '') + '</span></h2><ul class="pub-items">' + items + '</ul></section>';
    }).join('');
  }

  // ----- HOME (numbers + latest news are computed from the data files)
  function renderHome() {
    var statsEl = $('#home-stats');
    var parts = [];
    if (data.publications) parts.push(['' + data.publications.publications.length, 'publications']);
    if (data.software) parts.push(['' + data.software.tools.length, 'open-source tools']);
    if (data.team) parts.push(['' + data.team.current.length, 'team members']);
    statsEl.innerHTML = parts.map(function (p) { return '<div class="stat"><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></div>'; }).join('');
    if (data.news) {
      var latest = data.news.news.slice(0, 3);
      $('#home-news').innerHTML = latest.map(function (i) {
        return '<a class="news-card" href="#news"><div class="meta"><span>' + esc(monthYear(i.date)) + '</span>' +
          (i.tag ? '<span class="pill">' + esc(i.tag) + '</span>' : '') + '</div><h3>' + esc(i.title) + '</h3></a>';
      }).join('');
    }
  }

  // ---------- load everything in parallel; each tab renders as soon as its data is in
  var jobs = [
    loadJSON('team').then(function (d) { data.team = d; renderTeam(d); renderPositions(d); }).catch(function (e) { console.error(e); fail('#team-root', 'team.json'); }),
    loadJSON('software').then(function (d) { data.software = d; renderSoftware(d); }).catch(function (e) { console.error(e); fail('#software-root', 'software.json'); }),
    loadJSON('news').then(function (d) { data.news = d; renderNews(d); }).catch(function (e) { console.error(e); fail('#news-root', 'news.json'); }),
    loadJSON('publications').then(function (d) { data.publications = d; renderPubs(d); }).catch(function (e) { console.error(e); fail('#pub-root', 'publications.json'); }),
  ];
  // research chips link to software, so it waits for software.json
  Promise.all(jobs).then(function () {
    return loadJSON('research').then(renderResearch).catch(function (e) { console.error(e); fail('#research-root', 'research.json'); });
  }).then(renderHome);

  // ---------- 5. lightbox for news photos
  var box = document.createElement('div'); box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Photo');
  box.innerHTML = '<img alt="">'; document.body.appendChild(box);
  function closeBox() { box.classList.remove('is-open'); }
  box.addEventListener('click', closeBox);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBox(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.thumb'); if (!t) return;
    var img = $('img', box); img.src = t.getAttribute('data-full'); img.alt = $('img', t).alt; box.classList.add('is-open');
  });

  // footer year
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
