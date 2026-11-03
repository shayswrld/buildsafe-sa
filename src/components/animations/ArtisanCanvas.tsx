"use client";

import React from "react";

/**
 * ArtisanCanvas - Ambient Vector SVG Animation Layer
 *
 * Depicts male and female craftspeople with yellow skin tone collaborating
 * on core South African trades:
 * 1. Carpentry (Sawing timber on a sawhorse) - Top-left ambient position
 * 2. Masonry (Laying brick with a trowel) - Bottom-right ambient position
 * 3. Tiling (Cutting ceramic tile with a manual rail cutter) - Bottom-left ambient position
 *
 * Attributes:
 * - pointer-events-none: Never intercepts user clicks or button activations
 * - aria-hidden: Purely decorative ambient layer for screen readers
 * - hidden on short viewports (< 700px height or mobile) to preserve vertical space
 */
export function ArtisanCanvas() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none hidden md:block"
    >
      {/* ============================================================ */}
      {/* 1. CARPENTRY VIGNETTE (Top-Left): Female artisan sawing timber */}
      {/* ============================================================ */}
      <div className="absolute top-20 left-4 lg:left-12 xl:left-20 w-64 h-56 opacity-90 transition-opacity">
        <svg
          viewBox="0 0 240 200"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sawhorse trestle */}
          <line x1="40" y1="180" x2="60" y2="120" stroke="#141416" strokeWidth="3" strokeLinecap="round" />
          <line x1="80" y1="180" x2="60" y2="120" stroke="#141416" strokeWidth="3" strokeLinecap="round" />
          <line x1="45" y1="150" x2="75" y2="150" stroke="#141416" strokeWidth="2.5" />
          <rect x="52" y="116" width="90" height="10" fill="#D97706" stroke="#141416" strokeWidth="2" />

          {/* Timber plank being cut */}
          <rect x="30" y="106" width="120" height="12" fill="#FDE68A" stroke="#141416" strokeWidth="2.5" />
          <line x1="90" y1="106" x2="90" y2="118" stroke="#B45309" strokeWidth="1.5" strokeDasharray="2 2" />

          {/* Female Carpenter Body (Yellow Skin Tone #FBBF24 / #F59E0B) */}
          {/* Legs & Boots */}
          <path d="M125 180 L130 145 L145 145 L150 180" stroke="#141416" strokeWidth="3" fill="#1E293B" />
          <rect x="120" y="178" width="14" height="6" fill="#141416" />
          <rect x="146" y="178" width="14" height="6" fill="#141416" />

          {/* Torso & Denim Overalls */}
          <path d="M124 145 L128 112 L150 112 L148 145 Z" fill="#2563EB" stroke="#141416" strokeWidth="2.5" />
          {/* Work shirt underneath */}
          <path d="M130 112 L132 98 L146 98 L148 112 Z" fill="#EF4444" stroke="#141416" strokeWidth="2" />

          {/* Head & Neck (Yellow Skin) */}
          <rect x="136" y="88" width="6" height="10" fill="#FBBF24" />
          <circle cx="139" cy="80" r="11" fill="#FBBF24" stroke="#141416" strokeWidth="2" />

          {/* Female Hair (Braided bun / ponytail) */}
          <path d="M130 76 Q139 68 148 76 Q146 84 130 79 Z" fill="#3B2514" />
          <circle cx="149" cy="74" r="5" fill="#3B2514" />

          {/* Yellow Safety Hard Hat */}
          <path d="M128 75 C128 66 150 66 150 75 Z" fill="#F59E0B" stroke="#141416" strokeWidth="2" />
          <rect x="126" y="74" width="26" height="3" fill="#F59E0B" stroke="#141416" strokeWidth="1.5" />

          {/* Left stabilizing arm holding timber */}
          <path d="M132 110 L115 110 L100 106" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
          <path d="M132 110 L115 110 L100 106" stroke="#141416" strokeWidth="1.5" fill="none" />

          {/* Right Arm & Handsaw (Animated group) */}
          <g className="animate-saw-motion">
            {/* Upper arm & forearm moving */}
            <path d="M144 110 L128 122 L102 112" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
            <path d="M144 110 L128 122 L102 112" stroke="#141416" strokeWidth="1.5" fill="none" />
            {/* Saw handle */}
            <rect x="96" y="108" width="8" height="12" rx="2" fill="#B45309" stroke="#141416" strokeWidth="1.5" />
            {/* Saw blade cutting timber */}
            <polygon points="98,114 88,102 87,126" fill="#CBD5E1" stroke="#141416" strokeWidth="2" />
            <line x1="88" y1="126" x2="98" y2="114" stroke="#141416" strokeWidth="1" strokeDasharray="1 1" />
          </g>

          {/* Sawdust particles falling */}
          <g className="animate-sawdust-drift">
            <circle cx="91" cy="122" r="1.5" fill="#D97706" />
            <circle cx="89" cy="126" r="1.2" fill="#F59E0B" />
            <circle cx="93" cy="129" r="1.5" fill="#D97706" />
          </g>

          {/* Trade Tool Label */}
          <text x="50" y="196" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#78350F" letterSpacing="1">
            // CARPENTRY · 100% TIMBER VETTED
          </text>
        </svg>
      </div>

      {/* ============================================================ */}
      {/* 2. MASONRY VIGNETTE (Bottom-Right): Male artisan laying brick */}
      {/* ============================================================ */}
      <div className="absolute bottom-6 right-4 lg:right-12 xl:right-16 w-68 h-56 opacity-90 transition-opacity">
        <svg
          viewBox="0 0 260 200"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Brick wall foundation (Face brick courses) */}
          <g stroke="#141416" strokeWidth="2">
            {/* Course 1 */}
            <rect x="110" y="160" width="36" height="14" fill="#B93815" />
            <rect x="148" y="160" width="36" height="14" fill="#B93815" />
            <rect x="186" y="160" width="36" height="14" fill="#B93815" />
            <rect x="224" y="160" width="34" height="14" fill="#B93815" />
            {/* Course 2 */}
            <rect x="128" y="144" width="36" height="14" fill="#991B1B" />
            <rect x="166" y="144" width="36" height="14" fill="#B93815" />
            <rect x="204" y="144" width="36" height="14" fill="#991B1B" />
            {/* Mortar bed line */}
            <line x1="120" y1="144" x2="250" y2="144" stroke="#E2E8F0" strokeWidth="2" />
          </g>

          {/* Male Artisan Kneeling / Squatting (Yellow Skin #FBBF24) */}
          {/* Work Boots */}
          <rect x="36" y="176" width="22" height="8" rx="1" fill="#141416" />
          <rect x="74" y="174" width="18" height="10" rx="1" fill="#141416" />

          {/* Work Trousers (Kneeling posture) */}
          <path d="M46 176 L52 148 L80 148 L88 174 Z" fill="#334155" stroke="#141416" strokeWidth="2.5" />

          {/* High-Vis Vest & Torso */}
          <path d="M52 148 L58 116 L84 116 L80 148 Z" fill="#F59E0B" stroke="#141416" strokeWidth="2.5" />
          {/* Silver reflective stripe */}
          <rect x="60" y="126" width="22" height="4" fill="#E2E8F0" stroke="#141416" strokeWidth="1" />

          {/* Head & Neck (Yellow Skin) */}
          <rect x="66" y="106" width="8" height="10" fill="#FBBF24" />
          <circle cx="70" cy="98" r="11" fill="#FBBF24" stroke="#141416" strokeWidth="2" />
          {/* Ear & Short Hair */}
          <path d="M62 96 C62 90 78 90 78 96 Z" fill="#1E293B" />

          {/* Yellow Hard Hat with Brim */}
          <path d="M60 94 C60 84 80 84 80 94 Z" fill="#FBBF24" stroke="#141416" strokeWidth="2" />
          <rect x="58" y="93" width="25" height="3" fill="#F59E0B" stroke="#141416" strokeWidth="1.5" />

          {/* Left hand holding trowel with wet mortar */}
          <path d="M60 124 L80 134 L96 138" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
          <path d="M60 124 L80 134 L96 138" stroke="#141416" strokeWidth="1.5" fill="none" />
          {/* Bricklayer's Trowel */}
          <polygon points="96,138 108,136 102,144" fill="#94A3B8" stroke="#141416" strokeWidth="1.5" />

          {/* Right Arm & Active Brick Placement (Animated group) */}
          <g className="animate-brick-tap">
            {/* Arm reaching out over wall */}
            <path d="M74 122 L98 126 L124 134" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
            <path d="M74 122 L98 126 L124 134" stroke="#141416" strokeWidth="1.5" fill="none" />
            {/* Fresh Brick being laid into position */}
            <rect x="128" y="128" width="36" height="14" fill="#C2410C" stroke="#141416" strokeWidth="2.5" />
            {/* Spirit level check badge */}
            <rect x="138" y="132" width="16" height="5" rx="1" fill="#84CC16" stroke="#141416" strokeWidth="1" />
            <circle cx="146" cy="134.5" r="1" fill="#141416" />
          </g>

          {/* Mortar bucket on ground */}
          <polygon points="18,184 22,166 38,166 42,184" fill="#94A3B8" stroke="#141416" strokeWidth="2" />
          <rect x="23" y="164" width="14" height="3" fill="#CBD5E1" stroke="#141416" strokeWidth="1" />

          {/* Trade Tool Label */}
          <text x="120" y="194" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#7C2D12" letterSpacing="1">
            // MASONRY · NHBRC ALIGNED CRAFT
          </text>
        </svg>
      </div>

      {/* ============================================================ */}
      {/* 3. TILING VIGNETTE (Bottom-Left): Female artisan cutting tile */}
      {/* ============================================================ */}
      <div className="absolute bottom-6 left-4 lg:left-10 xl:left-16 w-68 h-56 opacity-90 transition-opacity">
        <svg
          viewBox="0 0 260 200"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Tile workbench / ground slab */}
          <rect x="20" y="170" width="220" height="14" fill="#E2E8F0" stroke="#141416" strokeWidth="2.5" />
          <line x1="60" y1="170" x2="60" y2="184" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="120" y1="170" x2="120" y2="184" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="180" y1="170" x2="180" y2="184" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Ceramic Tile Cutter Machine */}
          {/* Base plate */}
          <rect x="60" y="156" width="100" height="14" fill="#CBD5E1" stroke="#141416" strokeWidth="2" />
          {/* Guide rails */}
          <line x1="62" y1="152" x2="158" y2="152" stroke="#141416" strokeWidth="3" strokeLinecap="round" />
          <line x1="62" y1="147" x2="158" y2="147" stroke="#64748B" strokeWidth="2" />

          {/* Ceramic Floor Tile being scored */}
          <rect x="80" y="152" width="45" height="8" fill="#F8FAFC" stroke="#141416" strokeWidth="1.5" />
          <line x1="102" y1="152" x2="102" y2="160" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="2 1" />

          {/* Female Artisan leaning over tile cutter (Yellow Skin #FBBF24) */}
          {/* Legs / Knee pads */}
          <path d="M175 174 L185 142 L205 142 L215 174 Z" fill="#1E293B" stroke="#141416" strokeWidth="2.5" />
          {/* Protective knee pads */}
          <rect x="180" y="162" width="12" height="10" rx="3" fill="#D97706" stroke="#141416" strokeWidth="1.5" />

          {/* Work Smock / Overalls */}
          <path d="M180 142 L175 110 L200 110 L205 142 Z" fill="#047857" stroke="#141416" strokeWidth="2.5" />

          {/* Head & Neck (Yellow Skin) */}
          <rect x="174" y="98" width="6" height="12" fill="#FBBF24" />
          <circle cx="177" cy="90" r="11" fill="#FBBF24" stroke="#141416" strokeWidth="2" />

          {/* Tied back dark hair */}
          <path d="M170 86 Q177 78 186 86 Q184 94 170 89 Z" fill="#1C1917" />
          <circle cx="187" cy="85" r="4.5" fill="#1C1917" />

          {/* Safety Visor / Glasses */}
          <rect x="168" y="88" width="14" height="4" fill="#38BDF8" stroke="#141416" strokeWidth="1.5" />
          {/* Yellow cap */}
          <path d="M168 85 C168 76 186 76 186 85 Z" fill="#F59E0B" stroke="#141416" strokeWidth="2" />
          <line x1="164" y1="86" x2="174" y2="86" stroke="#141416" strokeWidth="2" strokeLinecap="round" />

          {/* Left hand holding tile securely */}
          <path d="M178 116 L154 130 L130 150" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
          <path d="M178 116 L154 130 L130 150" stroke="#141416" strokeWidth="1.5" fill="none" />

          {/* Right Arm & Sliding Cutting Carriage (Animated group) */}
          <g className="animate-tile-score">
            {/* Sliding lever handle */}
            <path d="M175 118 L150 124 L108 140" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
            <path d="M175 118 L150 124 L108 140" stroke="#141416" strokeWidth="1.5" fill="none" />
            {/* Cutting wheel carriage */}
            <rect x="100" y="142" width="12" height="12" rx="1" fill="#DC2626" stroke="#141416" strokeWidth="2" />
            <circle cx="106" cy="154" r="2.5" fill="#141416" />
          </g>

          {/* Stack of spare porcelain tiles ready */}
          <g stroke="#141416" strokeWidth="1.5">
            <rect x="210" y="162" width="24" height="3" fill="#E2E8F0" />
            <rect x="210" y="165" width="24" height="3" fill="#F8FAFC" />
            <rect x="210" y="168" width="24" height="3" fill="#E2E8F0" />
          </g>

          {/* Trade Tool Label */}
          <text x="50" y="196" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#065F46" letterSpacing="1">
            // TILING &amp; FLOORING · PRECISION SCORE
          </text>
        </svg>
      </div>
    </div>
  );
}
export default ArtisanCanvas;
