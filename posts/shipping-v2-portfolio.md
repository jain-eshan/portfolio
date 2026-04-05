---
title: Shipping v2 of this site
slug: shipping-v2-portfolio
date: 2026-03-15
excerpt: Why I rebuilt my portfolio as a draggable, collaborative canvas — and what I learned about playful interfaces in the process.
tags: [design, portfolio, craft]
published: true
---

The first version of this site was fine. Tasteful. Safe. It looked like every other PM portfolio in 2025.

That was the problem.

## The brief I gave myself

A portfolio is supposed to be proof. Not a résumé in slightly nicer typography — actual evidence of how someone thinks. So I rewrote the brief: **every pixel on the homepage should demonstrate something about how I build.**

That led to the collaboration toggle. Flip it on and the page stops behaving like a document. The hero letters become draggable. The cards tilt. A second cursor appears — yours — and you can push things around the canvas. It's a live Figma file disguised as a portfolio.

## Why draggable

Because I believe the best products feel like they *want* to be touched. Static sites are a compromise we made when browsers were slow. They aren't anymore.

## What broke

The first version used individual letter drag — each "E", "S", "H", "A", "N" was its own draggable. It looked cute in my head and felt chaotic in practice. Word-level drag is the right abstraction.

The sticker on the hero also collapsed into document flow the first time I shipped the hover borders. One-line CSS fix, but it took me embarrassingly long to find.

## What I'd do differently

Ship smaller. I held v2 for two weeks trying to get every interaction perfect. Should have pushed the canvas-drag-only version on day three and iterated in public.

## What's next

v2.2 is live right now — you're reading it. I added writings (this page), backed by Obsidian files in the repo. Every post you see here started as a note I wrote in bed.
