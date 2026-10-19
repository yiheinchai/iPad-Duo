# iPad Duo

A web app (PWA) that turns an **iPad mini (6th generation)** into a convincing **iPhone Duo**, Apple's book-style foldable announced in September 2026. It recreates the iOS 27 interface, the 3D fold animation, and both displays at their real physical size.

No build step and no dependencies. It's plain HTML, CSS and JavaScript, and it works offline once loaded.

## What's replicated

| | |
|---|---|
| **Inner display** | 7.6″, ~1.4:1, landscape. Drawn at exactly 7.58″ diagonal on the iPad mini (163 CSS px per inch), with a nearly invisible crease. |
| **Outer display** | 5.4″, same aspect ratio as the inner one. It's the back of the right half and wakes as the magnets "catch". |
| **The fold** | A real 3D book fold. The right half swings shut around the hinge, with 5.2 mm titanium edges, lighting and a cast shadow. The live app content stays on the flap while it folds. Your fingers drive it: swipe two fingers toward the hinge to fold, away to unfold. |
| **iOS 27 for Duo** | Vertical Dynamic Island on the side, a vertical Dock, circular status cluster in the corner, Lock Screen controls on the side, two Home Screen pages side by side with Today View on the left, Split View with app pairs, and apps that continue from the inner to the outer display. |
| **System** | Lock Screen (swipe up, Touch ID padlock), Always‑On display, Control Centre, Notification Centre, App Switcher, Spotlight, jiggle mode, notification banners, Live Activities, Liquid Glass materials, and a custom keyboard so the iPad keyboard never appears. |
| **Working apps** | Camera (real camera, saves to Photos), Photos, Settings (General → About says **iPhone Duo · iOS 27.1**), Calculator (scientific on the inner display), Clock (world clock, alarms, working stopwatch and timer with a Live Activity), Weather, Notes, Messages (with replies), Phone (DTMF keypad and calling screen), FaceTime (front camera), Music (Now Playing and Dynamic Island), Safari, Calendar, and more. |

## Put it on your iPad

1. It's live at **https://yiheinchai.com/ipad-duo/**. It's published from the `public/ipad-duo/` folder of `yiheinchai/yiheinchai.github.io`, so copy changes from here into that folder to update it. Any other static HTTPS host works too. Safari needs HTTPS for the camera and offline mode.
2. On the iPad mini, open that URL in **Safari**, then go to **Share → Add to Home Screen**.
3. Launch it from the Home Screen in **landscape**.
4. Open the Camera app once and allow camera access, so friends never see the permission prompt.

### Making it airtight

- **Hide the iPad's own status bar.** The page goes fullscreen on your first tap where iPadOS allows it. This is on by default and can be turned off in the hidden setup. In plain Safari you can also use the **Fullscreen** button in the hidden setup.
- **Block iPad gestures.** Turn on **Guided Access** (Settings → Accessibility → Guided Access) and triple‑click the top button to start it. Friends then can't swipe out to the real iPadOS.
- **Keep the screen on.** The app requests a screen wake lock. You can also set Auto‑Lock to *Never* on the iPad.
- When the iPad wakes from sleep, the app shows the iPhone Duo Lock Screen, just like a real phone.

## Controls

The black border around the "phone" is your secret control surface.

| Gesture | Action |
|---|---|
| Two‑finger swipe toward the hinge / away from it | Fold / unfold (follows your fingers) |
| Double‑tap the black border | Fold / unfold |
| Triple‑tap the black border | Sleep (Always‑On) / wake |
| Press and hold the black border (1 s) | **Hidden setup** |
| Swipe up from the bottom edge | Home. Pause midway for the App Switcher |
| Swipe down from the top‑right / top‑left | Control Centre / Notification Centre |
| Tap the ••• at the top of an app (inner display) | Full Screen / Split View |
| Long‑press the Home Screen | Jiggle mode |

The **hidden setup** lets you:

- fake a message, an incoming call or an AirPods connection after a 5‑second delay, so you can hand the phone over first
- set your name, the device name, the carrier and the weather city
- switch between true size and fill‑screen, and between Night Sky and Star White
- pick a wallpaper or use your own photo
- import real photos into the Photos app

With a hardware keyboard: `F` fold, `L` sleep, `M` message, `C` call, `A` AirPods, `H` home.

## Honest limitations

- An iPad can't physically fold. Folding is an on‑screen effect, and the closed "phone" is drawn at its real size in the middle of the iPad.
- Public details of iOS 27 on iPhone Duo are limited. The layouts follow Apple's description: side Dynamic Island, side Dock, a circular status cluster in the corner, Today View on the left and Split View. Some fine details are informed guesses.
- Safari pages mostly show sites that allow embedding, such as Wikipedia. Many big sites block it.
- The iPad mini has no ultra‑wide camera, so the camera's ".5" zoom shows the full sensor field of view.

## Project layout

```
index.html, manifest.webmanifest, sw.js   PWA shell + offline cache
css/duo.css       system UI (status, island, lock, home, dock, CC, keyboard, fold)
css/apps.css      app chrome and apps
js/main.js        sizing, fold gestures, hidden setup, fullscreen, wake lock
js/fold.js        3D fold engine
js/os.js          iOS shell: lock, home, windows, Split View, switcher, CC, banners, Dynamic Island
js/apps/*.js      the apps
```

Run it locally with any static server, for example `npx serve .`, then open it in a browser sized 1133×744 to match the iPad mini in landscape.
