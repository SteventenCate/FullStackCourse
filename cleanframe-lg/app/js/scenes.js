/*
 * Painted landscapes that follow the time of day. Used when no photos are
 * configured. Everything is CSS gradients plus one inline SVG, so the TV
 * never has to decode a large image.
 */
var Scenes = (function () {
  var PALETTES = {
    dawn:  { sky: ['#283a66', '#8a6a8c', '#e39a86', '#f6cf9c'], glow: 'rgba(255,214,160,0.55)', glowAt: '72% 78%',
             hills: ['#4a4560', '#36334a', '#221f30'], stars: 0 },
    day:   { sky: ['#4f86b8', '#7fb0d6', '#b9d5e6', '#efe3cd'], glow: 'rgba(255,250,230,0.45)', glowAt: '78% 22%',
             hills: ['#6e8a8f', '#4f6a6f', '#34484c'], stars: 0 },
    dusk:  { sky: ['#17213d', '#4b3a6b', '#b05d74', '#ee9a6c'], glow: 'rgba(255,170,120,0.5)', glowAt: '28% 80%',
             hills: ['#3b2d4a', '#2a2036', '#1a1424'], stars: 18 },
    night: { sky: ['#03050a', '#0a1222', '#121c33', '#1c2742'], glow: 'rgba(200,215,255,0.16)', glowAt: '80% 20%',
             hills: ['#141b2b', '#0e1320', '#080b14'], stars: 90 }
  };

  function sceneFor(date) {
    var h = date.getHours() + date.getMinutes() / 60;
    if (h >= 5.5 && h < 8.5) return 'dawn';
    if (h >= 8.5 && h < 17.5) return 'day';
    if (h >= 17.5 && h < 20.5) return 'dusk';
    return 'night';
  }

  // Deterministic pseudo-random so stars do not jump between repaints.
  function rng(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  function landscapeSvg(p) {
    var r = rng(7), stars = '';
    for (var i = 0; i < p.stars; i++) {
      var x = Math.round(r() * 1920), y = Math.round(r() * 560), rad = (r() * 1.4 + 0.6).toFixed(1);
      stars += '<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" fill="#fff" opacity="' + (r() * 0.6 + 0.25).toFixed(2) + '"/>';
    }
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice">' +
      stars +
      '<path fill="' + p.hills[0] + '" d="M0 700 C 260 620 420 660 640 610 S 1060 520 1300 600 S 1700 640 1920 580 V1080 H0Z"/>' +
      '<path fill="' + p.hills[1] + '" d="M0 800 C 300 730 520 790 820 740 S 1320 680 1560 750 S 1820 780 1920 760 V1080 H0Z"/>' +
      '<path fill="' + p.hills[2] + '" d="M0 900 C 360 850 640 900 980 870 S 1600 830 1920 880 V1080 H0Z"/>' +
      '</svg>';
    return 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
  }

  var cache = {};
  function background(name) {
    if (cache[name]) return cache[name];
    var p = PALETTES[name];
    cache[name] =
      landscapeSvg(p) + ' center bottom / cover no-repeat, ' +
      'radial-gradient(circle at ' + p.glowAt + ', ' + p.glow + ' 0, rgba(0,0,0,0) 38%), ' +
      'linear-gradient(180deg, ' + p.sky[0] + ' 0%, ' + p.sky[1] + ' 38%, ' + p.sky[2] + ' 66%, ' + p.sky[3] + ' 100%)';
    return cache[name];
  }

  return { sceneFor: sceneFor, background: background };
})();
