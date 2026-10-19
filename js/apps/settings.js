import { h, store, rng } from '../util.js';
import { iconSVG, G } from '../icons.js';
import { navStack, section, tile, S, toggle } from './ui.js';
import { batteryLevel } from '../data.js';

const C = {
  orange: '#ff9f0a',
  blue: '#0a84ff',
  green: '#30d158',
  gray: '#8e8e93',
  red: '#ff453a',
  pink: '#ff375f',
  indigo: '#5e5ce6',
  cyan: '#32ade6',
  teal: '#00c7be',
  black: '#1c1c1e',
};

// Stable fake identifiers for the About page.
function ids() {
  let v = store.get('ids');
  if (!v) {
    const r = rng(Date.now() & 0xffffff);
    const pick = (chars, n) => Array.from({ length: n }, () => chars[Math.floor(r() * chars.length)]).join('');
    const AN = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    const mac = () => Array.from({ length: 6 }, () => pick('0123456789ABCDEF', 2)).join(':');
    v = {
      serial: pick(AN, 10),
      model: 'M' + pick('ABCDEFGHJKLMNPQRSTUVWXYZ', 2) + pick('0123456789', 2) + 'LL/A',
      wifi: mac(),
      bt: mac(),
      imei: '35 ' + pick('0123456789', 6) + ' ' + pick('0123456789', 6) + ' ' + pick('0123456789', 1),
      eid: pick('0123456789', 32),
      seid: 'BAE' + pick('0123456789ABCDEF', 4) + pick('0123456789', 9),
      avail: (240 + r() * 120).toFixed(1),
      photos: Math.floor(3000 + r() * 6000),
      songs: Math.floor(400 + r() * 2000),
      apps: Math.floor(60 + r() * 60),
    };
    store.set('ids', v);
  }
  return v;
}

export default {
  theme: 'dark',
  mount(root, api) {
    const os = api.os;
    const cfg = api.cfg;
    const I = ids();
    let wide = false;
    let sideNav;
    let mainNav;
    let selRow = null;

    const open = (key, rowEl) => {
      const view = PAGES[key] ? PAGES[key]() : simplePage(key);
      if (wide) {
        selRow?.classList.remove('sel');
        if (rowEl && rowEl.closest('.side')) {
          selRow = rowEl;
          rowEl.classList.add('sel');
          mainNav.reset(view);
        } else mainNav.push(view);
      } else (rowEl?.closest('.side') ? sideNav : nav).push(view);
    };
    let nav; // narrow layout

    const go = (key) => (el) => open(key, el);

    const root$ = () => {
      const content = h('div');
      content.append(
        h('div.searchbar', h('span.sb-ic', { html: G.search }), h('span', 'Search'), h('span.sb-mic', { html: '' })),
        section([
          {
            title: cfg.owner,
            sub: 'Apple Account, iCloud+, and more',
            cls: 'profile',
            onClick: go('account'),
          },
        ]),
        section([
          { icon: tile(C.orange, S.plane), title: 'Airplane Mode', toggle: { value: os.cc.airplane, onChange: (v) => { os.cc.airplane = v; if (v) { os.cc.wifi = false; os.cc.cell = false; } else { os.cc.wifi = true; os.cc.cell = true; } os.syncCC(); } } },
          { icon: tile(C.blue, S.wifi), title: 'Wi‑Fi', detail: os.cc.wifi ? 'Home' : 'Off', onClick: go('wifi') },
          { icon: tile(C.blue, S.bt), title: 'Bluetooth', detail: os.cc.bt ? 'On' : 'Off', onClick: go('bluetooth') },
          { icon: tile(C.green, S.antenna), title: 'Cellular', onClick: go('cellular') },
          { icon: tile(C.green, S.link), title: 'Personal Hotspot', detail: 'Off', onClick: go('hotspot') },
          { icon: tile(C.green, S.battery), title: 'Battery', onClick: go('battery') },
        ]),
        section([
          { icon: tile(C.gray, S.gear), title: 'General', onClick: go('general') },
          { icon: tile(C.blue, S.access), title: 'Accessibility', onClick: go('Accessibility') },
          { icon: tile(C.gray, S.camera), title: 'Camera', onClick: go('Camera') },
          { icon: tile(C.gray, S.cc), title: 'Control Center', onClick: go('Control Center') },
          { icon: tile(C.blue, S.sun), title: 'Display & Brightness', onClick: go('display') },
          { icon: tile(C.indigo, S.fold), title: 'Displays & Folding', onClick: go('folding') },
          { icon: tile(C.indigo, S.grid), title: 'Home Screen & App Library', onClick: go('Home Screen & App Library') },
          { icon: tile(C.gray, S.search), title: 'Search', onClick: go('Search') },
          { icon: tile('linear-gradient(135deg,#ff2d92,#5e5ce6,#0a84ff)', S.siri), title: 'Siri', onClick: go('Siri') },
          { icon: tile(C.black, S.standby), title: 'StandBy', onClick: go('StandBy') },
          { icon: tile(C.cyan, S.flower), title: 'Wallpaper', onClick: go('wallpaper') },
        ]),
        section([
          { icon: tile(C.red, S.bell), title: 'Notifications', onClick: go('Notifications') },
          { icon: tile(C.pink, S.speaker), title: 'Sounds & Haptics', onClick: go('Sounds & Haptics') },
          { icon: tile(C.indigo, S.moon), title: 'Focus', onClick: go('Focus') },
          { icon: tile(C.indigo, S.hourglass), title: 'Screen Time', onClick: go('Screen Time') },
        ]),
        section([
          { icon: tile(C.red, S.touchid), title: 'Touch ID & Passcode', onClick: go('touchid') },
          { icon: tile(C.red, S.sos), title: 'Emergency SOS', onClick: go('Emergency SOS') },
          { icon: tile(C.blue, S.hand), title: 'Privacy & Security', onClick: go('Privacy & Security') },
        ]),
        section([
          { icon: tile(C.blue, S.appstore), title: 'App Store', onClick: go('App Store') },
          { icon: tile('linear-gradient(135deg,#ff5f6d,#a15cff,#3ec7ff)', S.game), title: 'Game Center', onClick: go('Game Center') },
          { icon: tile(C.blue, S.cloud), title: 'iCloud', onClick: go('iCloud') },
          { icon: tile(C.black, S.wallet), title: 'Wallet & Apple Pay', onClick: go('Wallet & Apple Pay') },
        ]),
        section([{ icon: tile(C.indigo, S.apps), title: 'Apps', onClick: go('Apps') }])
      );
      // avatar into the profile row
      const prof = content.querySelector('.profile');
      prof.prepend(h('div.avatar', initials(cfg.owner)));
      return { title: 'Settings', content };
    };

    const PAGES = {
      general: () => ({
        title: 'General',
        backLabel: 'Settings',
        content: h(
          'div',
          section([
            { icon: tile(C.gray, S.info), title: 'About', onClick: go('about') },
            { icon: tile(C.gray, S.gear), title: 'Software Update', onClick: go('update') },
          ]),
          section([
            { icon: tile(C.red, iconAppleCare()), title: 'AppleCare & Warranty', onClick: go('AppleCare & Warranty') },
          ]),
          section([
            { icon: tile(C.blue, S.link), title: 'AirDrop', onClick: go('AirDrop') },
            { icon: tile(C.blue, S.link), title: 'AirPlay & Continuity', onClick: go('AirPlay & Continuity') },
            { icon: tile(C.gray, S.apps), title: 'Picture in Picture', onClick: go('Picture in Picture') },
          ]),
          section([
            { icon: tile(C.gray, S.grid), title: 'iPhone Storage', onClick: go('storage') },
            { icon: tile(C.gray, S.gear), title: 'Background App Refresh', onClick: go('Background App Refresh') },
          ]),
          section([
            { icon: tile(C.blue, S.hourglass), title: 'Date & Time', onClick: go('Date & Time') },
            { icon: tile(C.gray, S.grid), title: 'Keyboard', onClick: go('Keyboard') },
            { icon: tile(C.gray, S.info), title: 'Fonts', onClick: go('Fonts') },
            { icon: tile(C.blue, S.cloud), title: 'Language & Region', onClick: go('Language & Region') },
            { icon: tile(C.gray, S.info), title: 'Dictionary', onClick: go('Dictionary') },
          ]),
          section([{ icon: tile(C.gray, S.gear), title: 'VPN & Device Management', onClick: go('VPN & Device Management') }]),
          section([{ icon: tile(C.gray, S.info), title: 'Legal & Regulatory', onClick: go('Legal & Regulatory') }]),
          section([
            { icon: tile(C.gray, S.gear), title: 'Transfer or Reset iPhone', onClick: go('Transfer or Reset iPhone') },
            { title: 'Shut Down', cls: 'blue', onClick: () => os.sleep() },
          ])
        ),
      }),

      about: () => ({
        title: 'About',
        backLabel: 'General',
        content: h(
          'div',
          h('div.about-hero', h('div.device', { html: DUO_SVG }), h('b', 'iPhone Duo'), h('span', 'iOS 27.1')),
          section([
            { title: 'Name', detail: cfg.deviceName, onClick: () => {} },
            { title: 'iOS Version', detail: '27.1', onClick: go('update') },
            { title: 'Model Name', detail: 'iPhone Duo' },
            { title: 'Model Number', detail: I.model, onClick: (el) => {
              const d = el.querySelector('.r-detail');
              d.textContent = d.textContent === I.model ? 'A3412' : I.model;
            } },
            { title: 'Serial Number', detail: I.serial },
          ]),
          section([{ title: 'Limited Warranty', detail: 'Expires ' + new Date(Date.now() + 360 * 86400000).toLocaleDateString(), onClick: go('AppleCare & Warranty') }]),
          section([
            { title: 'Songs', detail: I.songs.toLocaleString() },
            { title: 'Videos', detail: '214' },
            { title: 'Photos', detail: I.photos.toLocaleString() },
            { title: 'Applications', detail: String(I.apps) },
            { title: 'Capacity', detail: '512 GB' },
            { title: 'Available', detail: I.avail + ' GB' },
          ]),
          section([
            { title: 'Wi‑Fi Address', detail: I.wifi },
            { title: 'Bluetooth', detail: I.bt },
            { title: 'Modem Firmware', detail: '1.20.02' },
            { title: 'SEID', onClick: () => {} },
            { title: 'EID', sub: I.eid },
            { title: 'Carrier Lock', detail: 'No SIM restrictions' },
          ]),
          section([
            { title: 'Network', detail: cfg.carrier },
            { title: 'Carrier', detail: cfg.carrier + ' 63.0' },
            { title: 'IMEI', detail: I.imei },
          ], { header: 'Physical SIM' }),
          section([{ title: 'Certificate Trust Settings', onClick: go('Certificate Trust Settings') }])
        ),
      }),

      update: () => ({
        title: 'Software Update',
        backLabel: 'General',
        content: h(
          'div',
          section([
            { title: 'Automatic Updates', detail: 'On', onClick: () => {} },
            { title: 'Beta Updates', detail: 'Off', onClick: () => {} },
          ]),
          h('div.sw-upd', h('div.gear-big', { html: iconSVG('settings') }), h('b', 'iOS 27.1'), h('span', 'iOS is up to date'))
        ),
      }),

      storage: () => {
        const used = 512 - parseFloat(I.avail);
        const segs = [
          ['Apps', '#ff453a', 0.32],
          ['Photos', '#ffd60a', 0.38],
          ['Media', '#bf5af2', 0.08],
          ['iOS', '#8e8e93', 0.1],
          ['System Data', '#d1d1d6', 0.12],
        ];
        return {
          title: 'iPhone Storage',
          backLabel: 'General',
          content: h(
            'div',
            h(
              'div.sec',
              h(
                'div.sec-b.card-pad',
                h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '15px' } }, h('b', 'iPhone'), h('span', { style: { color: 'rgba(235,235,245,.6)' } }, `${used.toFixed(1)} GB of 512 GB Used`)),
                h('div.storage-bar', segs.map(([, c, f]) => h('i', { style: { width: (used / 512) * f * 100 + '%', background: c } }))),
                h('div.storage-legend', segs.map(([n, c]) => h('span', { style: { '--c': c } }, n)))
              )
            ),
            section(
              ['Photos', 'Messages', 'Music', 'WhatsApp', 'Instagram', 'Spotify', 'Safari', 'Maps'].map((n, i) => ({
                title: n,
                sub: i < 3 ? 'Last Used: Today' : 'Last Used: ' + (i + 1) + ' days ago',
                detail: [86.2, 12.4, 9.8, 7.1, 4.9, 3.2, 1.1, 0.7][i] + ' GB',
                onClick: () => {},
              }))
            )
          ),
        };
      },

      battery: () => {
        const lvl = Math.round(batteryLevel() * 100);
        const bars = Array.from({ length: 24 }, (_, i) => 30 + Math.abs(Math.sin(i * 0.7)) * 60);
        return {
          title: 'Battery',
          backLabel: 'Settings',
          content: h(
            'div',
            section([
              { title: 'Battery Percentage', toggle: { value: true } },
              { title: 'Low Power Mode', toggle: { value: false } },
            ]),
            section([
              { title: 'Battery Health', detail: 'Normal', onClick: () => {} },
              { title: 'Charging', onClick: () => {} },
            ]),
            h(
              'div.sec',
              h('div.sec-h', 'Last Charged to 100%'),
              h('div.sec-b.card-pad', h('div.big-batt', lvl + '%', h('small', 'Battery Level')), h('div.batt-chart', bars.map((b) => h('i', { style: { height: b + '%' } }))))
            )
          ),
        };
      },

      display: () => {
        const ap = (name, cls, on) => h('div.ap-opt' + (on ? '.on' : ''), h('div.ap-phone.' + cls), h('span', name), h('div.ap-tick'));
        const sl = slider(os.cc.bright, (v) => {
          os.cc.bright = v;
          os.setBrightness(v);
        });
        return {
          title: 'Display & Brightness',
          backLabel: 'Settings',
          content: h(
            'div',
            h('div.sec', h('div.sec-h', 'Appearance'), h('div.sec-b', h('div.appearance', ap('Light', 'light', false), ap('Dark', 'dark', true)), h('div', section([{ title: 'Automatic', toggle: { value: false } }]).querySelector('.sec-b').firstChild))),
            section([{ title: 'Text Size', onClick: () => {} }, { title: 'Bold Text', toggle: { value: false } }]),
            h('div.sec', h('div.sec-h', 'Brightness'), h('div.sec-b', h('div.slider-row', h('span', { html: G.sun, style: { opacity: 0.5, width: '18px', display: 'flex' } }), sl, h('span', { html: G.sun, style: { width: '26px', display: 'flex' } })), section([{ title: 'True Tone', toggle: { value: true } }]).querySelector('.r'))),
            section([
              { title: 'Night Shift', detail: 'Off', onClick: () => {} },
              { title: 'Auto‑Lock', detail: '30 seconds', onClick: () => {} },
              { title: 'Raise to Wake', toggle: { value: true } },
            ]),
            section([{ title: 'Always On Display', detail: cfg.aod ? 'On' : 'Off', onClick: () => {} }], { footer: 'Always On dims the Lock Screen on whichever display faces you when iPhone is locked.' }),
            section([{ title: 'Display Zoom', detail: 'Default', onClick: () => {} }])
          ),
        };
      },

      folding: () => ({
        title: 'Displays & Folding',
        backLabel: 'Settings',
        content: h(
          'div',
          section(
            [
              { title: 'Continue Apps on Outer Display', detail: 'Always', onClick: () => {} },
              { title: 'Outer Display on Fold', toggle: { value: true } },
              { title: 'Split View Pairs', detail: (os.pairs?.length || 0) + ' Saved', onClick: () => {} },
            ],
            { footer: 'Apps you are using on the inner display continue on the outer display when you close iPhone.' }
          ),
          section(
            [
              { title: 'Flex Mode', toggle: { value: true } },
              { title: 'Split Keyboard When Partially Folded', toggle: { value: true } },
            ],
            { header: 'Partially Folded', footer: 'Content moves away from the crease when iPhone is partially folded, with controls on the lower half.' }
          ),
          section([
            { title: 'Inner Display', detail: '7.6″ · 120 Hz' },
            { title: 'Outer Display', detail: '5.4″ · 120 Hz' },
          ], { header: 'Displays' })
        ),
      }),

      wallpaper: () => ({
        title: 'Wallpaper',
        backLabel: 'Settings',
        content: h(
          'div',
          h(
            'div.sec',
            h('div.sec-h', 'Current'),
            h(
              'div.sec-b',
              h('div.wp-pair', h('div', { style: { backgroundImage: os.wall.style.backgroundImage } }, h('b', String(new Date().getHours() % 12 || 12) + ':' + String(new Date().getMinutes()).padStart(2, '0'))), h('div', { style: { backgroundImage: os.wall.style.backgroundImage, filter: 'blur(1px)' } })),
              section([{ title: 'Customize', cls: 'blue center', onClick: () => {} }]).querySelector('.r')
            )
          ),
          section([{ title: '+ Add New Wallpaper', cls: 'blue center', onClick: () => {} }])
        ),
      }),

      touchid: () => ({
        title: 'Touch ID & Passcode',
        backLabel: 'Settings',
        content: h(
          'div',
          section([
            { title: 'iPhone Unlock', toggle: { value: true } },
            { title: 'iTunes & App Store', toggle: { value: true } },
            { title: 'Wallet & Apple Pay', toggle: { value: true } },
            { title: 'Password AutoFill', toggle: { value: true } },
          ], { header: 'Use Touch ID for:', footer: 'Touch ID is built into the side button and works whether iPhone Duo is open or closed.' }),
          section([
            { title: 'Right Thumb', onClick: () => {} },
            { title: 'Left Thumb', onClick: () => {} },
            { title: 'Add a Fingerprint…', cls: 'blue', onClick: () => {} },
          ], { header: 'Fingerprints' }),
          section([
            { title: 'Turn Passcode Off', cls: 'blue', onClick: () => {} },
            { title: 'Change Passcode', cls: 'blue', onClick: () => {} },
          ]),
          section([{ title: 'Unlock with Apple Watch', toggle: { value: true } }])
        ),
      }),

      wifi: () => ({
        title: 'Wi‑Fi',
        backLabel: 'Settings',
        content: h(
          'div',
          section([
            { title: 'Wi‑Fi', toggle: { value: os.cc.wifi, onChange: (v) => { os.cc.wifi = v; os.syncCC(); } } },
            { title: '✓  Home', sub: 'Secure Network', detail: '', onClick: () => {} },
          ]),
          section(['BT-Hub-7X2K', 'SKY4F2A1', 'TALKTALK-9C', 'Guest'].map((n) => ({ title: n, detail: '🔒', onClick: () => {} })), { header: 'Other Networks' }),
          section([
            { title: 'Ask to Join Networks', detail: 'Notify', onClick: () => {} },
            { title: 'Auto‑Join Hotspot', detail: 'Ask to Join', onClick: () => {} },
          ])
        ),
      }),

      bluetooth: () => ({
        title: 'Bluetooth',
        backLabel: 'Settings',
        content: h(
          'div',
          section([{ title: 'Bluetooth', toggle: { value: os.cc.bt, onChange: (v) => { os.cc.bt = v; os.syncCC(); } } }], { footer: `This iPhone is discoverable as “${cfg.deviceName}” while Bluetooth Settings is open.` }),
          section([
            { title: 'AirPods Pro', detail: 'Not Connected', onClick: () => os.island.airpods() },
            { title: 'Apple Watch', detail: 'Connected', onClick: () => {} },
            { title: 'Car Audio', detail: 'Not Connected', onClick: () => {} },
          ], { header: 'My Devices' })
        ),
      }),

      cellular: () => ({
        title: 'Cellular',
        backLabel: 'Settings',
        content: h(
          'div',
          section([
            { title: 'Cellular Data', toggle: { value: os.cc.cell, onChange: (v) => { os.cc.cell = v; os.syncCC(); } } },
            { title: 'Cellular Data Options', detail: 'Roaming Off', onClick: () => {} },
            { title: 'Personal Hotspot', detail: 'Off', onClick: () => {} },
          ]),
          section([
            { title: cfg.carrier, sub: 'Primary', detail: 'On', onClick: () => {} },
            { title: 'Add eSIM', cls: 'blue', onClick: () => {} },
          ], { header: 'SIMs' })
        ),
      }),

      account: () => ({
        title: 'Apple Account',
        backLabel: 'Settings',
        content: h(
          'div',
          h('div.about-hero', h('div.avatar', { style: { width: '90px', height: '90px', fontSize: '36px' } }, initials(cfg.owner)), h('b', cfg.owner)),
          section([
            { title: 'Personal Information', onClick: () => {} },
            { title: 'Sign‑In & Security', onClick: () => {} },
            { title: 'Payment & Shipping', onClick: () => {} },
            { title: 'Subscriptions', onClick: () => {} },
          ]),
          section([
            { icon: tile(C.blue, S.cloud), title: 'iCloud', detail: '200 GB', onClick: () => {} },
            { icon: tile(C.blue, S.grid), title: 'Family', onClick: () => {} },
            { icon: tile(C.green, G.search), title: 'Find My', onClick: () => {} },
          ]),
          section([
            { title: cfg.deviceName, sub: 'This iPhone Duo', onClick: () => {} },
          ])
        ),
      }),
    };

    function simplePage(title) {
      const rows = [
        { title: 'Allow ' + title, toggle: { value: true } },
        { title: 'Show in Search', toggle: { value: true } },
        { title: 'Options', detail: 'Default', onClick: () => {} },
      ];
      return { title, backLabel: 'Settings', content: h('div', section(rows), section([{ title: 'Reset ' + title, cls: 'blue', onClick: () => {} }])) };
    }

    function slider(v, onChange) {
      const fill = h('div.fill');
      const knob = h('div.knob');
      const el = h('div.slider', fill, knob);
      const set = (x) => {
        v = Math.max(0, Math.min(1, x));
        fill.style.width = v * 100 + '%';
        knob.style.left = v * 100 + '%';
        onChange(v);
      };
      set(v);
      el.addEventListener('pointerdown', (e) => {
        el.setPointerCapture(e.pointerId);
        const r = el.getBoundingClientRect();
        const mv = (ev) => set((ev.clientX - r.left) / r.width);
        mv(e);
        el.onpointermove = mv;
        el.onpointerup = () => (el.onpointermove = null);
      });
      return el;
    }

    const layout = () => {
      const w = root.clientWidth;
      const nowWide = w >= 700;
      if (nowWide === wide && (sideNav || nav)) return;
      wide = nowWide;
      root.replaceChildren();
      if (wide) {
        const side = h('div.side');
        const main = h('div.main');
        root.append(h('div.split2', side, main));
        sideNav = navStack(side);
        mainNav = navStack(main);
        sideNav.reset(root$());
        const first = side.querySelector('.r.tap:not(.profile)') && [...side.querySelectorAll('.r.tap')].find((r) => r.textContent.includes('General'));
        open('general', first);
      } else {
        nav = navStack(root);
        nav.reset(root$());
      }
    };
    requestAnimationFrame(layout);
    return {
      resize: () => requestAnimationFrame(layout),
      show: () => requestAnimationFrame(layout),
    };
  },
};

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');
}

function iconAppleCare() {
  return `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z"/></svg>`;
}

// Little line drawing of the Duo, half open.
const DUO_SVG = `<svg viewBox="0 0 132 96"><defs><linearGradient id="dg" x1="0" x2="1"><stop offset="0" stop-color="#2a2b30"/><stop offset=".5" stop-color="#6d6f76"/><stop offset="1" stop-color="#2a2b30"/></linearGradient></defs>
<path d="M66 8 L14 2 Q8 1 8 8 V82 Q8 89 14 89 L66 94Z" fill="url(#dg)"/><path d="M66 8 L118 2 Q124 1 124 8 V82 Q124 89 118 89 L66 94Z" fill="url(#dg)"/>
<path d="M66 11 L16 5.5 Q11 5 11 10 V80 Q11 85 16 85.5 L66 91Z" fill="#0d1230"/><path d="M66 11 L116 5.5 Q121 5 121 10 V80 Q121 85 116 85.5 L66 91Z" fill="#141a3d"/>
<path d="M30 30 Q50 18 66 40 T110 30" stroke="#5e7bff" stroke-width="10" fill="none" opacity=".55"/><line x1="66" y1="9" x2="66" y2="93" stroke="#000" stroke-width="1.2" opacity=".6"/></svg>`;
