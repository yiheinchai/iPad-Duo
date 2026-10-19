// App catalogue, Home Screen layout, Dock and Today View contents.
import settings from './settings.js';
import camera from './camera.js';
import photos from './photos.js';
import calculator from './calculator.js';
import clock from './clock.js';
import weather from './weather.js';
import notes from './notes.js';
import messages from './messages.js';
import safari from './safari.js';
import music from './music.js';
import phone from './phone.js';
import calendar from './calendar.js';
import facetime from './facetime.js';
import { generic } from './generic.js';

export const APPS = {
  phone: { name: 'Phone', module: phone },
  messages: { name: 'Messages', module: messages },
  safari: { name: 'Safari', module: safari },
  music: { name: 'Music', module: music },
  facetime: { name: 'FaceTime', module: facetime },
  photos: { name: 'Photos', module: photos },
  camera: { name: 'Camera', module: camera },
  mail: { name: 'Mail', module: generic('mail') },
  notes: { name: 'Notes', module: notes },
  reminders: { name: 'Reminders', module: generic('reminders') },
  clock: { name: 'Clock', module: clock },
  maps: { name: 'Maps', module: generic('maps') },
  tv: { name: 'TV', module: generic('tv') },
  podcasts: { name: 'Podcasts', module: generic('podcasts') },
  appstore: { name: 'App Store', module: generic('appstore') },
  health: { name: 'Health', module: generic('health') },
  wallet: { name: 'Wallet', module: generic('wallet') },
  settings: { name: 'Settings', module: settings },
  findmy: { name: 'Find My', module: generic('findmy') },
  home: { name: 'Home', module: generic('home') },
  books: { name: 'Books', module: generic('books') },
  fitness: { name: 'Fitness', module: generic('fitness') },
  files: { name: 'Files', module: generic('files') },
  calculator: { name: 'Calculator', module: calculator },
  weather: { name: 'Weather', module: weather },
  calendar: { name: 'Calendar', module: calendar },
  stocks: { name: 'Stocks', module: generic('stocks') },
  voicememos: { name: 'Voice Memos', module: generic('voicememos') },
  translate: { name: 'Translate', module: generic('translate') },
  shortcuts: { name: 'Shortcuts', module: generic('shortcuts') },
  freeform: { name: 'Freeform', module: generic('freeform') },
  journal: { name: 'Journal', module: generic('journal') },
  passwords: { name: 'Passwords', module: generic('passwords') },
  contacts: { name: 'Contacts', module: generic('contacts') },
  tips: { name: 'Tips', module: generic('tips') },
  magnifier: { name: 'Magnifier', module: generic('magnifier') },
  compass: { name: 'Compass', module: generic('compass') },
  games: { name: 'Games', module: generic('games') },
  news: { name: 'News', module: generic('news') },
  siri: { name: 'Siri', module: generic('siri') },
};

// Strings are app ids, objects are widgets ({w: kind, s: 'S'|'M'}).
// Page 1 and the Dock match Apple's iPhone Duo Home Screen.
export const HOME_PAGES = [
  [
    { w: 'weather', s: 'S' },
    { w: 'calendar', s: 'S' },
    'facetime', 'calendar', 'photos', 'camera',
    'mail', 'notes', 'clock', 'maps',
    'tv', 'news', 'health', 'wallet',
    'siri', 'settings',
  ],
  [
    'reminders', 'podcasts', 'appstore', 'findmy',
    'home', 'books', 'fitness', 'files',
    'calculator', 'weather', 'stocks', 'voicememos',
    'translate', 'shortcuts', 'freeform', 'journal',
    'passwords', 'contacts', 'tips', 'magnifier',
    'compass', 'games',
  ],
];

export const DOCK = ['phone', 'safari', 'messages', 'music'];

export const TODAY = [
  { w: 'weather', s: 'M' },
  { w: 'batteries', s: 'S' },
  { w: 'fitness', s: 'S' },
  { w: 'worldclock', s: 'M' },
  { w: 'screentime', s: 'S' },
  { w: 'reminders', s: 'S' },
  { w: 'calendar', s: 'M' },
];
