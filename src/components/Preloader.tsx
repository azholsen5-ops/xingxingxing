import React from 'react';
import { motion } from 'motion/react';

interface PreloaderProps {
    progress: number;
}

const Preloader: React.FC<PreloaderProps> = ({ progress }) => {
    return (
        <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
        >
            {/* Background Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
            
            {/* Logo / Text */}
            <div className="relative mb-16 flex flex-col items-center">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="flex flex-col items-center"
                >
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2">
                        XINGHE<span className="text-blue-600">.</span>
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-white/20"></div>
                        <span className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">Tech Innovation Association</span>
                        <div className="w-8 h-[1px] bg-white/20"></div>
                    </div>
                </motion.div>
            </div>

            {/* Progress Container */}
            <div className="relative w-64 md:w-80">
                {/* Progress Bar Track */}
                <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div 
                        className="absolute top-0 left-0 h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                    />
                </div>
                
                {/* Progress Stats */}
                <div className="mt-6 flex justify-between items-end font-mono">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-white/20 uppercase tracking-widest mb-1">System Status</span>
                        <span className="text-[10px] text-blue-500/80 uppercase tracking-widest animate-pulse">
                            {progress < 100 ? 'Initializing Assets...' : 'Ready to Launch'}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Loading</span>
                        <span className="text-xl font-bold text-white tracking-tighter">
                            {Math.round(progress)}<span className="text-xs text-white/40 ml-1">%</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-12 left-12 hidden md:block">
                <div className="flex flex-col gap-2">
                    <div className="w-12 h-[1px] bg-white/10"></div>
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Archive v2.4.04</span>
                </div>
            </div>
            
            <div className="absolute bottom-12 right-12 hidden md:block">
                <div className="flex flex-col items-end gap-2">
                    <div className="w-12 h-[1px] bg-white/10"></div>
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">© 2026 Xinghe Team</span>
                </div>
            </div>

            {/* Scanning Line Effect */}
            <motion.div 
                animate={{ top: ['-10%', '110%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none"
            />
        </motion.div>
    );
};

export default Preloader;
