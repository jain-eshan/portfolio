/* ============================================================
   work.js — entry point for /work.html
   ============================================================ */

import './styles/index.css';
import { initTheme, initReveal, initSmoothScroll, initClock } from './lib/shared.js';
import { initCases } from './lib/cases.js';

initTheme();
initClock();
initCases();
initReveal();
initSmoothScroll();
