import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { QrCode, Play, RotateCcw, ChevronRight, Terminal, Award } from 'lucide-react';

interface ManifestoRevealProps {
    lang: 'zh' | 'en';
}

export default function ManifestoReveal({ lang }: ManifestoRevealProps) {
    const [replayKey, setReplayKey] = useState(0);
    const controls = useAnimation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                }
            },
            { threshold: 0.15 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (inView) {
            controls.start('visible');
        }
    }, [inView, controls, replayKey]);

    const handleReplay = () => {
        setReplayKey((prev) => prev + 1);
    };

    // Words & design concept inspired by the McLaren high-contrast presentation style
    const lines = lang === 'zh' ? [
        { en: "REDEFINING CHRONICLES", zh: "重塑学术与科创边界" },
        { en: "BREAKING CORE BARRIERS", zh: "破除传统技术壁垒" },
        { en: "HARNESSING COLLECTIVE POWER", zh: "汇聚跨学科智囊矩阵" },
        { en: "LEGACY OF EXCELLENCE", zh: "追求世界一流科技极致" }
    ] : [
        { en: "REDEFINING CHRONICLES", zh: "REDEFINING DISCIPLINE BOUNDARIES" },
        { en: "BREAKING CORE BARRIERS", zh: "BREAKING TRADITIONAL SHACKLES" },
        { en: "HARNESSING COLLECTIVE POWER", zh: "HARNESSING SYSTEMATIC INTELLIGENCE" },
        { en: "LEGACY OF EXCELLENCE", zh: "PURSUING WORLD-CLASS EXCELLENCE" }
    ];

    // Card reveal transition configurations
    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.18,
            }
        }
    };

    const textVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.4, 
                ease: [0.215, 0.61, 0.355, 1] as const, // cubic-bezier matching video
                delay: 0.15 
            }
        }
    };

    // This block animates overlaying from left, covering 100%, and exiting out of right
    const blockVariants = {
        hidden: { scaleX: 0, originX: 0 },
        visible: {
            scaleX: [0, 1, 1, 0],
            originX: [0, 0, 1, 1],
            transition: {
                duration: 0.85,
                times: [0, 0.45, 0.55, 1],
                ease: [0.76, 0, 0.24, 1] as const
            }
        }
    };

    return (
        <div 
            ref={containerRef} 
            className="w-full bg-[#0d1117]/30 border border-white/5 rounded-[2rem] p-6 md:p-8 relative overflow-hidden flex flex-col justify-between"
            style={{ minHeight: '340px' }}
            id="manifesto-reveal-panel"
        >
            {/* Tech grid mesh subtle background decoration */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
            
            {/* Upper Telemetry Deck */}
            <div className="flex justify-between items-center mb-6 z-10">
                <div className="flex items-center gap-2.5">
                    {/* Glowing active radar dot */}
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39FF14] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39FF14]"></span>
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#39FF14] font-bold">
                        {lang === 'zh' ? '星河核心理念 · 智能演示' : 'GALAXY MANIFESTO • CINEMATIC'}
                    </span>
                </div>
                
                {/* Control Tools */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleReplay}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-[#39FF14]/40 hover:bg-[#39FF14]/5 transition-all text-[10px] uppercase font-bold tracking-wider font-mono cursor-pointer"
                        title="Replay sequence"
                        type="button"
                    >
                        <RotateCcw size={10} className="animate-spin-slow" />
                        <span>{lang === 'zh' ? '重播效果' : 'REPLAY'}</span>
                    </button>
                </div>
            </div>

            {/* Middle Big Typography Cinematic Block Container */}
            <motion.div 
                key={replayKey}
                variants={containerVariants}
                initial="hidden"
                animate={controls}
                className="flex-1 flex flex-col justify-center space-y-3 md:space-y-4 my-2 z-10"
            >
                {lines.map((line, idx) => (
                    <div key={idx} className="relative overflow-hidden py-1 flex flex-col items-start">
                        {/* The solid neon-green slider horizontal bar */}
                        <motion.div 
                            variants={blockVariants}
                            className="absolute inset-y-0 left-0 w-full bg-[#39FF14] z-20 rounded-md"
                        />
                        
                        {/* Word content */}
                        <motion.div 
                            variants={textVariants}
                            className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 w-full"
                        >
                            {/* Chinese characters with premium styling */}
                            <span className="text-xl md:text-3xl font-extrabold text-white tracking-wide font-sans drop-shadow-md">
                                {line.zh}
                            </span>
                            
                            {/* English accent with mono typography */}
                            <span className="text-[10px] md:text-xs font-mono font-bold tracking-[0.2em] text-[#39FF14]/70 uppercase">
                                // {line.en}
                            </span>
                        </motion.div>
                    </div>
                ))}
            </motion.div>

            {/* Lower Telemetry & Meta-Data Bar */}
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center text-[10px] font-mono text-white/30 z-10 gap-2">
                <div className="flex items-center gap-4">
                    <span>SYS_STATE: <span className="text-[#39FF14]">RUNNING</span></span>
                    <span className="hidden md:inline">FREQ: 60FPS</span>
                    <span>ENGINE: GSAP+MOTION</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[#39FF14]/50">■</span>
                    <span>{lang === 'zh' ? '星河学术科研舱 版权所有' : '© GALAXY TECH CO-LAB'}</span>
                </div>
            </div>
        </div>
    );
}
