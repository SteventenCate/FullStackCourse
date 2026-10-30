/*
 * CleanFrame for LG webOS: a quiet home screen with your apps, a picture
 * and a clock. Written as ES5 because webOS 4.x runs Chromium 53.
 */
(function () {
  'use strict';

  var KEY = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13,
    BACK: 461, RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406,
    // Desktop stand-ins so the page can be tried in a normal browser.
    ESC: 27, BACKSPACE: 8, R: 82
  };
  var STORE_KEY = 'cleanframe.v1';
  var SELF_ID = 'com.cleanframe.home';
  var AMBIENT_CHOICES = [0, 2, 5, 10, 15, 30];

  var cfg = window.CLEANFRAME_CONFIG;
  var $ = function (id) { return document.getElementById(id); };

  // ---------- State ----------

  var saved = load();
  var prefs = {
    clock24: saved.clock24 !== undefined ? saved.clock24 : cfg.defaults.clock24,
    ambientMinutes: saved.ambientMinutes !== undefined ? saved.ambientMinutes : cfg.defaults.ambientMinutes
  };
  var apps = buildAppList(cfg.apps, saved);

  var view = 'home';            // 'home' | 'settings'
  var homeFocus = 0;            // index into visible apps, or -1 for the gear
  var setFocus = { row: 0, col: 0 };
  var ambient = false;
  var idleTimer = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }

  function save() {
    var hidden = {};
    apps.forEach(function (a) { hidden[a.id] = !a.show; });
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        order: apps.map(function (a) { return a.id; }),
        hidden: hidden,
        clock24: prefs.clock24,
        ambientMinutes: prefs.ambientMinutes
      }));
    } catch (e) { /* storage full or unavailable: settings last this session only */ }
  }

  function buildAppList(defs, s) {
    var byId = {};
    var list = defs.map(function (d) {
      var a = { id: d.id, name: d.name, color: d.color || '#555', icon: null, show: d.show !== false, installed: true };
      byId[a.id] = a;
      return a;
    });
    if (s.hidden) list.forEach(function (a) { if (a.id in s.hidden) a.show = !s.hidden[a.id]; });
    if (s.order) {
      list.sort(function (a, b) {
        var ia = s.order.indexOf(a.id), ib = s.order.indexOf(b.id);
        if (ia === -1) ia = 1e6;
        if (ib === -1) ib = 1e6;
        return ia - ib;
      });
    }
    return list;
  }

  function visibleApps() {
    return apps.filter(function (a) { return a.show && a.installed; });
  }

  // Ask the TV which apps are installed. Firmware that refuses this simply
  // keeps the configured list.
  function discoverApps() {
    Luna.listLaunchPoints(function (res) {
      if (!res || !res.returnValue || !res.launchPoints || res.mock) return;
      var installed = {};
      res.launchPoints.forEach(function (lp) { if (lp.id && !installed[lp.id]) installed[lp.id] = lp; });
      var known = {};
      apps.forEach(function (a) {
        known[a.id] = true;
        var lp = installed[a.id];
        // Inputs and Live TV are not always listed as launch points.
        a.installed = !!lp || a.id.indexOf('com.webos.app.') === 0 || a.id === 'com.palm.app.settings';
        if (lp && lp.icon) a.icon = lp.icon;
      });
      var order = (saved.order || []);
      Object.keys(installed).forEach(function (id) {
        if (known[id] || id === SELF_ID) return;
        var lp = installed[id];
        apps.push({
          id: id, name: lp.title || id, color: lp.bgColor || '#555', icon: lp.icon || null,
          show: saved.hidden ? saved.hidden[id] === false : false, installed: true
        });
      });
      if (order.length) {
        apps.sort(function (a, b) {
          var ia = order.indexOf(a.id), ib = order.indexOf(b.id);
          return (ia === -1 ? 1e6 : ia) - (ib === -1 ? 1e6 : ib);
        });
      }
      renderRow();
      if (view === 'settings') renderSettings();
    });
  }

  // ---------- Clock ----------

  var lastClock = '';
  function tickClock() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var mm = (m < 10 ? '0' : '') + m;
    var time, ampm = '';
    if (prefs.clock24) {
      time = (h < 10 ? '0' : '') + h + ':' + mm;
    } else {
      ampm = h < 12 ? 'AM' : 'PM';
      time = ((h % 12) || 12) + ':' + mm;
    }
    var key = time + ampm + d.getDate();
    if (key === lastClock) return;
    lastClock = key;
    $('clock-time').textContent = time;
    $('clock-ampm').textContent = ampm;
    var dateText;
    try {
      dateText = d.toLocaleDateString(navigator.language || 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (e) {
      dateText = d.toDateString();
    }
    $('date').textContent = dateText;
    updateBackground(false);
  }

  // ---------- Background ----------

  var bgFront = $('bg-a'), bgBack = $('bg-b');
  var currentScene = null, photoIndex = -1, photoChangedAt = 0;

  function showLayer(applyStyle) {
    applyStyle(bgBack);
    bgBack.className = 'bg-layer on';
    bgFront.className = 'bg-layer';
    var t = bgFront; bgFront = bgBack; bgBack = t;
  }

  function updateBackground(force) {
    var photos = cfg.photos || [];
    if (photos.length) {
      var due = Date.now() - photoChangedAt >= cfg.defaults.photoMinutes * 60000;
      if (!force && !due) return;
      photoIndex = (photoIndex + 1) % photos.length;
      photoChangedAt = Date.now();
      var src = photos[photoIndex];
      var img = new Image();
      img.onload = function () {
        showLayer(function (el) { el.style.background = '#000 url("' + src + '") center / cover no-repeat'; });
      };
      img.onerror = function () { if (window.console) console.warn('CleanFrame: cannot load ' + src); };
      img.src = src;
      return;
    }
    var scene = Scenes.sceneFor(new Date());
    if (scene === currentScene && !force) return;
    currentScene = scene;
    showLayer(function (el) { el.style.background = Scenes.background(scene); });
  }

  // ---------- Home row ----------

  var PITCH = 236;          // tile width + margin
  var ROW_VIEW = 1920 - 224; // screen width minus side padding

  function renderRow() {
    var row = $('row');
    var list = visibleApps();
    row.innerHTML = '';
    list.forEach(function (a, i) {
      var t = document.createElement('div');
      t.className = 'tile focusable';
      t.setAttribute('data-index', i);

      var accent = document.createElement('div');
      accent.className = 'accent';
      accent.style.background = a.color;
      t.appendChild(accent);

      var mono = document.createElement('div');
      mono.className = 'mono';
      if (a.icon) {
        var img = document.createElement('img');
        img.src = a.icon;
        mono.appendChild(img);
      } else {
        mono.style.background = a.color;
        mono.textContent = a.name.charAt(0).toUpperCase();
      }
      t.appendChild(mono);

      var name = document.createElement('div');
      name.className = 'name';
      name.textContent = a.name;
      t.appendChild(name);

      t.addEventListener('mouseover', function () { if (view === 'home') { homeFocus = i; paintHomeFocus(); } });
      t.addEventListener('click', function () { if (view === 'home') launchApp(a); });
      row.appendChild(t);
    });
    if (homeFocus >= list.length) homeFocus = list.length - 1;
    if (homeFocus < 0 && list.length && homeFocus !== -1) homeFocus = 0;
    paintHomeFocus();
  }

  function paintHomeFocus() {
    var tiles = $('row').children;
    for (var i = 0; i < tiles.length; i++) {
      tiles[i].className = 'tile focusable' + (i === homeFocus ? ' focused' : '');
    }
    $('gear').className = 'focusable' + (homeFocus === -1 ? ' focused' : '');

    var total = tiles.length * PITCH;
    var x = 0;
    if (total > ROW_VIEW && homeFocus >= 0) {
      x = homeFocus * PITCH - ROW_VIEW / 2 + PITCH / 2;
      x = Math.max(0, Math.min(x, total - ROW_VIEW));
    }
    $('row').style.transform = 'translate3d(' + (-x) + 'px, 0, 0)';
  }

  function launchApp(a) {
    toast('Opening ' + a.name + '…');
    Luna.launch(a.id, function (res) {
      if (!res.returnValue) toast(a.name + ' could not be opened. Is it installed?');
    });
  }

  function homeKey(k) {
    var n = visibleApps().length;
    if (k === KEY.LEFT && homeFocus > 0) homeFocus--;
    else if (k === KEY.RIGHT && homeFocus >= 0 && homeFocus < n - 1) homeFocus++;
    else if (k === KEY.UP) homeFocus = -1;
    else if (k === KEY.DOWN && homeFocus === -1) homeFocus = n ? 0 : -1;
    else if (k === KEY.ENTER) {
      if (homeFocus === -1) openSettings();
      else if (n) launchApp(visibleApps()[homeFocus]);
      return;
    }
    else if (k === KEY.RED) { openSettings(); return; }
    else if (k === KEY.BACK) { setAmbient(true); return; }
    paintHomeFocus();
  }

  // ---------- Picture-only mode ----------

  function setAmbient(on) {
    ambient = on;
    document.body.className = document.body.className.replace(/\s*ambient/g, '') + (on ? ' ambient' : '');
    if (!on) resetIdle();
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    if (prefs.ambientMinutes > 0 && view === 'home') {
      idleTimer = setTimeout(function () { setAmbient(true); }, prefs.ambientMinutes * 60000);
    }
  }

  // ---------- Settings ----------

  function settingsRows() {
    var rows = [
      { head: 'Display' },
      { label: 'Clock', buttons: [{ text: prefs.clock24 ? '24-hour' : '12-hour', act: function () {
        prefs.clock24 = !prefs.clock24; lastClock = ''; tickClock();
      } }] },
      { label: 'Picture only after', buttons: [{ text: prefs.ambientMinutes ? prefs.ambientMinutes + ' min' : 'Never', act: function () {
        var i = AMBIENT_CHOICES.indexOf(prefs.ambientMinutes);
        prefs.ambientMinutes = AMBIENT_CHOICES[(i + 1) % AMBIENT_CHOICES.length];
      } }] },
      { head: 'Apps on the home row' }
    ];
    apps.forEach(function (a, i) {
      if (!a.installed) return;
      rows.push({
        label: a.name,
        dim: !a.show,
        buttons: [
          { text: a.show ? 'Shown' : 'Hidden', on: a.show, act: function () { a.show = !a.show; } },
          { text: '▲', disabled: i === 0, act: function () { return moveApp(i, -1); }, follow: -1 },
          { text: '▼', disabled: i === apps.length - 1, act: function () { return moveApp(i, 1); }, follow: 1 }
        ]
      });
    });
    return rows;
  }

  // Swap with the nearest installed neighbour so hidden-but-uninstalled
  // entries never make a move look like it did nothing.
  function moveApp(i, dir) {
    var j = i + dir;
    while (j >= 0 && j < apps.length && !apps[j].installed) j += dir;
    if (j < 0 || j >= apps.length) return false;
    var t = apps[i]; apps[i] = apps[j]; apps[j] = t;
    return true;
  }

  var rowsCache = [];
  function focusableRows() {
    var out = [];
    rowsCache.forEach(function (r, i) { if (!r.head) out.push(i); });
    return out;
  }

  function renderSettings() {
    rowsCache = settingsRows();
    var list = $('settings-list');
    list.innerHTML = '';
    var fr = focusableRows();
    if (setFocus.row >= fr.length) setFocus.row = fr.length - 1;
    var focusedIdx = fr[setFocus.row];

    rowsCache.forEach(function (r, idx) {
      var el = document.createElement('div');
      if (r.head) {
        el.className = 's-head';
        el.textContent = r.head;
        list.appendChild(el);
        return;
      }
      el.className = 's-row' + (r.dim ? ' dim' : '') + (idx === focusedIdx ? ' current' : '');
      var label = document.createElement('div');
      label.className = 's-label';
      label.textContent = r.label;
      el.appendChild(label);
      if (setFocus.col >= r.buttons.length && idx === focusedIdx) setFocus.col = r.buttons.length - 1;
      r.buttons.forEach(function (b, c) {
        var btn = document.createElement('button');
        btn.className = 's-btn' + (b.on ? ' on' : '') + (b.disabled ? ' disabled' : '') +
          (idx === focusedIdx && c === setFocus.col ? ' focused' : '');
        btn.textContent = b.text;
        btn.addEventListener('mouseover', function () {
          setFocus.row = fr.indexOf(idx); setFocus.col = c; paintSettingsFocus();
        });
        btn.addEventListener('click', function () {
          setFocus.row = fr.indexOf(idx); setFocus.col = c; activateSetting();
        });
        el.appendChild(btn);
      });
      list.appendChild(el);
    });
    scrollSettings();
  }

  function paintSettingsFocus() { renderSettings(); }

  function scrollSettings() {
    var list = $('settings-list');
    var cur = list.querySelector('.s-row.current');
    if (!cur) return;
    var top = cur.offsetTop, bottom = top + cur.offsetHeight;
    var pad = 90;
    if (top - pad < list.scrollTop) list.scrollTop = Math.max(0, top - pad);
    else if (bottom + pad > list.scrollTop + list.clientHeight) list.scrollTop = bottom + pad - list.clientHeight;
  }

  function activateSetting() {
    var r = rowsCache[focusableRows()[setFocus.row]];
    var b = r && r.buttons[setFocus.col];
    if (!b || b.disabled) return;
    var moved = b.act();
    // Keep the moved app under the cursor so it can be pressed repeatedly.
    if (b.follow && moved) setFocus.row += b.follow;
    save();
    renderRow();
    renderSettings();
  }

  function settingsKey(k) {
    var n = focusableRows().length;
    if (k === KEY.BACK || k === KEY.RED) { closeSettings(); return; }
    if (k === KEY.UP && setFocus.row > 0) setFocus.row--;
    else if (k === KEY.DOWN && setFocus.row < n - 1) setFocus.row++;
    else if (k === KEY.LEFT && setFocus.col > 0) setFocus.col--;
    else if (k === KEY.RIGHT) setFocus.col++;
    else if (k === KEY.ENTER) { activateSetting(); return; }
    paintSettingsFocus();
  }

  function openSettings() {
    view = 'settings';
    clearTimeout(idleTimer);
    setFocus = { row: 0, col: 0 };
    document.body.className += ' settings-open';
    $('settings').setAttribute('aria-hidden', 'false');
    renderSettings();
  }

  function closeSettings() {
    view = 'home';
    document.body.className = document.body.className.replace(/\s*settings-open/g, '');
    $('settings').setAttribute('aria-hidden', 'true');
    resetIdle();
  }

  // ---------- Toast ----------

  var toastTimer = null;
  function toast(text) {
    var t = $('toast');
    t.textContent = text;
    t.className = 'show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = ''; }, 2600);
  }

  // ---------- Input ----------

  function normalize(k) {
    if (k === KEY.ESC || k === KEY.BACKSPACE) return KEY.BACK;
    if (k === KEY.R) return KEY.RED;
    return k;
  }

  document.addEventListener('keydown', function (e) {
    var k = normalize(e.keyCode);
    var handled = [KEY.LEFT, KEY.UP, KEY.RIGHT, KEY.DOWN, KEY.ENTER, KEY.BACK, KEY.RED].indexOf(k) !== -1;
    if (handled) e.preventDefault();

    if (ambient) {
      // The first press only wakes the screen.
      setAmbient(false);
      return;
    }
    resetIdle();
    if (view === 'settings') settingsKey(k);
    else homeKey(k);
  });

  var lastMove = 0;
  document.addEventListener('mousemove', function () {
    var now = Date.now();
    if (now - lastMove < 500) return;
    lastMove = now;
    if (ambient) setAmbient(false);
    else resetIdle();
  });

  $('gear').addEventListener('mouseover', function () { if (view === 'home') { homeFocus = -1; paintHomeFocus(); } });
  $('gear').addEventListener('click', function () { if (!ambient) openSettings(); });

  // Pressing the CleanFrame icon again while it is running.
  document.addEventListener('webOSRelaunch', function () {
    if (view === 'settings') closeSettings();
    setAmbient(false);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearTimeout(idleTimer);
    } else {
      lastClock = '';
      tickClock();
      setAmbient(false);
    }
  });

  // ---------- Start ----------

  updateBackground(true);
  tickClock();
  setInterval(tickClock, 1000);
  renderRow();
  resetIdle();
  discoverApps();
})();
