"use client";

import React, { useEffect } from "react";

export interface ArtisanCanvasProps {
  className?: string;
}

/* Shared cartoon palette */
const INK = "#141416";
const SKIN = "#FBBF24";
const SKIN_SHADE = "#F59E0B";
const GLOVE = "#F6C177";
const BOOT = "#78350F";
const BLUSH = "#F87171";
const HAIR = "#29150B";

/**
 * Limb - cartoon "inked" limb: a thick dark outline stroke with a
 * coloured stroke on top, giving rounded tube-like arms and legs.
 */
function Limb({ points, color, width = 4.2 }: { points: string; color: string; width?: number }) {
  return (
    <>
      <polyline
        points={points}
        stroke={INK}
        strokeWidth={width + 2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points={points}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  );
}

/** Saw teeth zig-zag along the bottom edge of the blade. */
const SAW_TEETH = Array.from({ length: 11 }, (_, i) => {
  const x = 34 + i * 3;
  const y = 72 + (x - 32) / 34;
  return `${x},${y.toFixed(1)} ${x + 1.5},${(y + 1.6).toFixed(1)}`;
}).join(" ");

/** Face-brick wall courses: [x, y, width, fill]. Top-course gap at x=67 receives the animated brick. */
const WALL_BRICKS: [number, number, number, string][] = [
  [58, 98, 18, "#C2410C"], [77, 98, 18, "#9A3412"], [96, 98, 18, "#B93815"],
  [58, 89, 8, "#9A3412"], [67, 89, 18, "#B93815"], [86, 89, 18, "#C2410C"], [105, 89, 9, "#9A3412"],
  [58, 80, 18, "#B93815"], [77, 80, 18, "#C2410C"], [96, 80, 18, "#9A3412"],
  [58, 71, 8, "#C2410C"], [86, 71, 18, "#B93815"], [105, 71, 9, "#C2410C"],
];

/** Shared backdrop: pastel "sticker" disc, floor strip and ground line. */
function Backdrop({ disc }: { disc: string }) {
  return (
    <>
      <circle cx="60" cy="56" r="50" fill={disc} />
      <path d="M0 107 H120 V120 H0 Z" fill="#E7E5E4" />
      <line x1="0" y1="107" x2="120" y2="107" stroke={INK} strokeWidth="1.5" />
    </>
  );
}

/**
 * ArtisanCanvas - Cartoon Ambient Craftsperson Vignettes
 *
 * Exactly 3 South African artisan vignettes in fixed quadrant containers:
 * 1. CARPENTRY (Top-Left): Carpenter sawing timber clamped on a sawhorse (viewBox 0 0 120 120).
 * 2. MASONRY (Bottom-Right): Whistling mason tapping a freshly dropped face-brick level (viewBox 0 0 120 120).
 * 3. TILING (Bottom-Left): Tiler in a doek scoring porcelain tile on a rail cutter (viewBox 0 0 120 120).
 *
 * Cartoon treatment: inked outlines, oversized heads with expressive faces,
 * blinking eyes, idle head bobs, two-joint arms that track their tools,
 * squash-and-stretch, sawdust, sparks, sweat drops and music notes.
 * All motion is pure CSS keyframes (see globals.css), honouring prefers-reduced-motion.
 *
 * Interactivity:
 * - Isolated client-side click delegation for conversion telemetry:
 *   landing_cta_click { target: 'signup' | 'login' | 'public_trades' }
 * - Zero runtime scroll listeners or dynamic parallax calculations.
 */
export function ArtisanCanvas({ className = "" }: ArtisanCanvasProps) {
  useEffect(() => {
    const handleCtaClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cta]");
      if (!target) return;

      const ctaTarget = target.getAttribute("data-cta");
      if (ctaTarget === "signup" || ctaTarget === "login" || ctaTarget === "public_trades") {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("landing_cta_click", {
              detail: { target: ctaTarget },
            })
          );
        }
      }
    };

    document.addEventListener("click", handleCtaClick);
    return () => document.removeEventListener("click", handleCtaClick);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden select-none ${className}`}
    >
      {/* 1. CARPENTRY VIGNETTE (Top-Left: top-8 left-8 hidden lg:block) */}
      <div className="artisan-vignette absolute top-8 left-8 hidden lg:block w-48 sm:w-56">
        <div className="bg-white/85 backdrop-blur-xs border-2 border-iron-950 p-2.5 shadow-brutal transition-all">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-auto"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Backdrop disc="#FEF3C7" />
            <ellipse cx="40" cy="107.5" rx="28" ry="2.5" fill={INK} opacity="0.12" />
            <ellipse cx="92" cy="107.5" rx="16" ry="2.5" fill={INK} opacity="0.12" />

            {/* Sawdust pile & curly shavings */}
            <path d="M40 107 Q50 99 60 107 Z" fill="#FCD34D" stroke={INK} strokeWidth="1.2" />
            <path d="M66 105 q3 -3 5 0 q-2 2 -4 0" stroke="#B45309" strokeWidth="1" />
            <path d="M8 105 q2 -3 5 -1" stroke="#B45309" strokeWidth="1" />

            {/* Sawhorse */}
            <Limb points="26,76 18,107" color="#B45309" width={4} />
            <Limb points="54,76 62,107" color="#B45309" width={4} />
            <Limb points="21.4,94 58.6,94" color="#B45309" width={2.5} />
            <rect x="18" y="70" width="44" height="7" rx="1.5" fill="#D97706" stroke={INK} strokeWidth="1.5" />
            <line x1="21" y1="73.5" x2="59" y2="73.5" stroke="#92400E" strokeWidth="0.6" opacity="0.6" />

            {/* Timber plank with grain, knot & pencil cut-line */}
            <rect x="4" y="61" width="66" height="9" rx="1.5" fill="#F6C177" stroke={INK} strokeWidth="1.5" />
            <path d="M9 64 Q20 62.5 32 64 T56 64 T68 63.5" stroke="#C2410C" strokeWidth="0.6" opacity="0.6" />
            <path d="M9 67.5 Q24 66 38 67.5 T67 67" stroke="#C2410C" strokeWidth="0.6" opacity="0.6" />
            <ellipse cx="22" cy="65.5" rx="2.2" ry="1.3" fill="#D97706" stroke="#92400E" strokeWidth="0.6" />
            <line x1="7" y1="61.5" x2="7" y2="69.5" stroke="#B45309" strokeWidth="0.8" />
            <line x1="50" y1="61" x2="50" y2="70" stroke={INK} strokeWidth="0.8" strokeDasharray="1.5 1.2" />
            <path d="M49.4 61 L50.6 61 L50.6 64 L49.4 64 Z" fill={INK} />

            {/* C-Clamp */}
            <Limb points="29,58 35,58 35,79 29,79" color="#DC2626" width={2} />
            <line x1="29" y1="77" x2="29" y2="82" stroke={INK} strokeWidth="1.3" />
            <line x1="26" y1="82" x2="32" y2="82" stroke={INK} strokeWidth="1.6" />

            {/* Falling sawdust */}
            <circle cx="50" cy="71" r="1.2" fill="#F59E0B" stroke={INK} strokeWidth="0.4" className="artisan-dust-a" />
            <circle cx="50" cy="71" r="0.9" fill="#FCD34D" className="artisan-dust-b" />
            <circle cx="50" cy="71" r="1.1" fill="#D97706" className="artisan-dust-c" />
            <circle cx="50" cy="71" r="0.8" fill="#F59E0B" className="artisan-dust-a" style={{ animationDelay: "0.45s" }} />

            {/* Carpenter: legs & boots */}
            <Limb points="86,82 84,101" color="#2563EB" width={7} />
            <Limb points="97,82 98,101" color="#2563EB" width={7} />
            <path d="M76 107 L76 103 Q76 99.5 80 99.5 L88 99.5 L88 107 Z" fill={BOOT} stroke={INK} strokeWidth="1.3" />
            <path d="M92 107 L92 103 Q92 99.5 96 99.5 L103 99.5 L103 107 Z" fill={BOOT} stroke={INK} strokeWidth="1.3" />
            <line x1="80" y1="102" x2="84" y2="102" stroke="#FCD34D" strokeWidth="0.7" />
            <line x1="96" y1="102" x2="100" y2="102" stroke="#FCD34D" strokeWidth="0.7" />

            {/* Far arm steadying the plank (behind body) */}
            <Limb points="88,64 74,66 58,61" color={SKIN} />
            <circle cx="58" cy="61" r="3.4" fill={GLOVE} stroke={INK} strokeWidth="1.2" />

            {/* Body & head lean into each stroke */}
            <g className="artisan-carpenter-lean" style={{ transformOrigin: "92px 100px" }}>
              {/* Shirt, dungaree bib & tool belt */}
              <path d="M80 84 Q78 66 86 59 L98 59 Q106 66 104 84 Z" fill="#DC2626" stroke={INK} strokeWidth="1.6" />
              <path d="M84 84 L84 68 Q84 66 86 66 L98 66 Q100 66 100 68 L100 84 Z" fill="#2563EB" stroke={INK} strokeWidth="1.3" />
              <Limb points="85.5,67 86.5,59.5" color="#2563EB" width={1.8} />
              <Limb points="98.5,67 97.5,59.5" color="#2563EB" width={1.8} />
              <circle cx="86" cy="68" r="1" fill="#FACC15" stroke={INK} strokeWidth="0.5" />
              <circle cx="98" cy="68" r="1" fill="#FACC15" stroke={INK} strokeWidth="0.5" />
              <line x1="90.5" y1="71" x2="89.5" y2="65.5" stroke="#FACC15" strokeWidth="1.4" />
              <rect x="88" y="70" width="8" height="6" rx="1" fill="#1D4ED8" stroke={INK} strokeWidth="1" />
              <rect x="79" y="82" width="26" height="4" rx="1" fill="#92400E" stroke={INK} strokeWidth="1.2" />
              <rect x="90" y="82.5" width="4" height="3" fill="#FACC15" stroke={INK} strokeWidth="0.6" />
              <rect x="77" y="83" width="5" height="5" rx="1" fill="#FACC15" stroke={INK} strokeWidth="1" />
              <line x1="104" y1="85" x2="105" y2="96" stroke="#B45309" strokeWidth="2.2" />
              <rect x="101.5" y="83" width="7" height="3" rx="0.8" fill="#64748B" stroke={INK} strokeWidth="1" />

              {/* Head */}
              <g className="artisan-head-bob" style={{ transformOrigin: "92px 56px" }}>
                <circle cx="104" cy="37" r="5" fill={HAIR} stroke={INK} strokeWidth="1.2" />
                <path d="M102 34 Q105 36 103 40" stroke="#5B3A1E" strokeWidth="0.8" />
                <rect x="88.5" y="50" width="7" height="10" fill={SKIN} stroke={INK} strokeWidth="1.2" />
                <circle cx="92" cy="43" r="12" fill={SKIN} stroke={INK} strokeWidth="1.6" />
                <path d="M98 32.6 A12 12 0 0 1 98 53.4 A3.5 10.4 0 0 0 98 32.6 Z" fill={SKIN_SHADE} opacity="0.55" />
                <circle cx="102.5" cy="44" r="3" fill={SKIN} stroke={INK} strokeWidth="1.2" />
                <path d="M102 42.5 Q103.5 44 102 45.5" stroke={INK} strokeWidth="0.7" />
                <path d="M80.5 38 Q86 35 92 37.5 Q98 35 104 38.5 L104 36 L80.5 36 Z" fill={HAIR} />
                {/* Hard hat */}
                <path d="M79 37 Q79 23 92 23 Q105 23 105 37 Z" fill="#FACC15" stroke={INK} strokeWidth="1.6" />
                <path d="M92 23.5 V36" stroke="#EAB308" strokeWidth="2" />
                <path d="M83 31 Q85 26 89.5 25" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.8" />
                <rect x="76" y="35" width="32" height="3.5" rx="1.75" fill="#EAB308" stroke={INK} strokeWidth="1.3" />
                {/* Face: concentrating, tongue poking out */}
                <g className="artisan-blink" style={{ animationDelay: "0.6s" }}>
                  <ellipse cx="85.5" cy="44" rx="2.6" ry="3.2" fill="#FFFFFF" stroke={INK} strokeWidth="1" />
                  <ellipse cx="92.5" cy="44" rx="2.6" ry="3.2" fill="#FFFFFF" stroke={INK} strokeWidth="1" />
                  <circle cx="84.6" cy="44.8" r="1.5" fill={INK} />
                  <circle cx="91.6" cy="44.8" r="1.5" fill={INK} />
                  <circle cx="85.1" cy="44.1" r="0.5" fill="#FFFFFF" />
                  <circle cx="92.1" cy="44.1" r="0.5" fill="#FFFFFF" />
                </g>
                <path d="M82.5 39.6 L88 40.6" stroke={INK} strokeWidth="1.3" />
                <path d="M90 40.6 L95 39.8" stroke={INK} strokeWidth="1.3" />
                <path d="M81.5 46 Q78.8 48.5 82 49.6" fill={SKIN} stroke={INK} strokeWidth="1.2" />
                <path d="M83.5 53 Q87 55.5 91 52.5" stroke={INK} strokeWidth="1.2" />
                <path d="M84.5 53.6 Q84 56.6 86 56.1 Q87.1 55.1 86.5 54.1" fill="#F472B6" stroke={INK} strokeWidth="0.8" />
                <ellipse cx="95" cy="49.5" rx="2.4" ry="1.5" fill={BLUSH} opacity="0.55" />
              </g>
            </g>

            {/* Handsaw (Kinetic Stroke Group) */}
            <g className="artisan-saw-stroke">
              <polygon points="66,64 32,68 32,72 66,73" fill="#E2E8F0" stroke={INK} strokeWidth="1.1" />
              <polyline points={SAW_TEETH} stroke={INK} strokeWidth="0.6" />
              <line x1="36" y1="68.6" x2="62" y2="65.6" stroke="#FFFFFF" strokeWidth="0.9" />
              <circle cx="63.5" cy="66.5" r="0.7" fill={INK} />
              <circle cx="63.5" cy="70.5" r="0.7" fill={INK} />
              <path
                d="M64 62 L74 60 Q78 60 78 64 L78 72 Q78 76 74 76 L64 75 Z M68 64.5 L74 63.8 L74 71.5 L68 71.5 Z"
                fillRule="evenodd"
                fill="#B45309"
                stroke={INK}
                strokeWidth="1.1"
              />
            </g>

            {/* Motion "whoosh" lines */}
            <g className="artisan-whoosh" stroke={INK} strokeWidth="0.9">
              <path d="M27 64 q-3 3 0 6" />
              <path d="M23 63 q-4 4 0 8" />
            </g>

            {/* Near sawing arm: two-joint arm tracking the saw handle */}
            <g className="artisan-carp-upper" style={{ transformOrigin: "90px 64px" }}>
              <Limb points="90,64 79.9,75.1" color={SKIN} />
              <circle cx="90" cy="64.5" r="4.2" fill="#DC2626" stroke={INK} strokeWidth="1.2" />
              <g className="artisan-carp-fore" style={{ transformOrigin: "79.9px 75.1px" }}>
                <Limb points="79.9,75.1 71,63" color={SKIN} />
                <circle cx="71" cy="62.6" r="3.6" fill={GLOVE} stroke={INK} strokeWidth="1.2" />
                <path d="M68.5 61.5 L71.5 61" stroke={INK} strokeWidth="0.6" />
              </g>
            </g>
          </svg>

          <div className="mt-1.5 pt-1.5 border-t border-iron-200 flex items-center justify-between font-mono text-[9px]">
            <div className="flex items-center gap-1 text-iron-900 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none inline-block animate-pulse"></span>
              <span>// 01 · CARPENTRY [SANS 10082]</span>
            </div>
            <span className="text-brick-600 font-black">100% TIMBER VETTED</span>
          </div>
        </div>
      </div>

      {/* 2. MASONRY VIGNETTE (Bottom-Right: bottom-10 right-8 hidden md:block) */}
      <div className="artisan-vignette absolute bottom-10 right-8 hidden md:block w-48 sm:w-56">
        <div className="bg-white/85 backdrop-blur-xs border-2 border-iron-950 p-2.5 shadow-brutal transition-all">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-auto"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <clipPath id="artisan-mason-vest">
                <path d="M22 89 Q18 70 26 60 L42 60 Q50 70 46 89 Z" />
              </clipPath>
            </defs>
            <Backdrop disc="#FFEDD5" />
            <ellipse cx="34" cy="107.5" rx="28" ry="2.5" fill={INK} opacity="0.12" />

            {/* Face-brick wall with mortar joints */}
            <rect x="57" y="70" width="58" height="37" fill="#D6D3D1" stroke={INK} strokeWidth="1.5" />
            {WALL_BRICKS.map(([x, y, w, fill]) => (
              <g key={`${x}-${y}`}>
                <rect x={x} y={y} width={w} height="8" rx="0.8" fill={fill} stroke={INK} strokeWidth="1" />
                <line x1={x + 1.5} y1={y + 1.6} x2={x + w - 1.5} y2={y + 1.6} stroke="#FDBA74" strokeWidth="0.8" opacity="0.7" />
                <circle cx={x + w * 0.3} cy={y + 5} r="0.5" fill={INK} opacity="0.3" />
                <circle cx={x + w * 0.7} cy={y + 4} r="0.4" fill={INK} opacity="0.3" />
              </g>
            ))}

            {/* Spirit level resting on the top course */}
            <rect x="87" y="65" width="27" height="5.5" rx="1" fill="#FACC15" stroke={INK} strokeWidth="1.2" />
            <rect x="87" y="65" width="2.5" height="5.5" fill={INK} />
            <rect x="111.5" y="65" width="2.5" height="5.5" fill={INK} />
            <rect x="97" y="66.2" width="7" height="3" rx="1.5" fill="#BEF264" stroke={INK} strokeWidth="0.7" />
            <line x1="99.3" y1="66.2" x2="99.3" y2="69.2" stroke={INK} strokeWidth="0.4" />
            <line x1="101.7" y1="66.2" x2="101.7" y2="69.2" stroke={INK} strokeWidth="0.4" />
            <circle cx="100.5" cy="67.7" r="1" fill="#FFFFFF" className="artisan-level-bubble" />

            {/* Dropping brick with squash & stretch (Kinetic Group) */}
            <g className="artisan-brick-place">
              <rect x="67" y="71" width="18" height="8" rx="0.8" fill="#EA580C" stroke={INK} strokeWidth="1.1" />
              <line x1="68.5" y1="72.6" x2="83.5" y2="72.6" stroke="#FDBA74" strokeWidth="0.8" />
              <circle cx="72" cy="76" r="0.5" fill={INK} opacity="0.3" />
              <circle cx="80" cy="75" r="0.4" fill={INK} opacity="0.3" />
            </g>
            <g className="artisan-impact" stroke={INK} strokeWidth="1">
              <path d="M65 70 L62 67" />
              <path d="M64 73 L60 72.5" />
              <path d="M87 69 L89 66" />
            </g>

            {/* Mason: kneeling legs & boots */}
            <Limb points="30,88 38,101 18,102" color="#475569" width={7} />
            <rect x="8" y="97.5" width="12" height="9.5" rx="3" fill={BOOT} stroke={INK} strokeWidth="1.3" />
            <rect x="34" y="98" width="8" height="8" rx="2.5" fill="#F59E0B" stroke={INK} strokeWidth="1.2" />
            <Limb points="32,86 50,87 51,100" color="#475569" width={7} />
            <path d="M46 107 L46 102 Q46 99 49 99 L55 99 Q61 100 61 104 L61 107 Z" fill={BOOT} stroke={INK} strokeWidth="1.3" />
            <line x1="46" y1="107" x2="61" y2="107" stroke={INK} strokeWidth="2" />

            {/* Back arm resting on knee (behind body) */}
            <Limb points="30,64 36,78 46,83" color={SKIN} />
            <circle cx="47" cy="83.5" r="3.4" fill={GLOVE} stroke={INK} strokeWidth="1.2" />

            {/* Hi-vis vest with reflective bands */}
            <path d="M22 89 Q18 70 26 60 L42 60 Q50 70 46 89 Z" fill="#F97316" />
            <g clipPath="url(#artisan-mason-vest)">
              <rect x="15" y="70" width="40" height="3" fill="#E2E8F0" />
              <rect x="15" y="78" width="40" height="3" fill="#E2E8F0" />
            </g>
            <path d="M22 89 Q18 70 26 60 L42 60 Q50 70 46 89 Z" stroke={INK} strokeWidth="1.6" />
            <path d="M29 60 Q34 65 39 60 Z" fill="#1E3A8A" stroke={INK} strokeWidth="1" />
            <rect x="21" y="85" width="26" height="4" rx="1" fill="#78350F" stroke={INK} strokeWidth="1.2" />

            {/* Head: whistling while he works */}
            <g className="artisan-head-nod" style={{ transformOrigin: "36px 56px" }}>
              <rect x="33" y="50" width="6" height="10" fill={SKIN} stroke={INK} strokeWidth="1.2" />
              <circle cx="36" cy="44" r="12" fill={SKIN} stroke={INK} strokeWidth="1.6" />
              <path d="M30 33.6 A12 12 0 0 0 30 54.4 A3.5 10.4 0 0 1 30 33.6 Z" fill={SKIN_SHADE} opacity="0.55" />
              <path d="M24.5 40 L24.5 47 Q26 42 29 40 Z" fill={HAIR} />
              <circle cx="26" cy="46" r="3" fill={SKIN} stroke={INK} strokeWidth="1.2" />
              <path d="M26.5 44.5 Q25 46 26.5 47.5" stroke={INK} strokeWidth="0.7" />
              <circle cx="37" cy="54.5" r="0.4" fill={INK} opacity="0.5" />
              <circle cx="40" cy="53.5" r="0.4" fill={INK} opacity="0.5" />
              <circle cx="34" cy="53.8" r="0.4" fill={INK} opacity="0.5" />
              {/* White hard hat */}
              <path d="M23 39 Q23 26 36 26 Q49 26 49 39 Z" fill="#F8FAFC" stroke={INK} strokeWidth="1.6" />
              <path d="M36 26.5 V38" stroke="#CBD5E1" strokeWidth="2" />
              <circle cx="30" cy="33" r="1.8" fill="#16A34A" stroke={INK} strokeWidth="0.6" />
              <path d="M41 29 Q45 30 46.5 34" stroke="#FFFFFF" strokeWidth="1.4" />
              <rect x="21" y="37" width="34" height="3.5" rx="1.75" fill="#E2E8F0" stroke={INK} strokeWidth="1.3" />
              {/* Face */}
              <g className="artisan-blink" style={{ animationDelay: "1.7s" }}>
                <ellipse cx="39.5" cy="44.5" rx="2.5" ry="3.1" fill="#FFFFFF" stroke={INK} strokeWidth="1" />
                <ellipse cx="46" cy="44.5" rx="2.5" ry="3.1" fill="#FFFFFF" stroke={INK} strokeWidth="1" />
                <circle cx="40.4" cy="45" r="1.4" fill={INK} />
                <circle cx="46.9" cy="45" r="1.4" fill={INK} />
                <circle cx="40.9" cy="44.3" r="0.5" fill="#FFFFFF" />
                <circle cx="47.4" cy="44.3" r="0.5" fill="#FFFFFF" />
              </g>
              <path d="M37 40.3 Q39.5 38.8 42 40.1" stroke={INK} strokeWidth="1.2" />
              <path d="M44 40.1 Q46.3 39 48 40.3" stroke={INK} strokeWidth="1.2" />
              <path d="M48.5 46.5 Q51.6 48.5 48.8 50.5" fill={SKIN} stroke={INK} strokeWidth="1.2" />
              <path d="M41 51.8 Q45 49.3 49.5 51.8 Q48 54.3 45.2 52.9 Q42.5 54.3 41 51.8 Z" fill={HAIR} stroke={INK} strokeWidth="0.8" />
              <ellipse cx="46" cy="55.3" rx="1.3" ry="1.5" fill="#7F1D1D" stroke={INK} strokeWidth="0.8" />
              <ellipse cx="37.5" cy="50" rx="2.3" ry="1.4" fill={BLUSH} opacity="0.55" />
            </g>

            {/* Floating music notes */}
            <g className="artisan-note" fill={INK} stroke={INK} strokeWidth="1">
              <ellipse cx="56" cy="50" rx="1.8" ry="1.3" stroke="none" />
              <line x1="57.6" y1="50" x2="57.6" y2="43" />
              <path d="M57.6 43 Q60 44 60 46.5" fill="none" />
            </g>
            <g className="artisan-note" style={{ animationDelay: "1.2s" }} fill={INK} stroke={INK} strokeWidth="0.9">
              <ellipse cx="54" cy="47" rx="1.5" ry="1.1" stroke="none" />
              <line x1="55.4" y1="47" x2="55.4" y2="41" />
              <path d="M55.4 41 Q57.6 42 57.6 44" fill="none" />
            </g>

            {/* Trowel arm tapping the brick home */}
            <g className="artisan-trowel-tap" style={{ transformOrigin: "38px 64px" }}>
              <Limb points="38,64 48,74 56,71" color={SKIN} />
              <circle cx="38" cy="64.5" r="4.2" fill="#1E3A8A" stroke={INK} strokeWidth="1.2" />
              <Limb points="54,71.5 60,70" color="#B45309" width={2.4} />
              <path d="M60 70 L63 67.8" stroke={INK} strokeWidth="1.2" />
              <polygon points="62,66.8 77,69.4 62,72.4" fill="#CBD5E1" stroke={INK} strokeWidth="1" />
              <line x1="64" y1="68.4" x2="73" y2="69.3" stroke="#FFFFFF" strokeWidth="0.8" />
              <circle cx="56" cy="71" r="3.4" fill={GLOVE} stroke={INK} strokeWidth="1.2" />
            </g>
          </svg>

          <div className="mt-1.5 pt-1.5 border-t border-iron-200 flex items-center justify-between font-mono text-[9px]">
            <div className="flex items-center gap-1 text-iron-900 font-bold">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-none inline-block animate-pulse"></span>
              <span>// 02 · MASONRY [NHBRC #2940]</span>
            </div>
            <span className="text-brick-600 font-black">CLASS II MORTAR · PLUMB</span>
          </div>
        </div>
      </div>

      {/* 3. TILING VIGNETTE (Bottom-Left: bottom-8 left-12 hidden lg:block) */}
      <div className="artisan-vignette absolute bottom-8 left-12 hidden lg:block w-48 sm:w-56">
        <div className="bg-white/85 backdrop-blur-xs border-2 border-iron-950 p-2.5 shadow-brutal transition-all">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-auto"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Backdrop disc="#DBEAFE" />
            <ellipse cx="41" cy="107.5" rx="32" ry="2.5" fill={INK} opacity="0.12" />
            <ellipse cx="96" cy="107.5" rx="18" ry="2.5" fill={INK} opacity="0.12" />

            {/* Wooden crate stand */}
            <rect x="14" y="94" width="54" height="13" fill="#D97706" stroke={INK} strokeWidth="1.5" />
            <line x1="14" y1="98.3" x2="68" y2="98.3" stroke="#92400E" strokeWidth="0.8" />
            <line x1="14" y1="102.6" x2="68" y2="102.6" stroke="#92400E" strokeWidth="0.8" />
            <line x1="16" y1="105" x2="66" y2="96" stroke="#92400E" strokeWidth="1.2" />

            {/* Rail tile cutter */}
            <rect x="10" y="73" width="4" height="13" fill="#475569" stroke={INK} strokeWidth="1" />
            <rect x="68" y="73" width="4" height="13" fill="#475569" stroke={INK} strokeWidth="1" />
            <rect x="8" y="86" width="66" height="8" rx="2" fill="#2563EB" stroke={INK} strokeWidth="1.5" />
            {Array.from({ length: 14 }, (_, i) => (
              <line key={i} x1={14 + i * 4} y1="88.5" x2={14 + i * 4} y2={i % 2 ? 89.5 : 90.5} stroke="#FFFFFF" strokeWidth="0.5" />
            ))}
            <rect x="16" y="82" width="50" height="4" fill="#F8FAFC" stroke={INK} strokeWidth="1" />
            <line x1="17" y1="83.2" x2="65" y2="83.2" stroke="#93C5FD" strokeWidth="0.5" />
            <line x1="45" y1="82.4" x2="63" y2="82.4" stroke="#EF4444" strokeWidth="1" className="artisan-score-line" />
            <rect x="8" y="73" width="66" height="3" rx="1.5" fill="#CBD5E1" stroke={INK} strokeWidth="1.2" />
            <line x1="10" y1="73.9" x2="72" y2="73.9" stroke="#FFFFFF" strokeWidth="0.6" />

            {/* Sliding scoring carriage & lever (Kinetic Group) */}
            <g className="artisan-tile-glide">
              <Limb points="45,72 60,59" color="#DC2626" width={2.6} />
              <circle cx="61.5" cy="58" r="2.8" fill={INK} />
              <rect x="40" y="70" width="10" height="9" rx="1.5" fill="#DC2626" stroke={INK} strokeWidth="1.3" />
              <circle cx="45" cy="74.5" r="1" fill="#FACC15" stroke={INK} strokeWidth="0.4" />
              <rect x="43.5" y="79" width="3" height="2" fill="#475569" />
              <circle cx="45" cy="81" r="1.8" fill="#E2E8F0" stroke={INK} strokeWidth="0.8" />
              <path
                d="M41 80 L41.8 82.2 L44 83 L41.8 83.8 L41 86 L40.2 83.8 L38 83 L40.2 82.2 Z"
                fill="#FACC15"
                stroke={INK}
                strokeWidth="0.5"
                className="artisan-tile-spark"
              />
              <path
                d="M36 79.5 L36.5 81 L38 81.5 L36.5 82 L36 83.5 L35.5 82 L34 81.5 L35.5 81 Z"
                fill="#FACC15"
                stroke={INK}
                strokeWidth="0.4"
                className="artisan-tile-spark"
                style={{ animationDelay: "0.3s" }}
              />
            </g>

            {/* Tiler: kneeling legs & boots */}
            <Limb points="100,88 96,102 112,103" color="#059669" width={7} />
            <rect x="108" y="97.5" width="11" height="9.5" rx="3" fill={BOOT} stroke={INK} strokeWidth="1.3" />
            <rect x="92" y="98" width="8" height="8" rx="2.5" fill="#F59E0B" stroke={INK} strokeWidth="1.2" />
            <Limb points="94,86 80,88 80,100" color="#059669" width={7} />
            <path d="M86 107 L86 102 Q86 99 83 99 L77 99 Q71 100 71 104 L71 107 Z" fill={BOOT} stroke={INK} strokeWidth="1.3" />
            <line x1="71" y1="107" x2="86" y2="107" stroke={INK} strokeWidth="2" />

            {/* Far arm steadying the cutter (behind body) */}
            <Limb points="100,64 88,76 74,82" color={SKIN} width={4} />
            <circle cx="73" cy="82.5" r="3.2" fill={GLOVE} stroke={INK} strokeWidth="1.2" />

            {/* T-shirt & dungarees */}
            <path d="M86 88 Q82 70 88 60 L104 60 Q110 70 106 88 Z" fill="#FB7185" stroke={INK} strokeWidth="1.6" />
            <path d="M88 88 L88 71 Q88 69 90 69 L102 69 Q104 69 104 71 L104 88 Z" fill="#059669" stroke={INK} strokeWidth="1.3" />
            <Limb points="89.5,70 90.5,60.5" color="#059669" width={1.8} />
            <Limb points="102.5,70 101.5,60.5" color="#059669" width={1.8} />
            <circle cx="90" cy="71" r="1" fill="#FACC15" stroke={INK} strokeWidth="0.5" />
            <circle cx="102" cy="71" r="1" fill="#FACC15" stroke={INK} strokeWidth="0.5" />
            <rect x="92" y="74" width="8" height="5" rx="1" fill="#047857" stroke={INK} strokeWidth="1" />

            {/* Head: doek headwrap, safety goggles, sweat drop */}
            <g className="artisan-head-tilt" style={{ transformOrigin: "96px 54px" }}>
              <rect x="93" y="49" width="6" height="11" fill={SKIN} stroke={INK} strokeWidth="1.2" />
              <circle cx="96" cy="41" r="12" fill={SKIN} stroke={INK} strokeWidth="1.6" />
              <path d="M102 30.6 A12 12 0 0 1 102 51.4 A3.5 10.4 0 0 0 102 30.6 Z" fill={SKIN_SHADE} opacity="0.55" />
              <circle cx="107" cy="43" r="3" fill={SKIN} stroke={INK} strokeWidth="1.2" />
              <path d="M106.5 41.5 Q108 43 106.5 44.5" stroke={INK} strokeWidth="0.7" />
              <circle cx="107" cy="47.6" r="1.6" stroke="#EAB308" strokeWidth="1" />
              <ellipse cx="91" cy="22" rx="4.2" ry="2.6" transform="rotate(-25 91 22)" fill="#7C3AED" stroke={INK} strokeWidth="1.2" />
              <ellipse cx="101" cy="22" rx="4.2" ry="2.6" transform="rotate(25 101 22)" fill="#7C3AED" stroke={INK} strokeWidth="1.2" />
              <path d="M83 38 Q81 24 96 23 Q111 24 109 38 Q96 32 83 38 Z" fill="#7C3AED" stroke={INK} strokeWidth="1.5" />
              <circle cx="96" cy="23.5" r="2.2" fill="#6D28D9" stroke={INK} strokeWidth="1" />
              {[[89, 30], [95, 27], [101, 28.5], [105.5, 33], [92, 34], [99, 33]].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.9" fill="#FACC15" />
              ))}
              <path d="M84.5 37.5 Q96 34 108 37.5" stroke={INK} strokeWidth="1.4" />
              <rect x="83" y="34" width="8" height="4.5" rx="2" fill="#7DD3FC" stroke={INK} strokeWidth="1" />
              <line x1="85" y1="35.3" x2="87" y2="35.3" stroke="#FFFFFF" strokeWidth="0.8" />
              {/* Face: focused, eyes on the score line */}
              <g className="artisan-blink" style={{ animationDelay: "2.6s" }}>
                <ellipse cx="90" cy="44.5" rx="2.4" ry="3" fill="#FFFFFF" stroke={INK} strokeWidth="1" />
                <ellipse cx="96.5" cy="44.5" rx="2.4" ry="3" fill="#FFFFFF" stroke={INK} strokeWidth="1" />
                <circle cx="89.2" cy="45.6" r="1.4" fill={INK} />
                <circle cx="95.7" cy="45.6" r="1.4" fill={INK} />
                <circle cx="89.7" cy="44.9" r="0.5" fill="#FFFFFF" />
                <circle cx="96.2" cy="44.9" r="0.5" fill="#FFFFFF" />
              </g>
              <path d="M88 41.6 L87 40.6" stroke={INK} strokeWidth="0.8" />
              <path d="M94.5 41.6 L93.6 40.5" stroke={INK} strokeWidth="0.8" />
              <path d="M85 47 Q82.5 49.5 85.3 50.5" fill={SKIN} stroke={INK} strokeWidth="1.2" />
              <path d="M87.5 53 Q90.5 55.5 93.5 53" stroke={INK} strokeWidth="1.2" />
              <ellipse cx="99.5" cy="50" rx="2.3" ry="1.4" fill={BLUSH} opacity="0.55" />
              <path d="M83 39 Q81.4 41.8 83 42.5 Q84.6 41.8 83 39 Z" fill="#7DD3FC" stroke={INK} strokeWidth="0.7" className="artisan-sweat" />
            </g>

            {/* Near arm: two-joint arm tracking the lever handle */}
            <g className="artisan-tiler-upper" style={{ transformOrigin: "90px 62px" }}>
              <Limb points="90,62 76.3,65.1" color={SKIN} />
              <circle cx="90" cy="62.5" r="4.2" fill="#FB7185" stroke={INK} strokeWidth="1.2" />
              <g className="artisan-tiler-fore" style={{ transformOrigin: "76.3px 65.1px" }}>
                <Limb points="76.3,65.1 62,58" color={SKIN} />
                <circle cx="62" cy="58" r="3.5" fill={GLOVE} stroke={INK} strokeWidth="1.2" />
              </g>
            </g>
          </svg>

          <div className="mt-1.5 pt-1.5 border-t border-iron-200 flex items-center justify-between font-mono text-[9px]">
            <div className="flex items-center gap-1 text-iron-900 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none inline-block animate-pulse"></span>
              <span>// 03 · TILING &amp; FLOORING</span>
            </div>
            <span className="text-brick-600 font-black">0.5MM TOLERANCE · PORCELAIN</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArtisanCanvas;
