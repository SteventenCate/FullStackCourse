# CleanFrame for LG webOS

A calm home screen for LG TVs, inspired by CleanFrame for Samsung The Frame.
It shows your apps, a picture, a clock and the weather, and nothing else,
all driven by the remote.

Built and tested for an **LG 43UK6200PLA on webOS 4.4 (firmware 05.50.70)**.
That firmware uses Chromium 53, so the app is plain ES5, HTML and CSS with no
build step.

## What it does

- **Big clock and date**, in 24-hour or 12-hour format.
- **Weather.** The current temperature and conditions, today's high and low,
  and the next three days. You set the town on the TV itself. The weather
  refreshes every 30 minutes, and the last forecast is remembered, so it
  shows instantly when you turn the TV on.
- **One row of app tiles.** Pick the apps, inputs (HDMI 1–3) and Live TV you
  use, and set their order.
- **A calm background.** By default it's a painted landscape that changes
  with the time of day (dawn, day, dusk, night with stars). You can use your
  own photos instead.
- **Picture-only mode.** After a few idle minutes, or when you press BACK,
  the tiles fade out and only the picture, clock and current weather stay.
  Any key brings the tiles back.
- **Settings on the TV.** Press the RED button or select the gear icon.
- **Magic Remote support.** Point and click works everywhere.

| Remote key | Home screen | Settings |
|---|---|---|
| ◀ ▶ | Move between apps | Move between buttons |
| ▲ ▼ | Gear icon / app row | Move between rows |
| OK | Open the app | Press the button |
| RED | Open Settings | Close |
| BACK | Picture-only mode | Close |

---

# Step-by-step: put it on your TV

Plan for about 20 minutes the first time. You need:

- the TV and a computer (Windows, Mac or Linux) **on the same home network**;
- the TV connected to the internet, which it already is if Netflix or
  YouTube work on it.

## Step 1: Download CleanFrame to your computer

Download this file and save it somewhere easy to find, such as your
Downloads folder:

**https://github.com/SteventenCate/FullStackCourse/raw/claude/cleanframe-lg-tv-kuskfq/cleanframe-lg/dist/com.cleanframe.home_1.1.0_all.ipk**

(It's also in this repository under `cleanframe-lg/dist/`.)

## Step 2: Create a free LG Developer account

1. On your computer, go to **https://webostv.developer.lge.com**.
2. Click **Sign In**, then **Create Account**, and finish the sign-up. It's
   free.
3. Keep your user ID (email address) and password handy for Step 3.

## Step 3: Turn on Developer Mode on the TV

1. On the TV remote, press **Home** and open the **LG Content Store**.
2. Search for **Developer Mode** (LG's own app) and install it.
3. Open **Developer Mode** and sign in with the account from Step 2.
4. Switch **Dev Mode Status** to **ON**. The TV asks to restart; say yes.
5. When the TV is back on, open **Developer Mode** again and switch
   **Key Server** to **ON**.
6. Leave this screen open. You'll need two things from it in Step 4:
   - the **IP address**, e.g. `192.168.1.50`;
   - the **Passphrase**, six letters and numbers such as `A1B2C3`.

## Step 4: Install CleanFrame from your computer

Use **Option A** unless you're comfortable with a terminal.

### Option A: webOS Dev Manager (point and click)

1. Download **webOS Dev Manager** for your computer from
   **https://github.com/webosbrew/dev-manager-desktop/releases** (pick the
   latest release, then the file for Windows `.msi`/`.exe`, Mac `.dmg` or
   Linux), install it and open it.
2. Click **Add device** (or the **+** button) and fill in:
   - **Name:** `tv`
   - **IP address:** the IP address shown on the TV
   - **Mode / type:** **Developer Mode**
   - **Passphrase:** the passphrase shown on the TV

   Then save. The device should show as connected.
3. Go to the **Apps** tab and click **Install** (or drag the `.ipk` file onto
   the window). Pick the file you downloaded in Step 1.
4. After a few seconds **CleanFrame** appears in the app list.

### Option B: command line

1. Install **Node.js** (the "LTS" version) from **https://nodejs.org**.
2. Open a terminal (Windows: *Command Prompt*; Mac: *Terminal*) and run the
   commands below. Use your TV's IP address and the folder where you saved
   the file.

   ```sh
   npm install -g @webos-tools/cli

   ares-setup-device -a tv -i "host=192.168.1.50" -i "port=9922" -i "username=prisoner"
   ares-novacom --device tv --getkey
   ```

   When `--getkey` asks for a passphrase, type the passphrase shown on the
   TV.

3. Install and start CleanFrame:

   ```sh
   ares-install --device tv Downloads/com.cleanframe.home_1.1.0_all.ipk
   ares-launch  --device tv com.cleanframe.home
   ```

## Step 5: Set up the weather (on the TV)

1. Open **CleanFrame**: press **Home**, scroll the app bar and select it.
   The top right says *"Press the RED button to set your weather location"*.
2. Press the **RED** button on the remote. Settings opens on the right.
3. Press **▼** until **Location** is highlighted, then press **OK**.
4. The TV's on-screen keyboard appears. Type your town (for example
   `Amsterdam`) and press the keyboard's **Enter/OK** key.
5. A list of matching places appears. Use **▲ ▼** to pick the right one
   (the region and country are shown under each name) and press **OK**.
6. Press **BACK** to close Settings. The weather now shows at the top right.

Also under the **WEATHER** heading in Settings:

- **Weather: Shown / Hidden** turns the whole weather block on or off.
- **Temperature: °C / °F** switches units.

## Step 6: Choose your apps (on the TV)

In the same Settings panel (RED button), under **APPS ON THE HOME ROW**:

- Press **OK** on **Shown/Hidden** to add or remove an app.
- Use **▲ / ▼** next to an app to move it left or right on the home row.
- Press **BACK** when you're done. Everything is saved on the TV.

## Step 7: Put CleanFrame first in the LG app bar

1. Press **Home** so the LG app bar appears at the bottom.
2. Highlight **CleanFrame** and **press and hold OK** until the tile lifts
   (edit mode).
3. Press **◀** to move it to the far left, then press **OK** to drop it.

Now CleanFrame is always the first thing after the Home button.

## Step 8: Keep Developer Mode alive (important)

LG's Developer Mode **runs out after 50 hours**. When it expires, the TV
**removes CleanFrame**.

- Every day or two, open the **Developer Mode** app on the TV and press
  **EXTEND**. That resets it to 50 hours. webOS Dev Manager can also
  extend it from your computer.
- If it does expire, repeat **Step 4** to reinstall. Your settings may need
  to be redone.

---

## Troubleshooting

| Problem | What to do |
|---|---|
| Installing fails with "connection refused" or a timeout | Check that Developer Mode shows **Dev Mode Status ON** and **Key Server ON**, that the computer and TV are on the same Wi-Fi/network, and that the IP address is right (it can change after a router restart). |
| The passphrase isn't accepted | Turn Key Server off and on in Developer Mode to get a fresh one, and type it in capital letters exactly as shown. |
| "Weather unavailable right now" | Check that the TV is online (does YouTube play?). CleanFrame tries again every few minutes and whenever you return to it. It also falls back automatically to a plain connection if the TV's older security certificates block the secure one. |
| No places are found | Check the spelling, or try a nearby bigger town. |
| The on-screen keyboard didn't appear | Press **OK** on the text box, or click it with the Magic Remote pointer. |
| "… could not be opened. Is it installed?" | That app isn't installed on your TV. Hide it in Settings, or install it from the LG Content Store. |
| CleanFrame disappeared from the TV | Developer Mode expired. See Step 8, then reinstall with Step 4. |

## Can it replace LG's Home screen?

**Not on a stock TV.** webOS doesn't let third-party apps replace the
launcher or start themselves when the TV turns on. Step 7 (first in the app
bar) is the closest you can get.

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

## Privacy

The weather comes from **Open-Meteo** (https://open-meteo.com), which is
free and needs no account or key. The only thing sent is the place you
picked: the town name while searching, then its rounded coordinates. Weather
data by Open-Meteo.com, licensed under CC BY 4.0.

## Customise (optional, for tinkerers)

Everything lives in `app/js/config.js`:

- **`apps`**: the apps CleanFrame knows about, with their webOS ids and tile
  colours. To find the id of another app, run
  `ares-install --device tv --listfull`.
- **`weather.place`**: preset the location so you can skip Step 5, e.g.
  `{ name: 'Amsterdam', latitude: 52.37, longitude: 4.89 }`.
- **`weather.units`**: `'c'` or `'f'`.
- **`photos`**: put JPGs in `app/photos/`, list them here as
  `'photos/name.jpg'`, and they replace the painted landscape. Keep them
  around 1920×1080.
- **`defaults`**: the clock format and picture-only delay used on first
  launch.

After editing, rebuild and reinstall:

```sh
ares-package cleanframe-lg/app -o cleanframe-lg/dist
ares-install --device tv cleanframe-lg/dist/com.cleanframe.home_1.1.0_all.ipk
```

### Try it on a computer

Open `app/index.html` in a browser. Use the arrow keys and Enter; **Esc**
stands in for BACK and **R** for the RED button. App launches are only
logged to the console, because the TV's Luna bridge isn't there.

### Layout

```
cleanframe-lg/
  app/                  the webOS app (this folder is what gets packaged)
    appinfo.json
    index.html
    css/style.css
    js/config.js        your apps, weather place, photos and defaults
    js/luna.js          talks to webOS services (launching apps)
    js/weather.js       Open-Meteo forecast + place search, weather icons
    js/scenes.js        time-of-day landscapes
    js/main.js          clock, weather, app row, picture-only mode, settings, remote input
    photos/
  dist/                 the packaged .ipk, ready to install
  tools/make_icons.py   regenerates icon.png / largeIcon.png (needs Pillow)
```
