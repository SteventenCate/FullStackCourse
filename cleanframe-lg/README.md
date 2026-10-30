# CleanFrame for LG webOS

A calm home screen for LG TVs, inspired by CleanFrame for Samsung The Frame.
It shows your apps, a picture and a clock, and nothing else, all driven by
the remote.

Built and tested for an **LG 43UK6200PLA on webOS 4.4 (firmware 05.50.70)**.
That firmware uses Chromium 53, so the app is plain ES5, HTML and CSS with no
build step and no network access.

## What it does

- **Big clock and date**, in 24-hour or 12-hour format.
- **One row of app tiles.** Pick the apps, inputs (HDMI 1–3) and Live TV you
  use, and set their order. The row scrolls once it gets too long.
- **A calm background.** By default it's a painted landscape that changes
  with the time of day (dawn, day, dusk, night with stars) and drifts slowly.
  You can use your own photos instead.
- **Picture-only mode.** After a few idle minutes, or when you press BACK,
  the tiles fade out and only the picture and clock stay on screen. Any key
  brings the tiles back.
- **Settings on the TV.** Press the RED button or select the gear icon.
  Choices are saved on the TV.
- **Magic Remote support.** Point at a tile to focus it, click to open it.
- **Finds installed apps when the firmware allows it.** Apps it finds are
  added to Settings. If the TV refuses, the list in `app/js/config.js` is
  used.

| Remote key | Home screen | Settings |
|---|---|---|
| ◀ ▶ | Move between apps | Move between buttons |
| ▲ ▼ | Gear icon / app row | Move between rows |
| OK | Open the app | Press the button |
| RED | Open Settings | Close |
| BACK | Picture-only mode | Close |

## Install on the TV (Developer Mode)

You need a computer on the same network as the TV, with Node.js installed.

1. **On the TV:** install **Developer Mode** from the LG Content Store. Open
   it and sign in with a free LG Developer account
   (<https://webostv.developer.lge.com>). Turn **Dev Mode Status** on; the TV
   restarts. Open the app again, turn **Key Server** on, and note the IP
   address it shows.
2. **On the computer:**

   ```sh
   npm install -g @webos-tools/cli

   ares-setup-device -a tv -i "host=<TV-IP>" -i "port=9922" -i "username=prisoner"
   ares-novacom --device tv --getkey      # enter the passphrase shown on the TV

   ares-install --device tv cleanframe-lg/dist/com.cleanframe.home_1.0.0_all.ipk
   ares-launch  --device tv com.cleanframe.home
   ```

   If you'd rather not use the command line, **webOS Dev Manager**
   (github.com/webosbrew/dev-manager-desktop) does the same in a window:
   drag the `.ipk` onto it.

3. Move **CleanFrame** to the front of the LG launcher bar (Home button, then
   long-press the tile and drag it) so it's one click away.

**Developer Mode expires after 50 hours.** Open the Developer Mode app and
press **Extend** before it runs out. If it lapses, the TV removes CleanFrame
and you reinstall it with `ares-install`.

## Can it replace LG's Home screen?

**Not on a stock TV.** webOS doesn't let third-party apps replace the
launcher or start themselves when the TV turns on. The Samsung version gets
around this with a Tizen setting, and LG has no equivalent.

If your TV is **rooted** with the Homebrew Channel, you can make CleanFrame
open at boot. Check <https://cani.rootmy.tv> to see whether firmware
05.50.70 can be rooted; newer firmware usually has the exploits patched.
Then add a startup script on the TV:

```sh
# /var/lib/webosbrew/init.d/cleanframe  (chmod +x)
#!/bin/sh
sleep 15
luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.cleanframe.home"}'
```

## Customise

Everything lives in `app/js/config.js`:

- **`apps`**: the apps CleanFrame knows about, with their webOS ids and tile
  colours. To find the id of another app, run
  `ares-install --device tv --listfull`.
- **`photos`**: put JPGs in `app/photos/`, list them here as
  `'photos/name.jpg'`, and they replace the painted landscape. Each one stays
  up for `photoMinutes`. Keep them around 1920×1080; larger files waste the
  TV's memory.
- **`defaults`**: the clock format and picture-only delay used on first
  launch.

After editing, rebuild and reinstall:

```sh
ares-package cleanframe-lg/app -o cleanframe-lg/dist
ares-install --device tv cleanframe-lg/dist/com.cleanframe.home_1.0.0_all.ipk
```

## Try it on a computer

Open `app/index.html` in a browser. Use the arrow keys and Enter; **Esc**
stands in for BACK and **R** for the RED button. App launches are only
logged to the console, because the TV's Luna bridge isn't there.

## Layout

```
cleanframe-lg/
  app/                  the webOS app (this folder is what gets packaged)
    appinfo.json
    index.html
    css/style.css
    js/config.js        your apps, photos and defaults
    js/luna.js          talks to webOS services (launching apps)
    js/scenes.js        time-of-day landscapes
    js/main.js          clock, app row, picture-only mode, settings, remote input
    photos/
  dist/                 the packaged .ipk, ready to install
  tools/make_icons.py   regenerates icon.png / largeIcon.png (needs Pillow)
```
