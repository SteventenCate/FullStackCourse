/*
 * CleanFrame configuration.
 *
 * Edit this file before packaging to change which apps CleanFrame knows
 * about and which photos it shows. Everything here can also be adjusted
 * on the TV itself (press the RED button), except the photo list.
 *
 * App ids are webOS application ids. To find the id of an app that is not
 * listed, run on your computer (TV in Developer Mode):
 *   ares-install --device tv --listfull
 */
var CLEANFRAME_CONFIG = {
  // Shown in this order by default. `show: false` keeps an app available in
  // Settings without putting it on the home row.
  apps: [
    { id: 'com.webos.app.livetv',       name: 'Live TV',      color: '#3d7bd9', show: true  },
    { id: 'netflix',                    name: 'Netflix',      color: '#c8202a', show: true  },
    { id: 'youtube.leanback.v4',        name: 'YouTube',      color: '#d93025', show: true  },
    { id: 'amazon',                     name: 'Prime Video',  color: '#1f9bd1', show: true  },
    { id: 'com.disney.disneyplus-prod', name: 'Disney+',      color: '#1c3f94', show: true  },
    { id: 'spotify-beehive',            name: 'Spotify',      color: '#1db954', show: true  },
    { id: 'com.webos.app.hdmi1',        name: 'HDMI 1',       color: '#6b7380', show: true  },
    { id: 'com.webos.app.hdmi2',        name: 'HDMI 2',       color: '#6b7380', show: false },
    { id: 'com.webos.app.hdmi3',        name: 'HDMI 3',       color: '#6b7380', show: false },
    { id: 'com.apple.appletv',          name: 'Apple TV',     color: '#3a3a3c', show: false },
    { id: 'cdp-30',                     name: 'Plex',         color: '#e5a00d', show: false },
    { id: 'com.webos.app.photovideo',   name: 'Photo & Video',color: '#8a5cd1', show: false },
    { id: 'com.webos.app.browser',      name: 'Web Browser',  color: '#2a8c82', show: false },
    { id: 'com.webos.app.miracast',     name: 'Screen Share', color: '#5a6b85', show: false },
    { id: 'com.palm.app.settings',      name: 'TV Settings',  color: '#4a5260', show: false }
  ],

  // Your own pictures. Put JPGs in the photos/ folder and list them here,
  // e.g. 'photos/beach.jpg'. 1920x1080 is ideal; larger files only waste
  // the TV's memory. When the list is empty, CleanFrame paints a calm
  // landscape that follows the time of day.
  photos: [],

  // Weather from Open-Meteo (free, no account). You can also pick the place
  // on the TV: RED button > Weather location. Set it here to skip that step,
  // e.g. { name: 'Amsterdam', latitude: 52.37, longitude: 4.89 }.
  weather: {
    place: null,
    units: 'c'           // 'c' = Celsius, 'f' = Fahrenheit
  },

  // Defaults for first launch. Changed values are remembered on the TV.
  defaults: {
    clock24: true,       // false = 12-hour clock
    ambientMinutes: 5,   // idle minutes before only the picture + clock remain; 0 = never
    photoMinutes: 10     // how long each photo stays up
  }
};
