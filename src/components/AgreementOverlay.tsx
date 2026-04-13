import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvasComponent from 'react-signature-canvas';
import { Shield, PenTool, Check, AlertTriangle, FileText, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Handle ESM/CJS interop for react-signature-canvas
const SignatureCanvas = (SignatureCanvasComponent as any).default || SignatureCanvasComponent;

interface AgreementOverlayProps {
    onAccept: (signatureData: string) => void;
    isSubmitting?: boolean;
}

const AgreementOverlay: React.FC<AgreementOverlayProps> = ({ onAccept, isSubmitting = false }) => {
    const [isSigned, setIsSigned] = useState(false);
    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const sigPad = useRef<any>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Ensure signature pad is responsive and correctly initialized
    useEffect(() => {
        const resizeCanvas = () => {
            if (sigPad.current) {
                const canvas = sigPad.current.getCanvas();
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                
                // Only resize if dimensions actually changed to avoid unnecessary clears
                const newWidth = canvas.offsetWidth * ratio;
                const newHeight = canvas.offsetHeight * ratio;
                
                if (canvas.width !== newWidth || canvas.height !== newHeight) {
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    canvas.getContext('2d')?.scale(ratio, ratio);
                    sigPad.current.clear();
                }
            }
        };

        // Initial resize with a slight delay to allow layout to settle
        const timer = setTimeout(resizeCanvas, 300);
        window.addEventListener('resize', resizeCanvas);
        
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            clearTimeout(timer);
        };
    }, []);

    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            // More lenient scroll check for mobile
            if (scrollTop + clientHeight >= scrollHeight - 50) {
                setHasReadToBottom(true);
            }
        }
    };

    const clearSignature = () => {
        sigPad.current?.clear();
        setIsSigned(false);
    };

    const handleAccept = () => {
        if (isSigned && hasReadToBottom && sigPad.current) {
            const data = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
            onAccept(data);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex items-center justify-center font-sans"
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full h-full bg-[#0d1117] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 md:p-8 md:pl-40 border-b border-white/5 flex items-center gap-4 bg-white/5">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                        <Shield size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">星河科技创新协会入会协议</h2>
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-mono">v2.4.04</span>
                        </div>
                        <p className="text-xs text-white/40 tracking-widest uppercase font-mono mt-1">Xinghe Tech Innovation Association - Membership Agreement</p>
                    </div>
                </div>

                {/* Content */}
                <div 
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 space-y-12 text-white/80 leading-relaxed custom-scrollbar"
                >
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 font-bold">
                            <FileText size={18} />
                            <span className="text-sm uppercase tracking-wider">前言 / Preamble</span>
                        </div>
                        <p className="text-sm">
                            欢迎加入星河科技创新协会（以下简称“本协会”）。本协议旨在明确成员在协会期间的权利与义务，维护协会的创新环境及技术成果。在您正式开启星河之旅前，请仔细阅读并签署本协议。
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
                        <section className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors group">
                            <h3 className="text-blue-400 font-bold flex items-center gap-2 group-hover:text-blue-300">
                                <Check size={16} /> 第一条：尽职守则与交付质量
                            </h3>
                            <p className="text-sm">
                                成员应以高度的责任感参与协会项目，确保任务按时按质完成。在项目研发过程中，应秉持科学严谨的态度，不得敷衍塞责。<strong>任何形式的“挂名”或“出工不出力”行为均被视为违约。</strong>
                            </p>
                        </section>

                        <section className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-red-500/30 transition-colors group">
                            <h3 className="text-red-400 font-bold flex items-center gap-2 group-hover:text-red-300">
                                <AlertTriangle size={16} /> 第二条：知识产权归属与竞业禁止
                            </h3>
                            <p className="text-sm">
                                在协会期间参与研发的所有项目、代码、硬件设计及技术文档，其知识产权均归协会所有。<strong>严禁私自将项目核心技术带离协会，或未经许可用于个人竞赛、商业谋利及第三方组织。</strong>离会后一年内不得参与与协会核心项目存在直接竞争关系的外部项目。
                            </p>
                        </section>

                        <section className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors group">
                            <h3 className="text-blue-400 font-bold flex items-center gap-2 group-hover:text-blue-300">
                                <Check size={16} /> 第三条：活跃度考核与末位淘汰
                            </h3>
                            <p className="text-sm">
                                协会实行动态考核机制。成员需保持活跃度，积极承接研发任务。<strong>长期（超过30天）无故不参与活动、不承担任务或拒绝沟通者，协会有权启动劝退程序并收回相关资源权限。</strong>
                            </p>
                        </section>

                        <section className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-yellow-500/30 transition-colors group">
                            <h3 className="text-yellow-400 font-bold flex items-center gap-2 group-hover:text-yellow-300">
                                <Shield size={16} /> 第四条：信息安全与保密义务
                            </h3>
                            <p className="text-sm">
                                成员必须严格保守协会内部未公开的技术细节、竞赛策略、核心数据及合作伙伴信息。<strong>严禁在社交平台、个人博客或公开代码库中泄露协会未授权公开的源码或设计图纸。</strong>
                            </p>
                        </section>

                        <section className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors group">
                            <h3 className="text-purple-400 font-bold flex items-center gap-2 group-hover:text-purple-300">
                                <PenTool size={16} /> 第五条：资源使用与资产保护
                            </h3>
                            <p className="text-sm">
                                协会提供的实验设备、服务器资源、耗材及经费仅限用于协会授权项目。<strong>严禁挪作他用或私自占有。</strong>成员应对领用的固定资产负有保管责任，人为损坏需按价赔偿。
                            </p>
                        </section>

                        <section className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                            <h3 className="text-emerald-400 font-bold flex items-center gap-2 group-hover:text-emerald-300">
                                <Check size={16} /> 第六条：团队协作与价值观
                            </h3>
                            <p className="text-sm">
                                成员应认同“星河”核心价值观：创新、协作、卓越。<strong>严禁在内部传播负面情绪、拉帮结派或进行任何损害团队凝聚力的行为。</strong>尊重每一位成员的劳动成果，共同维护协会声誉。
                            </p>
                        </section>
                    </div>

                    <section className="space-y-4">
                        <h3 className="text-blue-400 font-bold">第五条：退出与交接</h3>
                        <p className="text-sm">
                            成员申请退出协会时，必须完成所有负责项目的文档归档与技术交接工作。退出后，仍需履行对协会核心技术的保密义务。
                        </p>
                    </section>

                    <div className="pt-8 border-t border-white/5">
                        <p className="text-xs text-white/40 italic">
                            * 请滚动至底部以激活签名区域。签署本协议即视为您已完全理解并同意上述所有条款。
                        </p>
                    </div>
                </div>

                {/* Footer / Signature */}
                <div className="p-6 md:p-8 bg-black/40 border-t border-white/10">
                    <div className="flex flex-col md:flex-row items-end gap-6">
                        <div className="flex-1 w-full space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                    <PenTool size={14} /> 个人手写签名 / Digital Signature
                                </label>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-white/30 uppercase font-mono">
                                        Date: {new Date().toLocaleDateString()}
                                    </span>
                                    <button 
                                        onClick={clearSignature}
                                        className="text-[10px] text-white/40 hover:text-white uppercase tracking-tighter transition-colors border-b border-white/10"
                                    >
                                        清除重签 Clear
                                    </button>
                                </div>
                            </div>
                            <div className={`relative bg-white/5 border rounded-2xl overflow-hidden transition-all duration-500 ${!hasReadToBottom ? 'opacity-20 pointer-events-none grayscale' : 'border-blue-500/30 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]'}`}>
                                <SignatureCanvas 
                                    ref={sigPad}
                                    penColor="#3b82f6"
                                    velocityFilterWeight={0.7}
                                    minWidth={1.5}
                                    maxWidth={3.5}
                                    canvasProps={{
                                        className: 'w-full h-48 cursor-crosshair',
                                    }}
                                    onEnd={() => setIsSigned(true)}
                                />
                                {!hasReadToBottom && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">请先阅读完协议内容</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            disabled={!isSigned || !hasReadToBottom || isSubmitting}
                            onClick={handleAccept}
                            className={`px-12 py-5 rounded-2xl font-black text-base tracking-widest uppercase transition-all duration-500 flex items-center gap-4 ${
                                isSigned && hasReadToBottom && !isSubmitting
                                ? 'bg-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95' 
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting ? (
                                <>正在提交 <Loader2 size={18} className="animate-spin" /></>
                            ) : (
                                <>确认加入协会 <Check size={18} /></>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AgreementOverlay;
