import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, AlertTriangle, Info, TrendingUp, TrendingDown, X } from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import { useThemeStore } from '../../store/themeStore';
import type { GraphNode, GraphLink } from '../../types';
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

// ── Force layout: runs until stable, returns positions fitted to viewport ──────
function computeLayout(nodes: GraphNode[], links: { source: string; target: string; totalAmount: number; circular: boolean }[], W: number, H: number): NodePos[] {
  if (nodes.length === 0) return [];
  const MARGIN = 80;
  const cx = W / 2, cy = H / 2;
  // Place victim at center, others on a circle
  const others = nodes.filter((n) => n.type !== 'victim');
  const victim = nodes.find((n) => n.type === 'victim');

  const pos: (NodePos & { vx: number; vy: number })[] = nodes.map((n, i) => {
    if (n.type === 'victim') return { id: n.id, x: cx, y: cy, vx: 0, vy: 0 };
    const idx = others.indexOf(n);
    const angle = others.length ? (idx / others.length) * 2 * Math.PI - Math.PI / 2 : 0;
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
    links.forEach((l) => {
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
  const { graphNodes, graphLinks } = useCaseStore();
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 700, h: 480 });
  const [positions, setPositions] = useState<NodePos[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const animRef = useRef<number>(0);

  // Node dragging state
  const draggingNode = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // ── Aggregate duplicate edges dynamically ─────────────────────────────────────
  const aggLinks = useMemo(() => {
    const map = new Map<string, { source: string; target: string; totalAmount: number; circular: boolean }>();
    graphLinks.forEach((l) => {
      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      const key = `${sId}||${tId}`;
      const ex = map.get(key);
      if (ex) {
        ex.totalAmount += l.amount;
        if (l.circular) ex.circular = true;
      } else {
        map.set(key, { source: sId, target: tId, totalAmount: l.amount, circular: !!l.circular });
      }
    });
    return Array.from(map.values());
  }, [graphLinks]);

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

  // ── Compute layout once container is measured or nodes/links change ───────────
  useEffect(() => {
    if (dims.w < 100 || graphNodes.length === 0) return;
    setPositions(computeLayout(graphNodes, aggLinks, dims.w, dims.h));
  }, [dims.w, dims.h, graphNodes, aggLinks]);

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
    if (graphNodes.length > 0) {
      setPositions(computeLayout(graphNodes, aggLinks, dims.w, dims.h));
    }
    setSelectedNode(null);
  }, [dims, graphNodes, aggLinks]);

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
      <div className={`flex items-center justify-center h-64 gap-2 text-sm font-medium ${isLight ? 'text-slate-600' : 'text-white/30'}`}>
        <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isLight ? 'border-slate-300 border-t-blue-600' : 'border-white/20 border-t-white/60'}`} />
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
        <span className={`text-xs italic ${isLight ? 'text-slate-600 font-medium' : 'text-white/30'}`}>
          Drag nodes to rearrange · Click a node to inspect
        </span>
        <div className={`ml-auto flex items-center gap-4 text-xs font-medium ${isLight ? 'text-slate-700' : 'text-white/40'}`}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#DC2626', boxShadow: '0 0 6px #DC262688' }} />
            {t('moneyTrail.suspicious')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            {t('moneyTrail.normal')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-8 border-t-2 border-dashed border-amber-500" />
            {t('moneyTrail.circular')}
          </span>
        </div>
      </div>

      {/* ── Two-column layout: Graph | Details panel ─────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* Graph */}
        <div
          ref={containerRef}
          className={`flex-1 overflow-hidden rounded-2xl border transition-all ${
            isLight ? 'bg-white border-slate-300 shadow-sm' : 'glass-card border-white/10'
          }`}
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
            {aggLinks.map((link, i) => {
              const src = posMap.get(link.source);
              const tgt = posMap.get(link.target);
              if (!src || !tgt) return null;

              const srcNode = graphNodes.find((n) => n.id === link.source);
              const tgtNode = graphNodes.find((n) => n.id === link.target);
              const rS = NODE_RADIUS[srcNode?.type || 'unknown'] || 22;
              const rT = NODE_RADIUS[tgtNode?.type || 'unknown'] || 22;

              // Offset parallel edges
              const sameDir = aggLinks.filter((l) => l.source === link.source && l.target === link.target);
              const revDir  = aggLinks.filter((l) => l.source === link.target && l.target === link.source);
              const hasRev  = revDir.length > 0;
              const idx     = sameDir.indexOf(link);
              const curve   = link.circular ? 0.25 : hasRev ? (idx % 2 === 0 ? 0.18 : -0.18) : 0;

              const d = edgePath(src.x, src.y, tgt.x, tgt.y, curve, rS + 2, rT + 8);

              return (
                <g key={`e-${i}`}>
                  {/* Wider invisible hit area */}
                  <path d={d} fill="none" stroke="transparent" strokeWidth="12" />
                  {/* Visible edge */}
                  <path
                    d={d}
                    fill="none"
                    stroke={link.circular ? '#F59E0B' : (isLight ? '#64748B' : 'rgba(148,163,184,0.45)')}
                    strokeWidth={link.circular ? 2 : Math.max(1.2, Math.min(link.totalAmount / 18000, 3))}
                    strokeDasharray={link.circular ? '7 5' : undefined}
                    markerEnd={`url(#${link.circular ? 'arr-circular' : 'arr-normal'})`}
                    style={{ transition: 'stroke 0.3s' }}
                  />
                  {/* Amount label */}
                  <text fontSize="9.5" fill={link.circular ? '#D97706' : (isLight ? '#0F172A' : 'rgba(255,255,255,0.7)')}
                    style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'Inter,sans-serif', fontWeight: 700 }}>
                    <textPath href={`#tp-${i}`} startOffset="50%" textAnchor="middle">
                      {formatINR(link.totalAmount)}
                    </textPath>
                  </text>
                  <path id={`tp-${i}`} d={d} fill="none" stroke="none" />
                </g>
              );
            })}

            {/* ── Nodes ──────────────────────────────────────────────────────── */}
            {graphNodes.map((node) => {
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
                    const w = Math.max(node.id.length * 6.8, 76);
                    const labelY = r + 7;
                    const h = labelLines.length > 1 ? 30 : 18;
                    return (
                      <g style={{ pointerEvents: 'none' }}>
                        <rect x={-w / 2} y={labelY} width={w} height={h} rx={6}
                          fill={isLight ? '#FFFFFF' : 'rgba(10,17,40,0.88)'}
                          stroke={isLight ? '#94A3B8' : 'rgba(255,255,255,0.15)'}
                          strokeWidth={isLight ? '1.2' : '0.5'}
                          style={{ filter: isLight ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.12))' : 'none' }} />
                        <text textAnchor="middle" y={labelY + 11.5} fontSize="9" fontWeight="800"
                          fill={isLight ? '#0F172A' : 'rgba(255,255,255,0.95)'}
                          style={{ fontFamily: 'Inter,sans-serif', userSelect: 'none' }}>
                          {labelLines[0]}
                        </text>
                        {labelLines[1] && (
                          <text textAnchor="middle" y={labelY + 23.5} fontSize="8" fontWeight="700"
                            fill={
                              isMule ? (isLight ? '#DC2626' : '#F87171') :
                              isVictim ? (isLight ? '#2563EB' : '#60A5FA') :
                              (isLight ? '#475569' : 'rgba(255,255,255,0.55)')
                            }
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
                className={`p-4 space-y-4 rounded-2xl border transition-all ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-md' : 'glass-modal border-white/15 text-white'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-white/40'}`}>
                      {t('moneyTrail.nodeDetails')}
                    </p>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-lg">{NODE_ICONS[selectedNode.type] || '?'}</span>
                      <span className={`font-mono text-sm font-black break-all leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {selectedNode.id}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/40'}`}>{selectedNode.bank}</span>
                  </div>
                  <button onClick={() => setSelectedNode(null)}
                    className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-white/40'}`}>
                    <X size={13} />
                  </button>
                </div>

                {/* Type badge */}
                <div>
                  {selectedNode.type === 'mule' && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${isLight ? 'text-red-700 bg-red-100 border-red-300' : 'text-red-400 border-red-400/30'}`}
                      style={!isLight ? { background: 'rgba(220,38,38,0.12)' } : undefined}>
                      <AlertTriangle size={10} /> {t('moneyTrail.muleAccount', 'Mule Account')}
                    </span>
                  )}
                  {selectedNode.type === 'victim' && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${isLight ? 'text-blue-700 bg-blue-100 border-blue-300' : 'text-blue-400 border-blue-400/30'}`}
                      style={!isLight ? { background: 'rgba(59,130,246,0.12)' } : undefined}>
                      <Info size={10} /> {t('moneyTrail.victim', 'Victim')}
                    </span>
                  )}
                  {selectedNode.type === 'beneficiary' && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${isLight ? 'text-orange-700 bg-orange-100 border-orange-300' : 'text-orange-400 border-orange-400/30'}`}
                      style={!isLight ? { background: 'rgba(234,88,12,0.12)' } : undefined}>
                      <AlertTriangle size={10} /> {t('moneyTrail.finalBeneficiary', 'Final Beneficiary')}
                    </span>
                  )}
                  {selectedNode.type === 'unknown' && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${isLight ? 'text-purple-700 bg-purple-100 border-purple-300' : 'text-purple-400 border-purple-400/30'}`}
                      style={!isLight ? { background: 'rgba(167,139,250,0.12)' } : undefined}>
                      {t('moneyTrail.unknownAccount', 'Unknown Account')}
                    </span>
                  )}
                </div>

                {/* Risk Score */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-white/40'}`}>{t('moneyTrail.riskScore')}</span>
                    <motion.span
                      key={selectedNode.riskScore}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-base font-black"
                      style={{ color: riskColor(selectedNode.riskScore) }}
                    >
                      {selectedNode.riskScore}
                      <span className={`text-xs font-normal ${isLight ? 'text-slate-400' : 'text-white/30'}`}>/100</span>
                    </motion.span>
                  </div>
                  <div className={`risk-bar-wrapper h-2.5 rounded-full ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
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
                  <div className="rounded-xl p-3 text-center transition-all"
                    style={{
                      background: isLight ? '#EFF6FF' : 'rgba(59,130,246,0.1)',
                      border: isLight ? '1px solid #BFDBFE' : '1px solid rgba(59,130,246,0.15)'
                    }}>
                    <TrendingDown size={14} className="text-blue-600 mx-auto mb-1" />
                    <div className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedNode.fanIn}</div>
                    <div className={`text-xs font-semibold mt-0.5 ${isLight ? 'text-blue-700' : 'text-white/40'}`}>{t('moneyTrail.fanIn')}</div>
                  </div>
                  <div className="rounded-xl p-3 text-center transition-all"
                    style={{
                      background: isLight ? '#FEF3C7' : 'rgba(245,158,11,0.1)',
                      border: isLight ? '1px solid #FDE68A' : '1px solid rgba(245,158,11,0.15)'
                    }}>
                    <TrendingUp size={14} className="text-amber-600 mx-auto mb-1" />
                    <div className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedNode.fanOut}</div>
                    <div className={`text-xs font-semibold mt-0.5 ${isLight ? 'text-amber-700' : 'text-white/40'}`}>{t('moneyTrail.fanOut')}</div>
                  </div>
                </div>

                {/* Bank */}
                <div className="rounded-lg px-3 py-2 text-sm transition-all"
                  style={{
                    background: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.04)',
                    border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255,255,255,0.06)'
                  }}>
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-white/40'}`}>{t('moneyTrail.bank')}: </span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white/80'}`}>{selectedNode.bank}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`p-5 text-center flex flex-col items-center gap-3 rounded-2xl border transition-all ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-sm' : 'glass-card border-white/10 text-white'
                }`}
                style={{ height: 480, justifyContent: 'center' }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{
                    background: isLight ? '#F1F5F9' : 'rgba(255,255,255,0.04)',
                    border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255,255,255,0.08)'
                  }}>
                  👆
                </div>
                <div>
                  <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white/60'}`}>{t('moneyTrail.clickNode', 'Click any node')}</p>
                  <p className={`text-xs font-medium mt-1 ${isLight ? 'text-slate-600' : 'text-white/30'}`}>{t('moneyTrail.clickNodeHint', 'to see account details, risk score & flow data')}</p>
                </div>
                <div className="mt-2 space-y-1.5 text-left w-full">
                  {graphNodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left font-mono ${
                        isLight ? 'hover:bg-slate-100 text-slate-800 font-bold' : 'hover:bg-white/08 text-white/60'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: NODE_COLORS[n.type] || '#94a3b8', boxShadow: n.type === 'mule' ? '0 0 5px #DC2626aa' : undefined }} />
                      <span className="truncate">{n.id}</span>
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
