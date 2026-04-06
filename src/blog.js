/* ============================================================
   blog.js — entry point for /blog.html
   ============================================================ */

import './styles/index.css';
import { initTheme, initReveal, initClock } from './lib/shared.js';
import { initWritings } from './lib/writings.js';

initTheme();
initClock();
initWritings();
// Writings render async — re-observe after they're in the DOM
setTimeout(initReveal, 0);
setTimeout(initReveal, 300);
