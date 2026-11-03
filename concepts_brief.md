# Minimalist Landing Page & Information Architecture Simplification

* **Author:** shayl
* **Date:** 2026-11-03

## Overview

A radical simplification of the BuildSafe SA landing page (`https://buildsafe-za.vercel.app/`). The objective is to eliminate visual clutter, remove repetitive brand lockups and duplicate authentication buttons, and test whether a hyper-focused gateway portal outperforms a lengthy marketing showcase.

The initial implementation removes:
1. The verbose hero paragraph and duplicate brand emblem from pasted Image 1 (`// 00 · VETTED SOUTH AFRICAN ARTISANS & ESCROW` + `BUILDSAFE SA [ZA]` + subheader).
2. The duplicate set of `[Log In]` and `[Sign Up]` buttons in the top-right navbar when viewing the landing page and auth pages.

---

## Analysis

Synthesized across the core EGM critique lenses:

### 1. Contrarian / YAGNI Lens
* **Redundancy Elimination**: Having `BUILDSAFE SA [ZA]` in 60px type immediately below the identical brand mark in the navbar was visual stutter. Eliminating it saves 80+ lines of JSX and reduces cognitive friction.
* **Duplicate Button Bloat**: Displaying `Log In` and `Sign Up` in the navbar when the central viewport is dominated by an action card containing `[ SIGN UP ]` and `[ LOG IN ]` was confusing and redundant.
* **Stress-Testing "Remove Almost Everything"**: Stripping the hero copy is clean, but removing all secondary sections (the 3 trust pillars, the 6 qualified trade cards, and the escrow fee calculator) converts the homepage from a public marketplace into an uninformative login splash screen. For existing users, this is clean; for cold traffic, it removes the proof points that differentiate BuildSafe from unregulated classified boards.

### 2. UX & Usability Lens
* **Framing with Artisan Canvas**: With the text bloat removed, the centered Brutalist Action Card (`// GET STARTED · SELECT AN ACTION`) is framed naturally by the animated ambient artisan canvas (carpentry, screeding/tiling, masonry).
* **Information Architecture Cleanliness**: The top-right navbar now stays clean on `/`, letting the visitor's eyes focus directly on the action card. Interior pages (`/jobs`, `/about`) preserve the top-right CTA so visitors can authenticate from anywhere.

### 3. SEO & Cold Discovery Economics
* **Search Engine Footprint**: Removing the long paragraph eliminates fluff, but search crawlers need semantic keywords (`SAPS biometric vetting`, `escrow milestone vault`, `certified South African plumbers & electricians`). If the lower sections are also removed, those keywords must live robustly on `/jobs` and `/about`.

---

## Goals vs. Non-Goals

### In-Scope Goals
* **G1: Eliminate Duplicate Auth Buttons**: Hide unauthenticated navbar `Log In` / `Sign Up` buttons on `/`, `/login`, and `/signup`.
* **G2: Remove Hero Redundancy**: Delete the redundant hero lockup, emblem, and 3-line description block.
* **G3: Clarify Lower Section Scope**: Determine whether the Trust Badges Strip, Trade Category Cards, and Escrow Calculator should remain below the fold or be relocated entirely to dedicated routes (`/jobs`, `/about`, `/guarantees`).

### Out-of-Scope Non-Goals
* Redesigning the interior dashboard authentication state (authenticated navbar remains untouched with role switcher and user dropdown).
* Disabling the ambient SVG artisan animation canvas.

---

## Alternatives Weighed

* **Alternative 1: Keep Top-Right Buttons and Remove Center Action Card**
  * *Rejected by author*: The center action card is the focal point of the Brutalist aesthetic and provides the primary onboarding fork between signing up, logging in, and browsing public trades without credentials.
* **Alternative 2: Shorten Copy to a 1-Line Tagline Instead of Full Removal**
  * *Rejected by author*: The user explicitly requested removing the entire piece shown in Image 1, relying on the clean navbar identity and central action card.

---

## Key Decisions & Staging for Next Steps

1. **Immediate Execution**:
   - Removed the Image 1 block from `src/app/page.tsx`.
   - Conditioned top-right unauthenticated buttons on `!isAuthOrLandingPage` in `src/components/Navbar.tsx`.
2. **Brainstorming Decision Gate**:
   - Clarify with the user whether "remove almost everything" extends to purging the trust badges, trade cards, and fee calculator below the fold, leaving only the centered action card and artisan animation.
