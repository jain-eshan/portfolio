/* ============================================================
   blog.js — entry point for /blog.html
   ============================================================ */

import './styles/index.css';
import { initTheme, initReveal } from './lib/shared.js';
import { initWritings } from './lib/writings.js';

initTheme();
initWritings();
// Writings render async — re-observe after they're in the DOM
setTimeout(initReveal, 0);
setTimeout(initReveal, 300);
