'use client';

import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  layer: number;
  label?: string;
  pulsePhase: number;
}

interface Packet {
  sourceIndex: number;
  targetIndex: number;
  progress: number;
  speed: number;
  color: string;
}

export const TechVisualCanvas: React.FC<{ className?: string; interactive?: boolean }> = ({
  className = '',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      initNodes();
    };

    window.addEventListener('resize', handleResize);

    // Node setup
    let nodes: Node[] = [];
    let packets: Packet[] = [];
    const mouse = { x: -1000, y: -1000, isHovering: false };

    const labels = [
      'Data Ingestion',
      'Orchestration',
      'Clinical Interface',
      'Integration Gateway',
      'Security Policy',
      'Workflow Engine',
      'Analytics API',
      'Repository',
    ];

    const initNodes = () => {
      nodes = [];
      packets = [];
      const nodeCount = width < 640 ? 12 : 22;

      // Layered columns distribution
      const columns = 4;
      for (let i = 0; i < nodeCount; i++) {
        const col = i % columns;
        const colX = (width * 0.12) + (col * (width * 0.76) / (columns - 1));
        const colNodes = Math.ceil(nodeCount / columns);
        const rowInCol = Math.floor(i / columns);
        const rowY = (height * 0.15) + (rowInCol * (height * 0.7) / Math.max(1, colNodes - 1)) + (Math.random() * 20 - 10);

        const r = Math.random() * 2 + 2.5;
        nodes.push({
          x: Math.max(20, Math.min(width - 20, colX + (Math.random() * 30 - 15))),
          y: Math.max(20, Math.min(height - 20, rowY)),
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: r,
          baseRadius: r,
          layer: col,
          label: i < labels.length ? labels[i] : undefined,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      // Initial packets
      for (let i = 0; i < 7; i++) {
        spawnPacket();
      }
    };

    const spawnPacket = () => {
      if (nodes.length < 2) return;
      const s = Math.floor(Math.random() * nodes.length);
      // Find connected target in adjacent or forward layer
      const validTargets = nodes
        .map((n, idx) => ({ idx, dist: Math.hypot(n.x - nodes[s].x, n.y - nodes[s].y), layerDiff: n.layer - nodes[s].layer }))
        .filter(t => t.idx !== s && t.dist < (width < 640 ? 120 : 180));

      if (validTargets.length > 0) {
        const target = validTargets[Math.floor(Math.random() * validTargets.length)];
        packets.push({
          sourceIndex: s,
          targetIndex: target.idx,
          progress: 0,
          speed: 0.006 + Math.random() * 0.008,
          color: Math.random() > 0.4 ? '#0284c7' : '#2563eb',
        });
      }
    };

    initNodes();

    // Mouse movement
    const onMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.isHovering = true;
    };

    const onMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.isHovering = false;
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle background coordinates grid
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.035)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;
        node.pulsePhase += 0.03;

        // Soft bounce within boundary
        if (node.x < 15 || node.x > width - 15) node.vx *= -1;
        if (node.y < 15 || node.y > height - 15) node.vy *= -1;

        // Mouse interaction
        if (mouse.isHovering) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100) {
            const force = (100 - dist) / 100;
            node.x -= (dx / dist) * force * 1.2;
            node.y -= (dy / dist) * force * 1.2;
            node.radius = node.baseRadius + force * 2;
          } else {
            node.radius = node.baseRadius;
          }
        }
      }

      // Draw Connections
      const maxDistance = width < 640 ? 110 : 160;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.28;
            ctx.strokeStyle = `rgba(30, 58, 138, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // Update & Draw Packets (Data flow)
      if (Math.random() < 0.05 && packets.length < 12) {
        spawnPacket();
      }

      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;

        if (p.progress >= 1) {
          packets.splice(i, 1);
          continue;
        }

        const source = nodes[p.sourceIndex];
        const target = nodes[p.targetIndex];
        if (!source || !target) {
          packets.splice(i, 1);
          continue;
        }

        const px = source.x + (target.x - source.x) * p.progress;
        const py = source.y + (target.y - source.y) * p.progress;

        // Packet tail / glow
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const pulse = Math.sin(node.pulsePhase) * 0.5 + 0.5;

        // Outer halo
        ctx.fillStyle = `rgba(2, 132, 199, ${0.08 + pulse * 0.1})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 4 + pulse * 3, 0, Math.PI * 2);
        ctx.fill();

        // Node circle
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Core dot
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Subtle labels on prominent nodes on larger screens
        if (node.label && width > 768 && i % 3 === 0) {
          ctx.font = '500 10px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(71, 85, 105, 0.75)';
          ctx.fillText(node.label, node.x + 8, node.y - 6);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [interactive]);

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[300px] overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-crosshair" />
      
      {/* Precision status indicator badge in top right */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/90 backdrop-blur-md border border-slate-200 text-xs font-mono text-slate-700 shadow-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Architecture Stream // Live</span>
      </div>

      {/* Subtle bottom legend */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 text-[11px] font-mono text-slate-500 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-sky-600 bg-white" /> Node
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-600 rounded-full" /> Flow Vector
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-sm" /> In-Transit Packet
        </span>
      </div>
    </div>
  );
};
