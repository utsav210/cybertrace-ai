import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, AlertTriangle, Info, TrendingUp, TrendingDown, X } from 'lucide-react';
import { GRAPH_NODES, GRAPH_LINKS } from '../../data/mockData';
import type { GraphNode } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ──────────────────────────────────────────────────────────────────────
interface NodePos { id: string; x: number; y: number }

// ── Constants ──────────────────────────────────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  victim: '#3b82f6',
  mule: '#DC2626',
  beneficiary: '#ea580c',
  unknown: '#a78bfa',
};
const NODE_ICONS: Record<string, string> = {
  victim: '👤', mule: '⚠️', beneficiary: '🏦', unknown: '❓',
};
const NODE_RADIUS: Record<string, number> = {
  victim: 26, mule: 28, beneficiary: 22, unknown: 20,
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const riskColor = (s: number) => s >= 75 ? '#DC2626' : s >= 50 ? '#F59E0B' : '#10B981';

// ── Aggregate duplicate edges ──────────────────────────────────────────────────
const AGG_LINKS = (() => {
  const map = new Map<string, { source: string; target: string; totalAmount: number; circular: boolean }>();
  GRAPH_LINKS.forEach((l) => {
    const key = `${l.source}||${l.target}`;
    const ex = map.get(key);
    if (ex) { ex.totalAmount += l.amount; if (l.circular) ex.circular = true; }
    else map.set(key, { source: l.source, target: l.target, totalAmount: l.amount, circular: !!l.circular });
  });
  return Array.from(map.values());
})();

// ── Force layout: runs until stable, returns positions fitted to viewport ──────
function computeLayout(W: number, H: number): NodePos[] {
  const MARGIN = 80;
  const cx = W / 2, cy = H / 2;
  // Place victim at center, others on a circle
  const others = GRAPH_NODES.filter((n) => n.type !== 'victim');
  const victim = GRAPH_NODES.find((n) => n.type === 'victim');

  const pos: (NodePos & { vx: number; vy: number })[] = GRAPH_NODES.map((n, i) => {
    if (n.type === 'victim') return { id: n.id, x: cx, y: cy, vx: 0, vy: 0 };
    const idx = others.indexOf(n);
    const angle = (idx / others.length) * 2 * Math.PI - Math.PI / 2;
    const r = Math.min(W, H) * 0.3;
    return { id: n.id, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), vx: 0, vy: 0 };
  });

  const posMap = new Map(pos.map((p) => [p.id, p]));

  for (let iter = 0; iter < 250; iter++) {
    const alpha = 0.25 * Math.pow(0.98, iter);

    // Repulsion
    for (let a = 0; a < pos.length; a++) {
      for (let b = a + 1; b < pos.length; b++) {
        const pa = pos[a], pb = pos[b];
        const dx = pa.x - pb.x, dy = pa.y - pb.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (2500 / (d * d)) * alpha;
        pa.vx += (dx / d) * f; pa.vy += (dy / d) * f;
        pb.vx -= (dx / d) * f; pb.vy -= (dy / d) * f;
      }
    }

    // Link attraction
    AGG_LINKS.forEach((l) => {
      const s = posMap.get(l.source), t = posMap.get(l.target);
      if (!s || !t) return;
      const dx = t.x - s.x, dy = t.y - s.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const ideal = 160;
      const f = ((d - ideal) / d) * alpha * 0.5;
      s.vx += dx * f; s.vy += dy * f;
      t.vx -= dx * f; t.vy -= dy * f;
    });

    // Center gravity
    pos.forEach((p) => {
      p.vx += (cx - p.x) * 0.008 * alpha;
      p.vy += (cy - p.y) * 0.008 * alpha;
    });

    // Integrate
    pos.forEach((p) => {
      p.vx *= 0.8; p.vy *= 0.8;
      p.x = Math.max(MARGIN, Math.min(W - MARGIN, p.x + p.vx));
      p.y = Math.max(MARGIN, Math.min(H - MARGIN, p.y + p.vy));
    });
  }

  // Auto-fit: scale & center to fill viewport with padding
  const xs = pos.map((p) => p.x), ys = pos.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const bW = maxX - minX || 1, bH = maxY - minY || 1;
  const PAD = 100;
  const scale = Math.min((W - PAD * 2) / bW, (H - PAD * 2) / bH, 1.2);
  const offX = (W - bW * scale) / 2 - minX * scale;
  const offY = (H - bH * scale) / 2 - minY * scale;

  return pos.map((p) => ({ id: p.id, x: p.x * scale + offX, y: p.y * scale + offY }));
}

// ── Curved SVG path between two points ────────────────────────────────────────
function edgePath(sx: number, sy: number, tx: number, ty: number, curve: number, rSrc: number, rTgt: number) {
  const dx = tx - sx, dy = ty - sy;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / d, ny = dy / d;
  const ax = sx + nx * rSrc, ay = sy + ny * rSrc;
  const bx = tx - nx * rTgt, by = ty - ny * rTgt;
  if (Math.abs(curve) < 0.01) return `M ${ax} ${ay} L ${bx} ${by}`;
  const mx = (ax + bx) / 2 - curve * (by - ay);
  const my = (ay + by) / 2 + curve * (bx - ax);
  return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export const MoneyTrailTab: React.FC = () => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 700, h: 480 });
  const [positions, setPositions] = useState<NodePos[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const animRef = useRef<number>(0);

  // Node dragging state
  const draggingNode = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // ── Measure container ────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setDims({ w: Math.max(r.width, 400), h: 480 });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Compute layout once container is measured ────────────────────────────────
  useEffect(() => {
    if (dims.w < 100) return;
    setPositions(computeLayout(dims.w, dims.h));
  }, [dims.w, dims.h]);

  // ── Pulse animation loop ─────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => { setTick((t) => t + 1); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const pulseR   = 8 + 6 * Math.abs(Math.sin(tick * 0.05));
  const pulseOp  = 0.35 + 0.45 * Math.abs(Math.sin(tick * 0.05));

  const posMap = new Map(positions.map((p) => [p.id, p]));

  // ── Fit view ─────────────────────────────────────────────────────────────────
  const fitView = useCallback(() => {
    setPositions(computeLayout(dims.w, dims.h));
    setSelectedNode(null);
  }, [dims]);

  // ── SVG pointer events for node dragging ─────────────────────────────────────
  const svgRef = useRef<SVGSVGElement>(null);

  const getGraphXY = (e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onNodePointerDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const pos = posMap.get(nodeId);
    if (!pos) return;
    const { x, y } = getGraphXY(e);
    draggingNode.current = { id: nodeId, offsetX: x - pos.x, offsetY: y - pos.y };
  };

  const onSvgMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode.current) return;
    const { x, y } = getGraphXY(e);
    const { id, offsetX, offsetY } = draggingNode.current;
    setPositions((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, x: Math.max(40, Math.min(dims.w - 40, x - offsetX)), y: Math.max(40, Math.min(dims.h - 40, y - offsetY)) }
          : p
      )
    );
  };

  const onSvgMouseUp = (e: React.MouseEvent) => {
    // If we weren't dragging much, treat as click
    draggingNode.current = null;
  };

  const onNodeClick = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  };

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-white/30 text-sm">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        Building graph…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={fitView} className="btn-primary">
          <Maximize2 size={14} /> {t('moneyTrail.fitView')}
        </button>
        <span className="text-xs text-white/30 italic">Drag nodes to rearrange · Click a node to inspect</span>
        <div className="ml-auto flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#DC2626', boxShadow: '0 0 6px #DC262688' }} />
            {t('moneyTrail.suspicious')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            {t('moneyTrail.normal')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-8 border-t-2 border-dashed border-amber-400" />
            {t('moneyTrail.circular')}
          </span>
        </div>
      </div>

      {/* ── Two-column layout: Graph | Details panel ─────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* Graph */}
        <div
          ref={containerRef}
          className="flex-1 glass-card overflow-hidden"
          style={{ height: 480, minWidth: 0 }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ display: 'block', cursor: draggingNode.current ? 'grabbing' : 'default' }}
            onMouseMove={onSvgMouseMove}
            onMouseUp={onSvgMouseUp}
            onMouseLeave={onSvgMouseUp}
          >
            <defs>
              <marker id="arr-normal" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L7,3.5 z" fill="rgba(148,163,184,0.75)" />
              </marker>
              <marker id="arr-circular" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L7,3.5 z" fill="#F59E0B" />
              </marker>
              <filter id="f-glow-red" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="f-glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="f-glow-sel" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* ── Edges ──────────────────────────────────────────────────────── */}
            {AGG_LINKS.map((link, i) => {
              const src = posMap.get(link.source);
              const tgt = posMap.get(link.target);
              if (!src || !tgt) return null;

              const srcNode = GRAPH_NODES.find((n) => n.id === link.source);
              const tgtNode = GRAPH_NODES.find((n) => n.id === link.target);
              const rS = NODE_RADIUS[srcNode?.type || 'unknown'] || 22;
              const rT = NODE_RADIUS[tgtNode?.type || 'unknown'] || 22;

              // Offset parallel edges
              const sameDir = AGG_LINKS.filter((l) => l.source === link.source && l.target === link.target);
              const revDir  = AGG_LINKS.filter((l) => l.source === link.target && l.target === link.source);
              const hasRev  = revDir.length > 0;
              const idx     = sameDir.indexOf(link);
              const curve   = link.circular ? 0.25 : hasRev ? (idx % 2 === 0 ? 0.18 : -0.18) : 0;

              const d = edgePath(src.x, src.y, tgt.x, tgt.y, curve, rS + 2, rT + 8);
              const mid = edgePath(src.x, src.y, tgt.x, tgt.y, curve, rS + 2, rT + 8);

              return (
                <g key={`e-${i}`}>
                  {/* Wider invisible hit area */}
                  <path d={d} fill="none" stroke="transparent" strokeWidth="12" />
                  {/* Visible edge */}
                  <path
                    d={d}
                    fill="none"
                    stroke={link.circular ? '#F59E0B' : 'rgba(148,163,184,0.45)'}
                    strokeWidth={link.circular ? 2 : Math.max(1.2, Math.min(link.totalAmount / 18000, 3))}
                    strokeDasharray={link.circular ? '7 5' : undefined}
                    markerEnd={`url(#${link.circular ? 'arr-circular' : 'arr-normal'})`}
                    style={{ transition: 'stroke 0.3s' }}
                  />
                  {/* Amount label */}
                  <text fontSize="9" fill={link.circular ? '#F59E0B' : 'rgba(255,255,255,0.5)'}
                    style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>
                    <textPath href={`#tp-${i}`} startOffset="50%" textAnchor="middle">
                      {formatINR(link.totalAmount)}
                    </textPath>
                  </text>
                  <path id={`tp-${i}`} d={d} fill="none" stroke="none" />
                </g>
              );
            })}

            {/* ── Nodes ──────────────────────────────────────────────────────── */}
            {GRAPH_NODES.map((node) => {
              const pos = posMap.get(node.id);
              if (!pos) return null;
              const color    = NODE_COLORS[node.type] || '#94a3b8';
              const r        = NODE_RADIUS[node.type] || 22;
              const isMule   = node.type === 'mule';
              const isVictim = node.type === 'victim';
              const isSel    = selectedNode?.id === node.id;
              const isHov    = hoveredId === node.id;
              const labelLines = [node.id, node.label.split('\n')[1] || ''].filter(Boolean);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  style={{ cursor: 'grab' }}
                  onMouseDown={(e) => onNodePointerDown(e, node.id)}
                  onClick={(e) => onNodeClick(e, node)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Pulsing danger ring for mule nodes */}
                  {isMule && (
                    <>
                      <circle r={r + pulseR} fill="none" stroke="#DC2626" strokeWidth="1.5"
                        opacity={pulseOp} style={{ filter: 'url(#f-glow-red)' }} />
                      <circle r={r + pulseR * 0.5} fill="none" stroke="#DC2626" strokeWidth="0.8"
                        opacity={pulseOp * 0.5} />
                    </>
                  )}

                  {/* Selection glow */}
                  {isSel && (
                    <circle r={r + 10} fill={`${color}18`} stroke="#F59E0B"
                      strokeWidth="2.5" opacity={0.9} style={{ filter: 'url(#f-glow-sel)' }} />
                  )}

                  {/* Hover ring */}
                  {isHov && !isSel && (
                    <circle r={r + 7} fill={`${color}15`} stroke={color} strokeWidth="1.5" opacity={0.6} />
                  )}

                  {/* Main circle */}
                  <circle
                    r={r}
                    fill={color}
                    stroke={isMule ? '#ff6b6b' : isVictim ? '#60a5fa' : `${color}cc`}
                    strokeWidth={isMule ? 2.5 : 1.5}
                    style={{
                      filter: isMule ? 'url(#f-glow-red)' : isVictim ? 'url(#f-glow-blue)' : 'none',
                      transition: 'fill 0.2s',
                    }}
                  />

                  {/* Inner shine */}
                  <ellipse cx={-r * 0.22} cy={-r * 0.25} rx={r * 0.38} ry={r * 0.28}
                    fill="rgba(255,255,255,0.2)" style={{ pointerEvents: 'none' }} />

                  {/* Icon */}
                  <text textAnchor="middle" dominantBaseline="middle"
                    fontSize={r * 0.85} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {NODE_ICONS[node.type] || '?'}
                  </text>

                  {/* Label pill below */}
                  {(() => {
                    const w = Math.max(node.id.length * 6.2, 72);
                    const labelY = r + 7;
                    const h = labelLines.length > 1 ? 28 : 16;
                    return (
                      <g style={{ pointerEvents: 'none' }}>
                        <rect x={-w / 2} y={labelY} width={w} height={h} rx={5}
                          fill="rgba(10,17,40,0.82)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                        <text textAnchor="middle" y={labelY + 10.5} fontSize="8.5" fontWeight="bold"
                          fill="rgba(255,255,255,0.92)"
                          style={{ fontFamily: 'Inter,sans-serif', userSelect: 'none' }}>
                          {labelLines[0]}
                        </text>
                        {labelLines[1] && (
                          <text textAnchor="middle" y={labelY + 22} fontSize="7.5"
                            fill="rgba(255,255,255,0.45)"
                            style={{ fontFamily: 'Inter,sans-serif', userSelect: 'none' }}>
                            {labelLines[1]}
                          </text>
                        )}
                      </g>
                    );
                  })()}
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Details Panel (right column, always visible) ──────────────────── */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, x: 16, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="glass-modal p-4 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1">
                      {t('moneyTrail.nodeDetails')}
                    </p>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-lg">{NODE_ICONS[selectedNode.type] || '?'}</span>
                      <span className="font-mono text-sm font-bold text-white break-all leading-tight">
                        {selectedNode.id}
                      </span>
                    </div>
                    <span className="text-xs text-white/40">{selectedNode.bank}</span>
                  </div>
                  <button onClick={() => setSelectedNode(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
                    <X size={13} className="text-white/40" />
                  </button>
                </div>

                {/* Type badge */}
                <div>
                  {selectedNode.type === 'mule' && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-400 px-2.5 py-1 rounded-full border border-red-400/30"
                      style={{ background: 'rgba(220,38,38,0.12)' }}>
                      <AlertTriangle size={10} /> Mule Account
                    </span>
                  )}
                  {selectedNode.type === 'victim' && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-400 px-2.5 py-1 rounded-full border border-blue-400/30"
                      style={{ background: 'rgba(59,130,246,0.12)' }}>
                      <Info size={10} /> Victim
                    </span>
                  )}
                  {selectedNode.type === 'beneficiary' && (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-400 px-2.5 py-1 rounded-full border border-orange-400/30"
                      style={{ background: 'rgba(234,88,12,0.12)' }}>
                      <AlertTriangle size={10} /> Final Beneficiary
                    </span>
                  )}
                  {selectedNode.type === 'unknown' && (
                    <span className="inline-flex items-center gap-1 text-xs text-purple-400 px-2.5 py-1 rounded-full border border-purple-400/30"
                      style={{ background: 'rgba(167,139,250,0.12)' }}>
                      Unknown Account
                    </span>
                  )}
                </div>

                {/* Risk Score */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/40">{t('moneyTrail.riskScore')}</span>
                    <motion.span
                      key={selectedNode.riskScore}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-base font-black"
                      style={{ color: riskColor(selectedNode.riskScore) }}
                    >
                      {selectedNode.riskScore}
                      <span className="text-xs font-normal text-white/30">/100</span>
                    </motion.span>
                  </div>
                  <div className="risk-bar-wrapper h-2.5 rounded-full">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedNode.riskScore}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      style={{
                        background: `linear-gradient(90deg, ${riskColor(selectedNode.riskScore)}, ${riskColor(selectedNode.riskScore)}66)`,
                        boxShadow: `0 0 8px ${riskColor(selectedNode.riskScore)}55`,
                      }}
                    />
                  </div>
                </div>

                {/* Fan-in / Fan-out */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <TrendingDown size={14} className="text-blue-400 mx-auto mb-1" />
                    <div className="text-xl font-black text-white">{selectedNode.fanIn}</div>
                    <div className="text-xs text-white/40 mt-0.5">{t('moneyTrail.fanIn')}</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <TrendingUp size={14} className="text-amber-400 mx-auto mb-1" />
                    <div className="text-xl font-black text-white">{selectedNode.fanOut}</div>
                    <div className="text-xs text-white/40 mt-0.5">{t('moneyTrail.fanOut')}</div>
                  </div>
                </div>

                {/* Bank */}
                <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs text-white/40">{t('moneyTrail.bank')}: </span>
                  <span className="text-white/80 font-medium">{selectedNode.bank}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-5 text-center flex flex-col items-center gap-3"
                style={{ height: 480, justifyContent: 'center' }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  👆
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/50">Click any node</p>
                  <p className="text-xs text-white/25 mt-1">to see account details,<br />risk score & flow data</p>
                </div>
                <div className="mt-2 space-y-1.5 text-left w-full">
                  {GRAPH_NODES.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all hover:bg-white/08 text-left"
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: NODE_COLORS[n.type] || '#94a3b8', boxShadow: n.type === 'mule' ? '0 0 5px #DC2626aa' : undefined }} />
                      <span className="font-mono text-white/60 truncate">{n.id}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
