import React, { useState, useEffect } from 'react';
import { 
    QrCode, CheckCircle2, XCircle, User, Sparkles, Loader2, ArrowRight, Check, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { wechatService } from '../services/wechatService';

export const WechatAuthLanding: React.FC = () => {
    const [uuid, setUuid] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'authorizing' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Dynamic tester identities
    const [selectedUser, setSelectedUser] = useState<any>({
        id: '10001',
        username: 'lupeng',
        name: '陆鹏',
        className: '安全23-2班',
        category: 'core',
        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=lupeng&backgroundColor=b6e3f4,c0aede,d1d4f9&hairColor=000000,101010&skinColor=ffd1a9,f1c27d,e8b584',
        intro: '星河科创核心组长 · 移动端终端授权'
    });

    const [customName, setCustomName] = useState('');
    const [isCustomMode, setIsCustomMode] = useState(false);

    // Stored profiles
    const presetUsers = [
        {
            id: '10001',
            username: 'lupeng',
            name: '陆鹏',
            className: '安全23-2班',
            category: 'core',
            avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=lupeng&backgroundColor=b6e3f4,c0aede,d1d4f9&hairColor=000000,101010&skinColor=ffd1a9,f1c27d,e8b584',
            intro: '星河科创核心组长 · 移动端终端授权'
        },
        {
            id: '10002',
            username: 'wangax',
            name: '王傲星',
            className: '信安24-1班',
            category: 'core',
            avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=wangax&backgroundColor=b6e3f4,c0aede,d1d4f9&hairColor=000000,101010&skinColor=ffd1a9,f1c27d,e8b584',
            intro: '星河网络防御中心讲师 · 移动端终端授权'
        }
    ];

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('uuid') || params.get('scene');
        if (code) {
            setUuid(code);
        } else {
            setStatus('error');
            setErrorMsg('未提供有效的安全连接令牌 (Missing Session UUID).');
        }
    }, []);

    const handleConfirm = async () => {
        if (!uuid) return;
        setStatus('authorizing');
        setErrorMsg(null);

        // Compute final user object based on customization mode
        let finalUser = selectedUser;
        if (isCustomMode) {
            if (!customName.trim()) {
                setStatus('idle');
                setErrorMsg('请输入您想在电脑端登录的姓名');
                return;
            }
            const randId = 'visit_' + Math.floor(Math.random() * 9000 + 1000);
            finalUser = {
                id: randId,
                username: 'scan_' + randId,
                name: customName + ' (扫码访客)',
                className: '微信扫码接入',
                category: 'student',
                avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(customName)}&backgroundColor=b6e3f4,c0aede,d1d4f9&hairColor=000000,101010&skinColor=ffd1a9,f1c27d,e8b584`,
                intro: '通过统一终端微信安全扫码进入系统'
            };
        }

        try {
            const success = await wechatService.confirmSession(uuid, finalUser);
            if (success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMsg('无法建立与目标主机的授权会话 (Failed to bind session)');
            }
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.message || '认证请求网关超时，请检查网络连接后重试');
        }
    };

    return (
        <div className="min-h-screen bg-[#070913] text-white flex flex-col justify-between p-6 select-none font-sans relative overflow-hidden">
            {/* Ambient Background decoration */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-[120px] pointer-events-none" />

            {/* Header branding */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4 mt-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/20">
                        <QrCode size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xs font-bold tracking-widest text-emerald-400 uppercase">星河统一网关</h1>
                        <p className="text-[8px] text-white/30 tracking-wider">STAR RIVER SECURE SCAN</p>
                    </div>
                </div>
                <div className="text-[10px] text-white/40 font-mono flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>SECURE LINK</span>
                </div>
            </div>

            {/* Main Center Area */}
            <div className="relative z-10 my-auto py-8 max-w-sm mx-auto w-full">
                <AnimatePresence mode="wait">
                    {status === 'success' ? (
                        <motion.div 
                            key="success"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="text-center space-y-6 pt-6"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-lg font-black text-white">微信扫码授权成功</h2>
                                <p className="text-xs text-white/55 leading-relaxed px-4">
                                    您选择的账户身份已成功同步到目标电脑网页中。现在可以返回大屏显示端查看，畅快体验整个星河科创平台！
                                </p>
                            </div>
                            <div className="pt-4">
                                <button 
                                    onClick={() => window.close()}
                                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-medium py-3 rounded-xl transition-all"
                                >
                                    关闭此页面
                                </button>
                            </div>
                        </motion.div>
                    ) : status === 'error' ? (
                        <motion.div 
                            key="error"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="text-center space-y-5"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                                <XCircle size={32} className="text-red-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-lg font-black text-white">授权连接失效</h2>
                                <p className="text-xs text-red-400/80 leading-relaxed bg-red-500/[0.03] border border-red-500/10 p-3 rounded-xl">
                                    {errorMsg || '二维码令牌验证失败，极有可能连接已超时。请在电脑端重新点击“获取企业微信扫码登录”并进行重新扫码。'}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="auth"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-1">
                                <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                                    微信网页授权 (WebAuth Gate)
                                </span>
                                <h2 className="text-xl font-bold tracking-tight text-white pt-2">确认授权此次安全登录</h2>
                                <p className="text-xs text-white/40 font-light mt-0.5">
                                    电脑端页面同步监听中，点击下方即可完成一键登陆。
                                </p>
                            </div>

                            {/* Identity Selector */}
                            <div className="bg-[#0e111d] border border-white/5 rounded-2xl p-4 space-y-4">
                                <h3 className="text-xs font-bold text-white/50 tracking-wider uppercase pl-1">
                                    1. 选择您要在电脑端登录的身份
                                </h3>

                                <div className="space-y-2.5">
                                    {presetUsers.map(u => (
                                        <div 
                                            key={u.username}
                                            onClick={() => {
                                                setSelectedUser(u);
                                                setIsCustomMode(false);
                                            }}
                                            className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${(!isCustomMode && selectedUser.username === u.username) ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-white/[0.01] border-white/5 text-white/40 hover:bg-white/[0.03]'}`}
                                        >
                                            <img src={u.avatar} className="w-8 h-8 rounded-full border border-white/10" alt="avatar" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-white">{u.name}</span>
                                                    <span className="text-[8px] px-1 bg-blue-500/10 text-blue-400 rounded scaling">主管理</span>
                                                </div>
                                                <p className="text-[10px] text-white/40 truncate mt-0.5">{u.intro}</p>
                                            </div>
                                            {(!isCustomMode && selectedUser.username === u.username) && (
                                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                                    <Check size={12} className="text-black stroke-[3px]" />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Creator mode / Custom Visitor toggle */}
                                    <div 
                                        onClick={() => setIsCustomMode(true)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer ${isCustomMode ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-white/[0.01] border-white/5 text-white/40 hover:bg-white/[0.03]'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                                                <User size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-bold text-white">使用自定义姓名登录</span>
                                                <p className="text-[10px] text-white/40 mt-0.5">自主创设全新手机扫码角色并接入</p>
                                            </div>
                                            {isCustomMode && (
                                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                                    <Check size={12} className="text-black stroke-[3px]" />
                                                </div>
                                            )}
                                        </div>

                                        {isCustomMode && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                className="mt-3 pt-3 border-t border-white/5 overflow-hidden"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <label className="text-[9px] text-white/40 uppercase tracking-widest pl-0.5 block mb-1">
                                                    输入您的姓名或昵称
                                                </label>
                                                <input 
                                                    type="text"
                                                    value={customName}
                                                    onChange={e => setCustomName(e.target.value)}
                                                    placeholder="例: 王小明"
                                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-emerald-500 transition-all placeholder:text-white/20"
                                                />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[11px] flex gap-2">
                                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Authorize buttons */}
                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={handleConfirm}
                                    disabled={status === 'authorizing'}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 active:scale-[0.98] outline-none disabled:opacity-50 text-black text-xs font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                                >
                                    {status === 'authorizing' ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin text-black" />
                                            <span>正在传输授权信令...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>一键同意网页授权并登录</span>
                                            <ArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                                
                                <button
                                    onClick={() => setStatus('error')}
                                    className="w-full bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] text-white/40 text-xs py-3 rounded-xl transition-all"
                                >
                                    拒绝授权
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom fine print */}
            <div className="relative z-10 text-center text-[9px] text-white/20 font-mono tracking-wider border-t border-white/5 pt-4 pb-2">
                <span>© 2026 STAR RIVER SECURE GATEWAY • TRUST AUTHORIZATION</span>
            </div>
        </div>
    );
};
