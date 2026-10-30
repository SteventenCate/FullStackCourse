/*
 * Weather from Open-Meteo (https://open-meteo.com): free, no account or API
 * key needed. Temperatures are always fetched in Celsius and converted
 * locally, so switching units never needs the network.
 */
var Weather = (function () {
  var FORECAST = '://api.open-meteo.com/v1/forecast';
  var GEOCODE = '://geocoding-api.open-meteo.com/v1/search';
  var TIMEOUT_MS = 15000;

  // Older webOS TVs can fail the TLS handshake on newer certificate chains.
  // If https fails outright, the same request is retried over http.
  var scheme = 'https';

  function getJson(path, cb, retried) {
    var xhr = new XMLHttpRequest();
    var done = false;
    function finish(err, data) {
      if (done) return;
      done = true;
      cb(err, data);
    }
    xhr.open('GET', scheme + path, true);
    xhr.timeout = TIMEOUT_MS;
    xhr.onload = function () {
      if (xhr.status !== 200) return finish(new Error('HTTP ' + xhr.status));
      try { finish(null, JSON.parse(xhr.responseText)); } catch (e) { finish(e); }
    };
    xhr.onerror = xhr.ontimeout = function () {
      if (!retried && scheme === 'https') {
        done = true;
        scheme = 'http';
        getJson(path, cb, true);
        return;
      }
      finish(new Error('Network error'));
    };
    xhr.send();
  }

  function forecast(place, cb) {
    var q = '?latitude=' + place.latitude + '&longitude=' + place.longitude +
      '&current=temperature_2m,weather_code,is_day' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&timezone=auto&forecast_days=4';
    getJson(FORECAST + q, function (err, d) {
      if (err) return cb(err);
      if (!d || !d.current || !d.daily) return cb(new Error('Unexpected weather data'));
      var days = [];
      for (var i = 0; i < d.daily.time.length; i++) {
        days.push({
          date: d.daily.time[i],
          code: d.daily.weather_code[i],
          max: d.daily.temperature_2m_max[i],
          min: d.daily.temperature_2m_min[i]
        });
      }
      cb(null, {
        at: Date.now(),
        temp: d.current.temperature_2m,
        code: d.current.weather_code,
        isDay: d.current.is_day === 1,
        days: days
      });
    });
  }

  function search(name, lang, cb) {
    var q = '?name=' + encodeURIComponent(name) + '&count=6&format=json&language=' + encodeURIComponent(lang || 'en');
    getJson(GEOCODE + q, function (err, d) {
      if (err) return cb(err);
      cb(null, ((d && d.results) || []).map(function (r) {
        return {
          name: r.name,
          detail: [r.admin1, r.country].filter(function (x) { return x; }).join(', '),
          latitude: Math.round(r.latitude * 100) / 100,
          longitude: Math.round(r.longitude * 100) / 100
        };
      }));
    });
  }

  // WMO weather interpretation codes, as used by Open-Meteo.
  function describe(code) {
    if (code === 0) return { text: 'Clear', icon: 'clear' };
    if (code === 1) return { text: 'Mostly clear', icon: 'clear' };
    if (code === 2) return { text: 'Partly cloudy', icon: 'partly' };
    if (code === 3) return { text: 'Overcast', icon: 'cloud' };
    if (code === 45 || code === 48) return { text: 'Fog', icon: 'fog' };
    if (code >= 51 && code <= 57) return { text: 'Drizzle', icon: 'rain' };
    if (code === 61 || code === 80) return { text: 'Light rain', icon: 'rain' };
    if (code === 63 || code === 81) return { text: 'Rain', icon: 'rain' };
    if (code === 65 || code === 82) return { text: 'Heavy rain', icon: 'rain' };
    if (code === 66 || code === 67) return { text: 'Freezing rain', icon: 'rain' };
    if (code >= 71 && code <= 77) return { text: 'Snow', icon: 'snow' };
    if (code === 85 || code === 86) return { text: 'Snow showers', icon: 'snow' };
    if (code >= 95) return { text: 'Thunderstorm', icon: 'storm' };
    return { text: '', icon: 'cloud' };
  }

  var CLOUD = 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 11.1 3.5 3.5 0 0 0 7 18z';
  var PATHS = {
    clear: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
    night: '<path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z"/>',
    partly: '<path d="M8.5 3.2v1.4M3.2 8.5h1.4M4.8 4.8l1 1M12.2 4.8l-1 1"/><path d="M5.6 11.2A3.3 3.3 0 1 1 11.7 8"/><path d="' + CLOUD + '" transform="translate(2 1) scale(.92)"/>',
    partlyNight: '<path d="M12.3 8.3A5 5 0 0 1 6 2.6a5 5 0 0 0-1.6 8.9"/><path d="' + CLOUD + '" transform="translate(2 1) scale(.92)"/>',
    cloud: '<path d="' + CLOUD + '"/>',
    fog: '<path d="M4 9h16M3 13h18M5 17h14"/>',
    rain: '<path d="' + CLOUD + '" transform="translate(0 -3)"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
    snow: '<path d="' + CLOUD + '" transform="translate(0 -3)"/><path d="M8 19.5h.01M12 21h.01M16 19.5h.01M10 22h.01M14 22.5h.01"/>',
    storm: '<path d="' + CLOUD + '" transform="translate(0 -3)"/><path d="M12.5 16l-2 3.5h3l-2 3.5"/>'
  };

  function icon(code, isDay) {
    var kind = describe(code).icon;
    if (!isDay && kind === 'clear') kind = 'night';
    if (!isDay && kind === 'partly') kind = 'partlyNight';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PATHS[kind] + '</svg>';
  }

  function temp(celsius, units) {
    var v = units === 'f' ? celsius * 9 / 5 + 32 : celsius;
    return Math.round(v) + '°';
  }

  return { forecast: forecast, search: search, describe: describe, icon: icon, temp: temp };
})();
