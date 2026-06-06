import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Compass, Volume2, Globe, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import SideRays from './SideRays';

interface InteractiveStoryProps {
  onClose?: () => void;
  lang?: 'zh' | 'en';
}

export const InteractiveStory: React.FC<InteractiveStoryProps> = ({ onClose, lang = 'zh' }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [rayConfig, setRayConfig] = useState({
    speed: 2.0,
    rayColor1: '#EAB308',
    rayColor2: '#3b82f6',
    spread: 2.2,
    blend: 0.7,
    intensity: 1.8,
  });
  const [pointerPos, setPointerPos] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Chapters representing the creative storytelling architecture
  const chapters = [
    {
      id: 'origin',
      titleZh: '起源 · 逆影中流转',
      titleEn: 'Orgin • Shifting Space',
      subtitleZh: '故事如何在体验的核心闪耀？',
      subtitleEn: 'How does storytelling shine at the core of experience?',
      descZh: '在不断流转、变迁的世界中，星河科技创新协会汇聚了敢于颠覆的探索者。我们以光作为探索的眼睛，在深邃的信息原野中破土而生。',
      descEn: 'In a world that is constantly shifting, the Xinghe Association brings together brave pioneers. We use light as our eyes to navigate and flourish in the endless fields of science and security.',
      accentLabel: '光 (Light)',
      color1: '#F59E0B',
      color2: '#EC4899',
      bgGradient: 'from-pink-950/30 via-slate-950 to-amber-950/20'
    },
    {
      id: 'cohesion',
      titleZh: '凝聚 · 虚实星轨间',
      titleEn: 'Cohesion • Orbital Spirit',
      subtitleZh: '是什么引领着我们不断突破边界？',
      subtitleEn: 'What guides us to constantly breach the boundaries?',
      descZh: '在未知的广袤空间，是追求极致与安全的团队精神，将每一颗零散的星斗汇聚成有条不紊的运行星轨，将不懈的研究与创新固化成永恒的安全防线。',
      descEn: 'Across the vast fields of the unknown, the spirit of safety, precision, and collaboration aligns sparse stardust into perfect orbits, forging persistent defenses with every algorithmic iteration.',
      accentLabel: '精神 (Spirit)',
      color1: '#10B981',
      color2: '#06B6D4',
      bgGradient: 'from-emerald-950/30 via-slate-950 to-indigo-950/20'
    },
    {
      id: 'resonance',
      titleZh: '鸣响 · 视听微波里',
      titleEn: 'Resonance • Interactive Pulse',
      subtitleZh: '让体验触达感官的最底层。',
      subtitleEn: 'Letting experiences resonate deep within.',
      descZh: '故事不只是文字，更是指尖下的跳动音符与呼吸律动。点击这里触发全息音频脉冲，倾听由合成振荡器为您带来的星辰静谧鸣响。',
      descEn: 'Storytelling is far more than static words. It is the rhythmic pulse under your fingertips. Click to release holographic wave pulses, listening to synthesized solar sweeps calling from deep code space.',
      accentLabel: '音效 (Sound)',
      color1: '#8B5CF6',
      color2: '#3B82F6',
      bgGradient: 'from-purple-950/30 via-slate-950 to-blue-950/20'
    },
    {
      id: 'future',
      titleZh: '烈焰 · 火星聚星河',
      titleEn: 'Flame • Spark of Future',
      subtitleZh: '星火燎原，安全与未来同行。',
      subtitleEn: 'Sparks ignite, shaping the secure future.',
      descZh: '每一次指尖的触碰和点击，都是通往星河的第一步。我们用全感官的交互与极致的创意，将一颗创新的种子，浇灌出震撼的技术艺术之春。',
      descEn: 'Every slide, interaction, and hover is the initial step toward our galaxy. With immersive interfaces and safety science breakthroughs, we turn an engineering spark into a cosmic flame.',
      accentLabel: '探索 (Forge)',
      color1: '#EF4444',
      color2: '#F59E0B',
      bgGradient: 'from-red-950/35 via-slate-950 to-orange-950/25'
    }
  ];

  // Mouse move listener to update coordinates for canvas and rays
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPointerPos({ x, y });

    // Update side rays factors dynamically based on mouse
    setRayConfig(prev => ({
      ...prev,
      intensity: 1.4 + x * 1.5,
      spread: 1.5 + y * 2.0,
      blend: 0.4 + (x + y) * 0.25
    }));
  };

  // Switch chapters
  const nextChapter = () => {
    playSynthSound(300 + currentChapter * 150, 'triangle');
    setCurrentChapter((prev) => (prev + 1) % chapters.length);
  };

  const prevChapter = () => {
    playSynthSound(250 + currentChapter * 120, 'sine');
    setCurrentChapter((prev) => (prev - 1 + chapters.length) % chapters.length);
  };

  // Web Audio Synth for rich, cinematic feel on interaction
  const playSynthSound = (frequency = 440, type: OscillatorType = 'sine', sweepMultiplier = 1.6) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * sweepMultiplier, ctx.currentTime + 1.4);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.warn('Web Audio plays disabled or blocked by browser gesture bounds.');
    }
  };

  // Interactive Accent Trigger (Light Flash / Ripple / Sound pulse)
  const triggerAccentAction = () => {
    if (currentChapter === 0) {
      // Light superflare
      setRayConfig(prev => ({ ...prev, intensity: 4.8, speed: 6.0 }));
      playSynthSound(880, 'sine', 2.0);
      setTimeout(() => {
        setRayConfig(prev => ({ ...prev, intensity: 1.8, speed: 2.0 }));
      }, 800);
    } else if (currentChapter === 1) {
      // Quantum sweep sound + rotation twist
      setRayConfig(prev => ({ ...prev, spread: 4.5 }));
      playSynthSound(180, 'sawtooth', 3.0);
      setTimeout(() => {
        setRayConfig(prev => ({ ...prev, spread: 2.2 }));
      }, 600);
    } else if (currentChapter === 2) {
      // Direct electronic resonance music melody block!
      playSynthSound(523.25, 'triangle', 1.0); // C5
      setTimeout(() => playSynthSound(587.33, 'triangle', 1.1), 150); // D5
      setTimeout(() => playSynthSound(659.25, 'triangle', 1.2), 300); // E5
      setTimeout(() => playSynthSound(783.99, 'triangle', 1.3), 450); // G5
    } else {
      // Future hyper warp
      setRayConfig(prev => ({ ...prev, intensity: 4.0, spread: 5.0 }));
      playSynthSound(120, 'sine', 8.0);
      setTimeout(() => {
        setRayConfig(prev => ({ ...prev, intensity: 1.8, spread: 2.2 }));
      }, 1000);
    }
  };

  // Rendering background dynamic particles on canvas mimicking fluid structures
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const activeChConfig = chapters[currentChapter];
    const pCount = 35;
    const particles = Array.from({ length: pCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random() * 4,
      angle: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.8,
      opacity: 0.15 + Math.random() * 0.4,
      hueOffset: Math.random() * 30
    }));

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Light background ambient dust fields
      particles.forEach((p, idx) => {
        p.angle += 0.005;
        // Gravity attraction towards mouse/pointerPos
        const targetX = pointerPos.x * width;
        const targetY = pointerPos.y * height;
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 400) {
          p.x += (dx / dist) * 0.45;
          p.y += (dy / dist) * 0.45;
        }

        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        // Wall padding loop boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Custom pulsing sizing
        const pulse = 0.85 + Math.sin(time * 0.003 + idx) * 0.15;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = activeChConfig.id === 'origin' ? `rgba(245, 158, 11, ${p.opacity})` :
                        activeChConfig.id === 'cohesion' ? `rgba(16, 185, 129, ${p.opacity})` :
                        activeChConfig.id === 'resonance' ? `rgba(139, 92, 246, ${p.opacity})` :
                        `rgba(239, 68, 68, ${p.opacity})`;
        ctx.fill();
        ctx.restore();
      });

      // Complex morphing mathematical central graphic elements (interactive glass feather / constellation loops)
      const centerX = width / 2;
      const centerY = height / 3;
      const rOuter = Math.min(width, height) * 0.13;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(time * 0.0004);

      if (activeChConfig.id === 'origin') {
        // Beautiful overlapping morphic golden petals (Feather wing shape structure)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 1.0;
        const petalCount = 8;
        for (let i = 0; i < petalCount; i++) {
          ctx.rotate((Math.PI * 2) / petalCount);
          ctx.beginPath();
          const wobble = Math.sin(time * 0.002 + i) * 12;
          ctx.ellipse(0, 0, rOuter + wobble, (rOuter * 0.35) + wobble / 3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (activeChConfig.id === 'cohesion') {
        // Dynamic nested orbit shells conforming with orbital spirit
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = 1.0;
        const ringSec = 4;
        for (let r = 1; r <= ringSec; r++) {
          ctx.beginPath();
          const rx = rOuter * (r * 0.4);
          const ry = rOuter * (r * 0.25) * Math.sin(time * 0.001);
          ctx.ellipse(0, 0, rx, ry, time * 0.0001, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (activeChConfig.id === 'resonance') {
        // Cyber oscillation sound waves
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = -rOuter; x <= rOuter; x += 1.5) {
          const progressLocal = (x + rOuter) / (rOuter * 2);
          const env = Math.sin(progressLocal * Math.PI); // envelope dome
          const wave = Math.sin(x * 0.075 + time * 0.004) * 22 * env;
          if (x === -rOuter) ctx.moveTo(x, wave);
          else ctx.lineTo(x, wave);
        }
        ctx.stroke();
      } else {
        // Solar flame crown/pulsar geometry
        ctx.strokeStyle = 'rgba(239, 44, 44, 0.45)';
        ctx.lineWidth = 1;
        const vertexCount = 60;
        ctx.beginPath();
        for (let i = 0; i < vertexCount; i++) {
          const theta = (i / vertexCount) * Math.PI * 2;
          const offset = Math.sin(theta * 10 + time * 0.005) * 10 + Math.cos(theta * 3 + time * 0.002) * 5;
          const rx = (rOuter + offset) * Math.cos(theta);
          const ry = (rOuter + offset) * Math.sin(theta);
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentChapter, pointerPos]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full h-[620px] rounded-[2.5rem] bg-gradient-to-tr ${chapters[currentChapter].bgGradient} border border-white/10 overflow-hidden shadow-2xl transition-all duration-1000 p-8 md:p-12 flex flex-col justify-between`}
    >
      {/* SideRays Background Overlay */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <SideRays
          speed={rayConfig.speed}
          rayColor1={chapters[currentChapter].color1}
          rayColor2={chapters[currentChapter].color2}
          intensity={rayConfig.intensity}
          spread={rayConfig.spread}
          origin="top-right"
          tilt={10}
          saturation={1.6}
          blend={rayConfig.blend}
          falloff={1.4}
          opacity={0.85}
        />
      </div>

      {/* Floating Canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none w-full h-full" />

      {/* Top Controls Bar */}
      <div className="flex justify-between items-center relative z-20 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#39ff14]/80 animate-pulse border border-[#39ff14]/40" />
          <span className="text-[10px] font-mono tracking-[0.25em] text-white/60 uppercase">
            XINGHE INTERACTIVE INSTANCE // LAB_ONLINE
          </span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-all text-xs font-mono tracking-widest uppercase cursor-pointer"
          >
            {lang === 'zh' ? '返回普通视图 [ESC]' : 'CLOSE EXPLORATION [ESC]'}
          </button>
        )}
      </div>

      {/* Immersive Centerpiece representation area */}
      <div className="relative flex-1 flex flex-col items-center justify-center pointer-events-none z-10 select-none">
        
        {/* Floating Accent Key to interact */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-[52%] flex flex-col items-center pointer-events-auto"
        >
          <button
            onClick={triggerAccentAction}
            className="group flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-white/5 group-hover:scale-150 transition-all duration-500 border border-white/10" />
              <div 
                className="w-12 h-12 rounded-full border border-white/20 hover:border-white/60 flex items-center justify-center text-white/70 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300"
                style={{ backgroundColor: `${chapters[currentChapter].color1}15` }}
              >
                {currentChapter === 0 && <Sparkles size={16} className="animate-pulse" />}
                {currentChapter === 1 && <Compass size={16} className="animate-spin" style={{ animationDuration: '6s' }} />}
                {currentChapter === 2 && <Volume2 size={16} className="animate-pulse" />}
                {currentChapter === 3 && <Globe size={16} />}
              </div>
            </div>
            <span className="text-[9px] font-mono text-white/45 group-hover:text-white transition-colors uppercase tracking-widest mt-2 bg-slate-950/40 px-2 py-0.5 rounded-md border border-white/5">
              点击激活 {chapters[currentChapter].accentLabel}
            </span>
          </button>
        </motion.div>
      </div>

      {/* Bottom Content slide & Navigation */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
        
        {/* Story Text Content Card */}
        <div className="max-w-xl text-left select-text">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentChapter}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-[#39ff14] border border-[#39ff14]/30 px-1.5 py-0.5 rounded font-mono">
                  CH_0{currentChapter + 1}
                </span>
                <span className="text-xs text-white/50 font-medium tracking-widest uppercase">
                  {lang === 'zh' ? chapters[currentChapter].subtitleZh : chapters[currentChapter].subtitleEn}
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-sm font-sans">
                {lang === 'zh' ? chapters[currentChapter].titleZh : chapters[currentChapter].titleEn}
              </h3>
              <p className="text-xs md:text-sm text-white/70 leading-relaxed font-sans max-w-lg select-text selection:bg-[#39ff14]/30">
                {lang === 'zh' ? chapters[currentChapter].descZh : chapters[currentChapter].descEn}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic Chapter Navigation Selector */}
        <div className="flex flex-col items-end gap-3.5 select-none">
          {/* Progress dots lines indicator */}
          <div className="flex items-center gap-3">
            {chapters.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  playSynthSound(200 + idx * 100, 'sine');
                  setCurrentChapter(idx);
                }}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  currentChapter === idx ? 'w-8 bg-white' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`跳转到第${idx + 1}章`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevChapter}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer text-sm font-black"
            >
              ←
            </button>
            
            {currentChapter === chapters.length - 1 ? (
              <button
                onClick={onClose}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:brightness-110 shadow-lg shadow-red-950/20 text-white font-extrabold text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer hover:scale-102 active:scale-95"
              >
                <span>{lang === 'zh' ? '进入协会空间' : 'LAUNCH WORKSPACE'}</span>
                <ArrowRight size={13} className="animate-pulse" />
              </button>
            ) : (
              <button
                onClick={nextChapter}
                className="h-10 px-5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>{lang === 'zh' ? '下一篇章' : 'NEXT CHAPTER'}</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
