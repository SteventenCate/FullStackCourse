/*
 * Minimal Luna service bridge for webOS TV 4.x.
 *
 * webOS web apps get a global PalmServiceBridge; we talk to it directly so
 * no extra library has to be bundled. In a desktop browser the bridge does
 * not exist and calls are logged instead, which keeps the UI testable.
 */
var Luna = (function () {
  var pending = [];

  function call(uri, params, done) {
    done = done || function () {};
    if (typeof window.PalmServiceBridge === 'undefined') {
      if (window.console) console.log('[luna:mock]', uri, JSON.stringify(params || {}));
      setTimeout(function () { done({ returnValue: true, mock: true }); }, 0);
      return;
    }
    var bridge = new window.PalmServiceBridge();
    // Keep a reference so the bridge is not garbage collected before replying.
    pending.push(bridge);
    bridge.onservicecallback = function (msg) {
      var res;
      try { res = JSON.parse(msg); } catch (e) { res = { returnValue: false, errorText: 'Bad response' }; }
      var i = pending.indexOf(bridge);
      if (i !== -1) pending.splice(i, 1);
      done(res);
    };
    bridge.call(uri, JSON.stringify(params || {}));
  }

  function launch(appId, done) {
    call('luna://com.webos.applicationManager/launch', { id: appId }, done);
  }

  // Only works when the TV lets this app list launch points (not on every
  // firmware). The caller falls back to the configured app list on failure.
  function listLaunchPoints(done) {
    call('luna://com.webos.applicationManager/listLaunchPoints', {}, done);
  }

  return { call: call, launch: launch, listLaunchPoints: listLaunchPoints };
})();
