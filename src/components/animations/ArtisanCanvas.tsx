"use client";

import React, { useEffect, useState } from "react";

/**
 * ArtisanCanvas - High-Fidelity Ambient Vector Craftsperson Vignettes
 *
 * Depicts authentic South African skilled artisans collaborating across core verified trades:
 * 1. CARPENTRY (Top-Left): Female master carpenter sawing Saligna timber on an industrial bolted trestle.
 * 2. ELECTRICAL (Top-Right): Certified ECB Wireman conducting live distribution board diagnostics with a multimeter.
 * 3. MASONRY (Mid-Right): NHBRC-aligned mason laying SABS clay face-brick with a spirit level and trowel.
 * 4. TILING & FLOORING (Lower-Left): Precision tiler scoring rectified porcelain tile on dual-rail manual cutter.
 *
 * Key Architecture & Scroll Enhancements:
 * - Positioned via `absolute inset-0` within the page document flow rather than `fixed inset-0`.
 *   This ensures vignettes naturally move with page scrolling and CANNOT overlap the footer.
 * - Dynamic scroll parallax: Subtle, smooth parallax offsets applied via requestAnimationFrame.
 * - Full prefers-reduced-motion compliance.
 * - High-detail SVGs with anatomical proportions, safety gear (goggles, hard hats, harnesses,
 *   AFISwitch badges, toolbelts), realistic mechanical tools, and multi-joint kinetic animations.
 */
export function ArtisanCanvas() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Respect user's motion preferences
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax translation factors
  const pCarpentry = Math.min(scrollY * 0.12, 120);
  const pElectrical = Math.min(scrollY * 0.14, 140);
  const pMasonry = Math.max(Math.min((scrollY - 200) * 0.10, 100), -40);
  const pTiling = Math.max(Math.min((scrollY - 400) * 0.08, 90), -50);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none hidden md:block"
    >
      {/* ============================================================ */}
      {/* 1. CARPENTRY VIGNETTE (Top-Left): Master Artisan Sawing Saligna */}
      {/* ============================================================ */}
      <div
        className="absolute top-16 lg:top-20 left-2 lg:left-6 xl:left-12 2xl:left-20 w-72 lg:w-80 xl:w-96 transition-transform duration-75 ease-out"
        style={{ transform: `translateY(${pCarpentry}px)` }}
      >
        <div className="bg-white/85 backdrop-blur-xs border-2 border-iron-950 p-3 shadow-brutal transition-all">
          <svg
            viewBox="0 0 320 220"
            className="w-full h-auto drop-shadow-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="50%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
              <linearGradient id="timberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="steelTrestle" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
            </defs>

            {/* Industrial Sawhorse Trestle with Hex Bolts */}
            <g stroke="#141416" strokeWidth="2.5" strokeLinecap="round">
              {/* Back Legs */}
              <line x1="60" y1="205" x2="85" y2="135" stroke="#475569" strokeWidth="3" />
              <line x1="120" y1="205" x2="95" y2="135" stroke="#475569" strokeWidth="3" />

              {/* Front Legs (Heavy Steel/Timber A-Frame) */}
              <line x1="45" y1="205" x2="75" y2="130" stroke="#141416" strokeWidth="4" />
              <line x1="105" y1="205" x2="75" y2="130" stroke="#141416" strokeWidth="4" />
              {/* Cross-brace spreader & lower shelf */}
              <line x1="56" y1="172" x2="94" y2="172" stroke="#141416" strokeWidth="3" />
              <rect x="52" y="168" width="46" height="5" fill="#D97706" stroke="#141416" strokeWidth="1.5" />

              {/* Trestle Top Beam */}
              <rect x="35" y="125" width="125" height="14" rx="1" fill="#D97706" stroke="#141416" strokeWidth="2.5" />
              {/* Galvanized hardware bolt heads */}
              <circle cx="45" cy="132" r="2.5" fill="#94A3B8" stroke="#141416" strokeWidth="1" />
              <circle cx="75" cy="132" r="2.5" fill="#94A3B8" stroke="#141416" strokeWidth="1" />
              <circle cx="150" cy="132" r="2.5" fill="#94A3B8" stroke="#141416" strokeWidth="1" />
            </g>

            {/* Saligna Timber Beam Clamped Down */}
            <g>
              <rect x="25" y="112" width="145" height="16" fill="url(#timberGrad)" stroke="#141416" strokeWidth="2.5" />
              {/* Wood Grain Lines */}
              <line x1="30" y1="116" x2="160" y2="116" stroke="#B45309" strokeWidth="1" opacity="0.6" />
              <line x1="28" y1="121" x2="165" y2="121" stroke="#B45309" strokeWidth="1" opacity="0.6" />
              {/* Pencil cut line mark (1200mm indicator) */}
              <line x1="115" y1="112" x2="115" y2="128" stroke="#B93815" strokeWidth="2" strokeDasharray="3 1.5" />
              {/* Heavy Cast Iron C-Clamp */}
              <path d="M42 104 L52 104 L52 138 L42 138" stroke="#141416" strokeWidth="3.5" fill="none" />
              <line x1="47" y1="99" x2="47" y2="104" stroke="#475569" strokeWidth="2" />
              <rect x="43" y="96" width="8" height="4" fill="#141416" />
            </g>

            {/* Female Artisan (Yellow Skin #FBBF24, High-Vis, Safety Glasses, Toolbelt) */}
            {/* Work Boots (Steel-Toe, Yellow Laces, Rugged Treads) */}
            <g stroke="#141416" strokeWidth="2.5">
              {/* Left Boot */}
              <path d="M165 204 L180 204 L182 196 L168 196 Z" fill="#0F172A" />
              <rect x="163" y="202" width="20" height="4" fill="#1E293B" />
              {/* Right Boot */}
              <path d="M200 204 L216 204 L218 196 L204 196 Z" fill="#0F172A" />
              <rect x="198" y="202" width="20" height="4" fill="#1E293B" />
            </g>

            {/* Heavy Canvas Work Pants & Reinforced Double-Knees */}
            <g stroke="#141416" strokeWidth="2.5">
              <path d="M168 196 L174 150 L194 150 L204 196" fill="#334155" />
              {/* Knee reinforcement patches */}
              <rect x="171" y="166" width="10" height="14" rx="2" fill="#1E293B" stroke="#141416" strokeWidth="1.5" />
              <rect x="196" y="166" width="10" height="14" rx="2" fill="#1E293B" stroke="#141416" strokeWidth="1.5" />
            </g>

            {/* Heavy Leather Carpenter's Tool Belt & Holsters */}
            <g stroke="#141416" strokeWidth="2">
              <rect x="168" y="146" width="46" height="7" fill="#78350F" />
              {/* Brass buckle */}
              <rect x="187" y="145" width="8" height="9" fill="#FACC15" />
              {/* Tape measure pouch with yellow Stanley tape */}
              <rect x="170" y="151" width="11" height="12" rx="1" fill="#92400E" />
              <circle cx="175" cy="157" r="3.5" fill="#FACC15" />
              {/* Claw hammer in steel loop */}
              <path d="M210 151 L210 162" stroke="#64748B" strokeWidth="2.5" />
              <polygon points="208,154 216,154 214,178 210,178" fill="#D97706" />
              <path d="M205,152 L217,152 L215,148 L207,148 Z" fill="#94A3B8" />
            </g>

            {/* Torso: Two-Tone High-Vis Work Jacket with Reflective Silver Tape */}
            <g stroke="#141416" strokeWidth="2.5">
              {/* Denim Body */}
              <path d="M170 148 L174 108 L208 108 L212 148 Z" fill="#1E40AF" />
              {/* High-Vis Orange Chest Panels */}
              <path d="M174 108 L185 108 L185 130 L172 130 Z" fill="#F97316" strokeWidth="1.5" />
              <path d="M197 108 L208 108 L210 130 L197 130 Z" fill="#F97316" strokeWidth="1.5" />
              {/* 3M Silver Reflective Horizontal Stripe */}
              <rect x="172" y="130" width="38" height="5" fill="#E2E8F0" stroke="#141416" strokeWidth="1" />
              {/* AFISwitch SAPS Biometric Badge */}
              <rect x="176" y="115" width="8" height="10" rx="1" fill="#FFFFFF" stroke="#141416" strokeWidth="1" />
              <circle cx="180" cy="119" r="2" fill="#047857" />
              <line x1="178" y1="123" x2="182" y2="123" stroke="#141416" strokeWidth="1" />
            </g>

            {/* Head, Safety Helmet & Eyewear */}
            <g stroke="#141416" strokeWidth="2">
              {/* Neck & Yellow Skin Tone */}
              <rect x="186" y="96" width="10" height="14" fill="#FBBF24" />
              {/* Head Profile */}
              <path
                d="M182 96 C182 82 204 82 204 96 C204 104 196 108 188 108 C182 108 182 102 182 96 Z"
                fill="#FBBF24"
              />
              {/* Nose, Eye & Ear Details */}
              <path d="M182 92 L178 94 L182 97" stroke="#141416" strokeWidth="1.5" fill="none" />
              <circle cx="187" cy="92" r="1.5" fill="#141416" />
              {/* Protective Safety Glasses (Tinted Polycarbonate) */}
              <rect x="180" y="89" width="15" height="6" rx="2" fill="#38BDF8" fillOpacity="0.75" stroke="#141416" strokeWidth="1.5" />
              <line x1="195" y1="92" x2="201" y2="92" stroke="#141416" strokeWidth="1.5" />

              {/* Braided Hair Bun */}
              <circle cx="206" cy="92" r="7" fill="#29150B" stroke="#141416" strokeWidth="1.5" />
              <path d="M202 88 Q210 92 202 96" stroke="#451A03" strokeWidth="1" fill="none" />

              {/* Safety Hard Hat with Sun Brim & Lamp Ridge */}
              <path d="M178 87 C178 72 206 72 206 87 Z" fill="#FBBF24" stroke="#141416" strokeWidth="2" />
              <path d="M174 86 L208 86 L206 89 L176 89 Z" fill="#F59E0B" stroke="#141416" strokeWidth="1.5" />
              {/* Pencil tucked in helmet */}
              <line x1="190" y1="84" x2="208" y2="76" stroke="#DC2626" strokeWidth="2.5" />
              <polygon points="188,85 190,84 190,86" fill="#FBBF24" />
            </g>

            {/* Left Stabilizing Arm holding timber firm */}
            <g stroke="#141416" strokeWidth="2">
              <path d="M176 112 L152 114 L126 112" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" />
              <path d="M176 112 L152 114 L126 112" stroke="#141416" strokeWidth="1.5" fill="none" />
              {/* Work Glove */}
              <rect x="120" y="108" width="12" height="9" rx="2" fill="#78350F" stroke="#141416" strokeWidth="1.5" />
            </g>

            {/* Right Arm & Professional Hand Saw (Kinetic Group) */}
            <g className="animate-saw-stroke">
              {/* Articulated Arm */}
              <path d="M198 114 L170 128 L142 116" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" />
              <path d="M198 114 L170 128 L142 116" stroke="#141416" strokeWidth="1.5" fill="none" />
              {/* Leather Work Glove */}
              <circle cx="140" cy="116" r="6" fill="#78350F" stroke="#141416" strokeWidth="1.5" />

              {/* Carpenter's Hand Saw */}
              {/* Ergonomic Hardwood Handle with Brass Screws */}
              <path
                d="M142 110 C146 106 148 122 142 126 L132 124 L132 112 Z"
                fill="#92400E"
                stroke="#141416"
                strokeWidth="2"
              />
              <circle cx="137" cy="115" r="1.5" fill="#FACC15" />
              <circle cx="137" cy="121" r="1.5" fill="#FACC15" />

              {/* Polished Swedish Steel Blade with Metric Etchings */}
              <polygon
                points="132,113 72,106 70,128 132,123"
                fill="url(#bladeGrad)"
                stroke="#141416"
                strokeWidth="2"
              />
              {/* Metric laser etch lines on blade */}
              <line x1="85" y1="113" x2="85" y2="121" stroke="#64748B" strokeWidth="1" />
              <line x1="100" y1="114" x2="100" y2="122" stroke="#64748B" strokeWidth="1" />
              <line x1="115" y1="115" x2="115" y2="123" stroke="#64748B" strokeWidth="1" />
              {/* Finely Delineated Saw Teeth */}
              <path
                d="M72 128 L76 125 L80 128 L84 125 L88 128 L92 125 L96 128 L100 125 L104 128 L108 125 L112 128 L116 125 L120 128 L124 125 L128 128 L132 125"
                stroke="#141416"
                strokeWidth="1.5"
                fill="none"
              />
            </g>

            {/* Dynamic Sawdust Particle Ejection */}
            <g>
              <circle cx="114" cy="124" r="2.5" fill="#D97706" className="animate-sawdust-spray-a" />
              <circle cx="116" cy="126" r="1.8" fill="#F59E0B" className="animate-sawdust-spray-b" />
              <circle cx="112" cy="128" r="2.2" fill="#B45309" className="animate-sawdust-spray-c" />
              <circle cx="115" cy="131" r="1.5" fill="#FDE68A" className="animate-sawdust-spray-a" />
            </g>
          </svg>

          {/* Brutalist Telemetry Footer Badge */}
          <div className="mt-2 pt-2 border-t border-iron-200 flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-iron-900 font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-none inline-block animate-pulse"></span>
              <span>// 01 · CARPENTRY [SANS 10082]</span>
            </div>
            <span className="text-brick-600 font-black">100% TIMBER VETTED</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. ELECTRICAL VIGNETTE (Top-Right): Certified ECB Wireman    */}
      {/* ============================================================ */}
      <div
        className="absolute top-24 lg:top-28 right-2 lg:right-6 xl:right-12 2xl:right-20 w-72 lg:w-80 xl:w-96 transition-transform duration-75 ease-out"
        style={{ transform: `translateY(${pElectrical}px)` }}
      >
        <div className="bg-white/85 backdrop-blur-xs border-2 border-iron-950 p-3 shadow-brutal transition-all">
          <svg
            viewBox="0 0 320 220"
            className="w-full h-auto drop-shadow-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="dbPanelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
              <linearGradient id="meterLcd" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A7F3D0" />
                <stop offset="100%" stopColor="#6EE7B7" />
              </linearGradient>
            </defs>

            {/* Wall Mounted Distribution Board (DB Board Enclosure) */}
            <g stroke="#141416" strokeWidth="2.5">
              {/* Outer Enclosure Frame */}
              <rect x="25" y="45" width="135" height="155" fill="url(#dbPanelGrad)" rx="2" />
              {/* Inner DIN Rail Section */}
              <rect x="35" y="55" width="115" height="135" fill="#0F172A" />

              {/* Top Galvanized DIN Rail */}
              <rect x="40" y="70" width="105" height="6" fill="#94A3B8" stroke="#141416" strokeWidth="1" />

              {/* Miniature Circuit Breakers (MCBs) */}
              {/* Main 60A Isolator (Red Toggle) */}
              <rect x="44" y="60" width="16" height="26" fill="#E2E8F0" stroke="#141416" strokeWidth="1.5" />
              <rect x="48" y="64" width="8" height="10" fill="#DC2626" />
              <text x="47" y="84" fill="#0F172A" fontSize="5" fontFamily="monospace" fontWeight="bold">60A</text>

              {/* Earth Leakage Unit (with Yellow 'T' Test Button) */}
              <rect x="64" y="60" width="24" height="26" fill="#E2E8F0" stroke="#141416" strokeWidth="1.5" />
              <rect x="68" y="64" width="8" height="10" fill="#2563EB" />
              <circle cx="82" cy="69" r="3" fill="#EAB308" stroke="#141416" strokeWidth="1" />
              <text x="80.5" y="71" fill="#141416" fontSize="5" fontFamily="monospace" fontWeight="bold">T</text>

              {/* Branch Breakers (Geyser, Plugs, Lights) */}
              <rect x="92" y="60" width="12" height="26" fill="#E2E8F0" stroke="#141416" strokeWidth="1.5" />
              <rect x="94.5" y="64" width="7" height="10" fill="#141416" />
              <text x="94" y="84" fill="#0F172A" fontSize="5" fontFamily="monospace">30A</text>

              <rect x="108" y="60" width="12" height="26" fill="#E2E8F0" stroke="#141416" strokeWidth="1.5" />
              <rect x="110.5" y="64" width="7" height="10" fill="#141416" />
              <text x="110" y="84" fill="#0F172A" fontSize="5" fontFamily="monospace">20A</text>

              <rect x="124" y="60" width="12" height="26" fill="#E2E8F0" stroke="#141416" strokeWidth="1.5" />
              <rect x="126.5" y="64" width="7" height="10" fill="#141416" />
              <text x="126" y="84" fill="#0F172A" fontSize="5" fontFamily="monospace">10A</text>

              {/* Neutral & Earth Copper Busbars with Screws */}
              <rect x="42" y="100" width="100" height="8" fill="#B45309" stroke="#141416" strokeWidth="1.5" />
              <circle cx="48" cy="104" r="1.5" fill="#FDE68A" />
              <circle cx="58" cy="104" r="1.5" fill="#FDE68A" />
              <circle cx="68" cy="104" r="1.5" fill="#FDE68A" />
              <circle cx="78" cy="104" r="1.5" fill="#FDE68A" />
              <circle cx="88" cy="104" r="1.5" fill="#FDE68A" />
              <circle cx="98" cy="104" r="1.5" fill="#FDE68A" />
              <circle cx="108" cy="104" r="1.5" fill="#FDE68A" />
              <circle cx="118" cy="104" r="1.5" fill="#FDE68A" />
              <circle cx="128" cy="104" r="1.5" fill="#FDE68A" />
              <circle cx="138" cy="104" r="1.5" fill="#FDE68A" />

              {/* South African Color Coded Wiring Harness (Red Live, Black Neutral, Green/Yellow Earth) */}
              <path d="M52 86 L52 100" stroke="#DC2626" strokeWidth="2.5" />
              <path d="M72 86 L72 100" stroke="#1E293B" strokeWidth="2.5" />
              <path d="M100 86 Q100 120 70 120 L45 120" stroke="#10B981" strokeWidth="2.5" />
              <path d="M115 86 Q115 130 90 130 L45 130" stroke="#DC2626" strokeWidth="2" />
            </g>

            {/* Live Testing Status Indicator LED */}
            <circle cx="148" cy="55" r="4" fill="#10B981" className="animate-indicator-blink" />
            <circle cx="148" cy="55" r="2" fill="#FFFFFF" />

            {/* Certified Electrician Character (Yellow Skin Tone, Blue Helmet, 1000V Gloves) */}
            {/* Legs & Industrial Safety Boots */}
            <g stroke="#141416" strokeWidth="2.5">
              <path d="M210 205 L218 155 L242 155 L252 205" fill="#1E293B" />
              {/* Rubber Insulated Work Boots */}
              <rect x="206" y="202" width="22" height="6" fill="#0F172A" />
              <rect x="246" y="202" width="22" height="6" fill="#0F172A" />
            </g>

            {/* Heavy Tool Holster (Insulated Screwdrivers & Pliers) */}
            <g stroke="#141416" strokeWidth="2">
              <rect x="214" y="150" width="36" height="8" fill="#78350F" />
              <rect x="238" y="156" width="12" height="16" fill="#92400E" />
              {/* VDE 1000V Red/Yellow screwdriver handles */}
              <line x1="242" y1="148" x2="242" y2="158" stroke="#DC2626" strokeWidth="3" />
              <line x1="246" y1="146" x2="246" y2="158" stroke="#EAB308" strokeWidth="3" />
            </g>

            {/* Torso: Navy Technical Work Shirt with Wireman Accreditation */}
            <g stroke="#141416" strokeWidth="2.5">
              <path d="M216 150 L220 110 L250 110 L252 150 Z" fill="#0F172A" />
              {/* High-Vis Epaulet Straps */}
              <rect x="220" y="110" width="8" height="14" fill="#FACC15" strokeWidth="1.5" />
              <rect x="242" y="110" width="8" height="14" fill="#FACC15" strokeWidth="1.5" />
              {/* ECB Wireman Certification Chest Badge */}
              <rect x="223" y="120" width="10" height="8" rx="1" fill="#FFFFFF" stroke="#141416" strokeWidth="1" />
              <text x="224" y="126" fill="#DC2626" fontSize="4" fontFamily="monospace" fontWeight="bold">ECB</text>
            </g>

            {/* Head, Blue Hard Hat & Safety Glasses */}
            <g stroke="#141416" strokeWidth="2">
              <rect x="230" y="98" width="9" height="14" fill="#FBBF24" />
              <path
                d="M226 98 C226 84 246 84 246 98 C246 106 238 110 230 110 C226 110 226 104 226 98 Z"
                fill="#FBBF24"
              />
              {/* Facial features */}
              <path d="M226 95 L222 97 L226 100" stroke="#141416" strokeWidth="1.5" fill="none" />
              <circle cx="230" cy="94" r="1.5" fill="#141416" />
              {/* Clear Arc-Rated Eye Protection */}
              <rect x="223" y="91" width="16" height="6" rx="2" fill="#E0F2FE" fillOpacity="0.8" stroke="#141416" strokeWidth="1.5" />
              <line x1="239" y1="94" x2="244" y2="94" stroke="#141416" strokeWidth="1.5" />

              {/* Blue Electrical Trade Safety Helmet */}
              <path d="M222 89 C222 74 248 74 248 89 Z" fill="#2563EB" stroke="#141416" strokeWidth="2" />
              <path d="M218 88 L250 88 L248 91 L220 91 Z" fill="#1D4ED8" stroke="#141416" strokeWidth="1.5" />
            </g>

            {/* Digital Multimeter (Rugged Yellow Holster & Live LCD) */}
            <g stroke="#141416" strokeWidth="2">
              {/* Multimeter Body */}
              <rect x="175" y="125" width="26" height="42" rx="3" fill="#EAB308" />
              <rect x="178" y="128" width="20" height="15" rx="1" fill="url(#meterLcd)" />
              {/* Real-Time Digital Readout */}
              <text
                x="180"
                y="139"
                fill="#064E3B"
                fontSize="7"
                fontFamily="monospace"
                fontWeight="black"
                className="animate-meter-pulse"
              >
                230.4V
              </text>
              {/* Selector Dial */}
              <circle cx="188" cy="154" r="5" fill="#141416" />
              <line x1="188" y1="154" x2="188" y2="150" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>

            {/* Left Arm holding Multimeter */}
            <g stroke="#141416" strokeWidth="2">
              <path d="M224 116 L202 126 L196 138" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" />
              <path d="M224 116 L202 126 L196 138" stroke="#141416" strokeWidth="1.5" fill="none" />
              {/* Insulated 1000V Red Glove holding meter */}
              <circle cx="196" cy="140" r="5.5" fill="#DC2626" stroke="#141416" strokeWidth="1.5" />
            </g>

            {/* Right Arm & Active Probes Testing Terminal (Kinetic Motion) */}
            <g stroke="#141416" strokeWidth="2">
              <path d="M238 116 L210 120 L165 106" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" />
              <path d="M238 116 L210 120 L165 106" stroke="#141416" strokeWidth="1.5" fill="none" />
              {/* 1000V Glove */}
              <circle cx="165" cy="106" r="5.5" fill="#DC2626" stroke="#141416" strokeWidth="1.5" />

              {/* Flexible Test Leads running from Meter to Terminal */}
              {/* Red Positive Lead */}
              <path d="M184 167 C170 178 150 140 156 104" stroke="#DC2626" strokeWidth="2" fill="none" />
              {/* Black Common/Negative Lead */}
              <path d="M192 167 C180 182 140 145 146 104" stroke="#141416" strokeWidth="2" fill="none" />

              {/* Shrouded Test Probes making contact with DB Terminal */}
              <rect x="154" y="96" width="3" height="12" fill="#DC2626" stroke="#141416" strokeWidth="1" />
              <line x1="155.5" y1="96" x2="155.5" y2="88" stroke="#E2E8F0" strokeWidth="1.5" />
              <rect x="144" y="96" width="3" height="12" fill="#141416" stroke="#141416" strokeWidth="1" />
              <line x1="145.5" y1="96" x2="145.5" y2="88" stroke="#E2E8F0" strokeWidth="1.5" />

              {/* Micro-spark at terminal probe point */}
              <circle cx="155.5" cy="88" r="1.5" fill="#38BDF8" className="animate-indicator-blink" />
            </g>
          </svg>

          {/* Brutalist Telemetry Footer Badge */}
          <div className="mt-2 pt-2 border-t border-iron-200 flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-iron-900 font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-none inline-block animate-pulse"></span>
              <span>// 02 · ELECTRICAL [ECB WIREMAN]</span>
            </div>
            <span className="text-brick-600 font-black">230V GRID READY · CoC</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MASONRY VIGNETTE (Mid-Right): NHBRC Master Bricklayer      */}
      {/* ============================================================ */}
      <div
        className="absolute top-[580px] lg:top-[600px] right-2 lg:right-6 xl:right-12 2xl:right-20 w-72 lg:w-80 xl:w-96 transition-transform duration-75 ease-out"
        style={{ transform: `translateY(${pMasonry}px)` }}
      >
        <div className="bg-white/85 backdrop-blur-xs border-2 border-iron-950 p-3 shadow-brutal transition-all">
          <svg
            viewBox="0 0 320 220"
            className="w-full h-auto drop-shadow-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="corobrik1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C2410C" />
                <stop offset="100%" stopColor="#9A3412" />
              </linearGradient>
              <linearGradient id="corobrik2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B93815" />
                <stop offset="100%" stopColor="#7C2D12" />
              </linearGradient>
              <linearGradient id="levelLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#84CC16" />
                <stop offset="100%" stopColor="#65A30D" />
              </linearGradient>
            </defs>

            {/* SABS Clay Face-Brick Courses (Corobrik Specification) */}
            <g stroke="#141416" strokeWidth="2.5">
              {/* Course 1 (Foundation Course) */}
              <rect x="130" y="180" width="40" height="15" fill="url(#corobrik1)" />
              <rect x="174" y="180" width="40" height="15" fill="url(#corobrik2)" />
              <rect x="218" y="180" width="40" height="15" fill="url(#corobrik1)" />
              <rect x="262" y="180" width="42" height="15" fill="url(#corobrik2)" />

              {/* Course 2 */}
              <rect x="152" y="162" width="40" height="15" fill="url(#corobrik2)" />
              <rect x="196" y="162" width="40" height="15" fill="url(#corobrik1)" />
              <rect x="240" y="162" width="40" height="15" fill="url(#corobrik2)" />
              <rect x="284" y="162" width="20" height="15" fill="url(#corobrik1)" />

              {/* Course 3 */}
              <rect x="174" y="144" width="40" height="15" fill="url(#corobrik1)" />
              <rect x="218" y="144" width="40" height="15" fill="url(#corobrik2)" />
              <rect x="262" y="144" width="42" height="15" fill="url(#corobrik1)" />

              {/* Mortar Joints (10mm Recessed Tooling Line) */}
              <line x1="126" y1="180" x2="304" y2="180" stroke="#CBD5E1" strokeWidth="3" />
              <line x1="148" y1="162" x2="304" y2="162" stroke="#CBD5E1" strokeWidth="3" />
              <line x1="170" y1="144" x2="304" y2="144" stroke="#CBD5E1" strokeWidth="3" />
            </g>

            {/* Active Bedded Brick & Precision Box-Beam Spirit Level (Kinetic Group) */}
            <g className="animate-brick-place">
              {/* Fresh Face-Brick Being Placed onto Course */}
              <rect x="130" y="126" width="40" height="15" fill="#EA580C" stroke="#141416" strokeWidth="2.5" />
              {/* Extruded Wet Mortar under brick */}
              <path d="M128 141 Q150 144 172 141" stroke="#94A3B8" strokeWidth="3.5" fill="none" />

              {/* Stabila 600mm Aluminium Spirit Level resting on top of brick */}
              <rect x="110" y="116" width="75" height="9" rx="1" fill="#FACC15" stroke="#141416" strokeWidth="2" />
              {/* Rubber Shockproof End Caps */}
              <rect x="110" y="116" width="4" height="9" fill="#141416" />
              <rect x="181" y="116" width="4" height="9" fill="#141416" />

              {/* Horizontal Fluorescent Green Level Vial */}
              <rect x="140" y="118.5" width="16" height="4.5" rx="1.5" fill="url(#levelLiquid)" stroke="#141416" strokeWidth="1" />
              {/* Hairlines */}
              <line x1="146" y1="118.5" x2="146" y2="123" stroke="#141416" strokeWidth="1" />
              <line x1="150" y1="118.5" x2="150" y2="123" stroke="#141416" strokeWidth="1" />
              {/* Dynamic Oscillating Spirit Bubble */}
              <ellipse cx="148" cy="120.7" rx="2" ry="1.4" fill="#FFFFFF" className="animate-level-bubble" />
            </g>

            {/* Kneeling Mason Artisan (Yellow Skin Tone #FBBF24, High-Vis, Knee Pads) */}
            {/* Kneeling Boots */}
            <g stroke="#141416" strokeWidth="2.5">
              <rect x="36" y="196" width="26" height="10" rx="2" fill="#0F172A" />
              <rect x="78" y="194" width="22" height="12" rx="2" fill="#0F172A" />
            </g>

            {/* Heavy Cordura Work Trousers with Molded Knee Pads */}
            <g stroke="#141416" strokeWidth="2.5">
              <path d="M48 196 L58 160 L92 160 L102 194 Z" fill="#334155" />
              {/* Polyurethane Knee Pads with Double Straps */}
              <rect x="84" y="174" width="16" height="16" rx="4" fill="#D97706" stroke="#141416" strokeWidth="2" />
              <line x1="84" y1="179" x2="100" y2="179" stroke="#141416" strokeWidth="1.5" />
              <line x1="84" y1="185" x2="100" y2="185" stroke="#141416" strokeWidth="1.5" />
            </g>

            {/* Torso & High-Vis Orange Vest with Silver Reflective Strips */}
            <g stroke="#141416" strokeWidth="2.5">
              <path d="M58 160 L64 122 L98 122 L94 160 Z" fill="#EA580C" />
              {/* Horizontal 3M Reflective Bands */}
              <rect x="66" y="134" width="30" height="5" fill="#E2E8F0" stroke="#141416" strokeWidth="1" />
              <rect x="68" y="146" width="26" height="5" fill="#E2E8F0" stroke="#141416" strokeWidth="1" />
              {/* AFISwitch SAPS Badge */}
              <rect x="70" y="126" width="8" height="6" fill="#FFFFFF" stroke="#141416" strokeWidth="1" />
              <circle cx="74" cy="129" r="1.5" fill="#047857" />
            </g>

            {/* Head, Yellow Hard Hat & Safety Dust Goggles */}
            <g stroke="#141416" strokeWidth="2">
              <rect x="76" y="112" width="10" height="12" fill="#FBBF24" />
              <path
                d="M72 112 C72 98 94 98 94 112 C94 119 86 122 80 122 C74 122 72 117 72 112 Z"
                fill="#FBBF24"
              />
              <path d="M72 108 L68 110 L72 113" stroke="#141416" strokeWidth="1.5" fill="none" />
              <circle cx="76" cy="107" r="1.5" fill="#141416" />

              {/* Tinted Dust Goggles */}
              <rect x="70" y="104" width="16" height="6" rx="2" fill="#0284C7" fillOpacity="0.75" stroke="#141416" strokeWidth="1.5" />

              {/* Hard Hat with Rain Gutter Brim */}
              <path d="M68 102 C68 88 96 88 96 102 Z" fill="#FACC15" stroke="#141416" strokeWidth="2" />
              <path d="M66 101 L98 101 L96 104 L68 104 Z" fill="#EAB308" stroke="#141416" strokeWidth="1.5" />
            </g>

            {/* Left Arm holding Philadelphia Brick Trowel */}
            <g className="animate-trowel-smooth" stroke="#141416" strokeWidth="2">
              <path d="M68 132 L92 142 L112 145" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" />
              <path d="M68 132 L92 142 L112 145" stroke="#141416" strokeWidth="1.5" fill="none" />
              {/* Split Leather Work Glove */}
              <circle cx="112" cy="145" r="5" fill="#78350F" />

              {/* Philadelphia Trowel Shank & Blade */}
              <path d="M115 145 L121 140 L124 143" stroke="#94A3B8" strokeWidth="2.5" fill="none" />
              <polygon points="124,143 140,140 134,149" fill="#CBD5E1" stroke="#141416" strokeWidth="1.5" />
              {/* Wet Mortar dollop on trowel blade */}
              <ellipse cx="132" cy="143" rx="4" ry="2" fill="#64748B" />
            </g>

            {/* Right Arm: Guiding and Seating Brick */}
            <g stroke="#141416" strokeWidth="2">
              <path d="M84 130 L110 130 L136 132" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" />
              <path d="M84 130 L110 130 L136 132" stroke="#141416" strokeWidth="1.5" fill="none" />
              <circle cx="136" cy="132" r="5" fill="#78350F" />
            </g>

            {/* Galvanized Mortar Bucket with Splatters */}
            <g stroke="#141416" strokeWidth="2">
              <polygon points="16,206 22,182 42,182 48,206" fill="#94A3B8" />
              <path d="M18 182 Q32 172 46 182" stroke="#475569" strokeWidth="2" fill="none" />
              <ellipse cx="32" cy="184" rx="9" ry="3" fill="#64748B" />
            </g>
          </svg>

          {/* Brutalist Telemetry Footer Badge */}
          <div className="mt-2 pt-2 border-t border-iron-200 flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-iron-900 font-bold">
              <span className="w-2 h-2 bg-amber-500 rounded-none inline-block animate-pulse"></span>
              <span>// 03 · MASONRY [NHBRC #2940]</span>
            </div>
            <span className="text-brick-600 font-black">CLASS II MORTAR · PLUMB</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. TILING VIGNETTE (Lower-Left): Precision Rail Cutter       */}
      {/* ============================================================ */}
      <div
        className="absolute top-[880px] lg:top-[920px] left-2 lg:left-6 xl:left-12 2xl:left-20 w-72 lg:w-80 xl:w-96 transition-transform duration-75 ease-out"
        style={{ transform: `translateY(${pTiling}px)` }}
      >
        <div className="bg-white/85 backdrop-blur-xs border-2 border-iron-950 p-3 shadow-brutal transition-all">
          <svg
            viewBox="0 0 320 220"
            className="w-full h-auto drop-shadow-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="chromeRail" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
              <linearGradient id="porcelainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
            </defs>

            {/* Heavy-Duty Die-Cast Aluminum Base Plate & Rubber Pads */}
            <g stroke="#141416" strokeWidth="2.5">
              {/* Base plate */}
              <rect x="40" y="170" width="180" height="18" fill="#CBD5E1" rx="1" />
              {/* Shock absorbing textured rubber pads */}
              <rect x="50" y="167" width="70" height="4" fill="#0F172A" />
              <rect x="135" y="167" width="70" height="4" fill="#0F172A" />

              {/* End Support Brackets */}
              <rect x="36" y="148" width="12" height="26" fill="#475569" />
              <rect x="212" y="148" width="12" height="26" fill="#475569" />

              {/* Dual Solid Chrome Plated Guide Rails */}
              <rect x="44" y="150" width="172" height="5" rx="2" fill="url(#chromeRail)" stroke="#141416" strokeWidth="1.5" />
              <rect x="44" y="157" width="172" height="5" rx="2" fill="url(#chromeRail)" stroke="#141416" strokeWidth="1.5" />

              {/* Millimeter Metric Measuring Gauge Bar */}
              <rect x="48" y="174" width="164" height="6" fill="#F8FAFC" stroke="#141416" strokeWidth="1" />
              <line x1="60" y1="174" x2="60" y2="180" stroke="#141416" strokeWidth="1" />
              <line x1="80" y1="174" x2="80" y2="180" stroke="#141416" strokeWidth="1" />
              <line x1="100" y1="174" x2="100" y2="180" stroke="#141416" strokeWidth="1" />
              <line x1="120" y1="174" x2="120" y2="180" stroke="#141416" strokeWidth="1" />
              <line x1="140" y1="174" x2="140" y2="180" stroke="#141416" strokeWidth="1" />
              <line x1="160" y1="174" x2="160" y2="180" stroke="#141416" strokeWidth="1" />
              <line x1="180" y1="174" x2="180" y2="180" stroke="#141416" strokeWidth="1" />
              <line x1="200" y1="174" x2="200" y2="180" stroke="#141416" strokeWidth="1" />
            </g>

            {/* 600x600 Rectified Porcelain Tile Placed on Bed */}
            <g stroke="#141416" strokeWidth="2">
              <rect x="75" y="161" width="105" height="10" fill="url(#porcelainGrad)" />
              {/* Marble vein streaks */}
              <path d="M85 163 Q110 168 140 162" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6 2" />
              {/* Scored line with red precision laser guide indication */}
              <line x1="125" y1="161" x2="125" y2="171" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 1.5" />
            </g>

            {/* Sliding Scoring Carriage & Lever Handle (Kinetic Rail Motion) */}
            <g className="animate-tile-glide">
              {/* Ball-Bearing Carriage Housing */}
              <rect x="85" y="144" width="22" height="22" rx="2" fill="#DC2626" stroke="#141416" strokeWidth="2.5" />
              {/* Bearing guide bushings */}
              <circle cx="91" cy="152" r="3" fill="#E2E8F0" stroke="#141416" strokeWidth="1" />
              <circle cx="101" cy="152" r="3" fill="#E2E8F0" stroke="#141416" strokeWidth="1" />

              {/* Titanium Scoring Wheel assembly */}
              <circle cx="96" cy="164" r="3.5" fill="#FACC15" stroke="#141416" strokeWidth="1.5" />

              {/* Ergonomic Red Scoring Lever Handle */}
              <path d="M96 144 L118 120 L135 110" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
              <path d="M96 144 L118 120 L135 110" stroke="#141416" strokeWidth="1.5" fill="none" />
              {/* Molded rubber grip knob */}
              <circle cx="136" cy="109" r="6" fill="#141416" stroke="#FFFFFF" strokeWidth="1" />

              {/* Micro-spark / diamond friction particles */}
              <polygon
                points="96,161 98,157 101,161 98,164"
                fill="#FBBF24"
                className="animate-tile-spark"
              />
            </g>

            {/* Female Tiler Artisan (Concentrated Posture, Green Overalls, Safety Visor) */}
            {/* Kneeling Legs & Molded Knee Pads */}
            <g stroke="#141416" strokeWidth="2.5">
              <path d="M226 195 L238 152 L268 152 L282 195 Z" fill="#1E293B" />
              {/* Heavy duty rubber knee pads */}
              <rect x="234" y="172" width="16" height="14" rx="3" fill="#D97706" stroke="#141416" strokeWidth="2" />
              {/* Suede Tiler Boots */}
              <rect x="222" y="193" width="22" height="8" rx="2" fill="#78350F" />
              <rect x="274" y="193" width="22" height="8" rx="2" fill="#78350F" />
            </g>

            {/* Work Dungarees (Forest Green #047857 with Brass Buckles) */}
            <g stroke="#141416" strokeWidth="2.5">
              <path d="M236 152 L230 114 L264 114 L270 152 Z" fill="#047857" />
              {/* Dungaree Straps & Brass Hardware */}
              <rect x="234" y="114" width="7" height="24" fill="#065F46" />
              <rect x="254" y="114" width="7" height="24" fill="#065F46" />
              <circle cx="237.5" cy="136" r="2" fill="#FACC15" />
              <circle cx="257.5" cy="136" r="2" fill="#FACC15" />
              {/* Pocket with Rule Slot */}
              <rect x="240" y="132" width="18" height="14" rx="1" fill="#065F46" stroke="#141416" strokeWidth="1.5" />
              <line x1="244" y1="126" x2="244" y2="134" stroke="#FBBF24" strokeWidth="2" />
            </g>

            {/* Head, Wrapped Hair & Polycarbonate Safety Visor */}
            <g stroke="#141416" strokeWidth="2">
              <rect x="230" y="100" width="8" height="16" fill="#FBBF24" />
              <path
                d="M226 100 C226 86 248 86 248 100 C248 108 240 112 232 112 C226 112 226 106 226 100 Z"
                fill="#FBBF24"
              />
              <circle cx="230" cy="98" r="1.5" fill="#141416" />
              <path d="M226 97 L222 99 L226 102" stroke="#141416" strokeWidth="1.5" fill="none" />

              {/* Safety Visor / Glasses */}
              <rect x="222" y="94" width="17" height="7" rx="2" fill="#38BDF8" fillOpacity="0.75" stroke="#141416" strokeWidth="1.5" />
              <line x1="239" y1="97" x2="245" y2="97" stroke="#141416" strokeWidth="1.5" />

              {/* Tied Back Hair Bun */}
              <circle cx="249" cy="96" r="7" fill="#1C1917" stroke="#141416" strokeWidth="1.5" />

              {/* Tiler's Brimmed Cap */}
              <path d="M224 93 C224 81 248 81 248 93 Z" fill="#F59E0B" stroke="#141416" strokeWidth="2" />
              <line x1="218" y1="94" x2="232" y2="94" stroke="#141416" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* Left Arm securing tile on breaking plate */}
            <g stroke="#141416" strokeWidth="2">
              <path d="M234 120 L206 138 L170 160" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" />
              <path d="M234 120 L206 138 L170 160" stroke="#141416" strokeWidth="1.5" fill="none" />
              {/* Nitrile Precision Grip Glove */}
              <circle cx="170" cy="160" r="5" fill="#0284C7" />
            </g>

            {/* Right Arm Operating Cutter Lever Handle */}
            <g stroke="#141416" strokeWidth="2">
              <path d="M236 122 L200 114 L144 110" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" />
              <path d="M236 122 L200 114 L144 110" stroke="#141416" strokeWidth="1.5" fill="none" />
              <circle cx="140" cy="110" r="5.5" fill="#0284C7" />
            </g>

            {/* Stack of Spare Porcelain Tiles & 3mm Tile Spacers */}
            <g stroke="#141416" strokeWidth="1.5">
              <rect x="264" y="174" width="36" height="4" fill="#E2E8F0" />
              <rect x="264" y="178" width="36" height="4" fill="#F8FAFC" />
              <rect x="264" y="182" width="36" height="4" fill="#E2E8F0" />
              {/* Tile Spacer Crosses (+) */}
              <path d="M250 184 L256 184 M253 181 L253 187" stroke="#38BDF8" strokeWidth="2" />
              <path d="M242 186 L248 186 M245 183 L245 189" stroke="#38BDF8" strokeWidth="2" />
            </g>
          </svg>

          {/* Brutalist Telemetry Footer Badge */}
          <div className="mt-2 pt-2 border-t border-iron-200 flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-iron-900 font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-none inline-block animate-pulse"></span>
              <span>// 04 · TILING &amp; FLOORING</span>
            </div>
            <span className="text-brick-600 font-black">0.5MM TOLERANCE · PORCELAIN</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArtisanCanvas;