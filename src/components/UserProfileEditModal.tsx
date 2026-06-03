import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, User, Tag, FileText, GraduationCap, Loader2, Save,
    Smartphone, QrCode, Lock, Mail, ShieldAlert, CheckCircle2, ShieldCheck, KeyRound
} from 'lucide-react';
import { authService, User as AuthUser } from '../services/authService';
import { wechatService } from '../services/wechatService';

interface UserProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
    lang: 'zh' | 'en';
}

const UserProfileEditModal: React.FC<UserProfileEditModalProps> = ({ isOpen, onClose, onSuccess, lang }) => {
    const currentUser = authService.getCurrentUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'bio' | 'security'>('bio');

    // Email binding states
    const [emailToBind, setEmailToBind] = useState('');
    const [bindEmailCode, setBindEmailCode] = useState('');
    const [isSendingBindCode, setIsSendingBindCode] = useState(false);
    const [isConfirmingBind, setIsConfirmingBind] = useState(false);
    const [bindCodeSent, setBindCodeSent] = useState(false);
    const [simulatedBindCode, setSimulatedBindCode] = useState<string | null>(null);

    // WeChat MP binding states
    const [mpBindUuid, setMpBindUuid] = useState<string | null>(null);
    const [isMpBindLoading, setIsMpBindLoading] = useState(false);
    const [mpBindOpen, setMpBindOpen] = useState(false);
    const [simulatedBindOpenid, setSimulatedBindOpenid] = useState('mp_user_openid_' + Math.random().toString(36).substring(2, 6));
    const [simulatedBindNickname, setSimulatedBindNickname] = useState('星河自愈小黑_' + Math.random().toString(36).substring(2, 5));

    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        className: currentUser?.className || '',
        category: currentUser?.category || 'core',
        intro: currentUser?.intro || '',
        avatar: currentUser?.avatar || ''
    });

    // Sync form data if currentUser changes (e.g. after binding)
    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                className: currentUser.className || '',
                category: currentUser.category || 'core',
                intro: currentUser.intro || '',
                avatar: currentUser.avatar || ''
            });
        }
    }, [currentUser?.id, currentUser?.name, currentUser?.className, currentUser?.intro, currentUser?.avatar, currentUser?.category]);

    // Handle Mini Program dynamic scanner subscription for profile bindings
    useEffect(() => {
        if (!isOpen || activeTab !== 'security' || !mpBindOpen) return;

        let unsub: (() => void) | null = null;
        let isCurrent = true;

        const startMpBindLifecycle = async () => {
            setIsMpBindLoading(true);
            setError(null);
            try {
                const session = await wechatService.initMpSession();
                if (!isCurrent) return;
                setMpBindUuid(session.uuid);

                unsub = wechatService.subscribeToMpSync(session.uuid, async (payload) => {
                    if (!isCurrent) return;
                    try {
                        const res = await fetch('/api/auth/bind-mp-confirm', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authService.getToken()}`
                            },
                            body: JSON.stringify({ 
                                openid: payload.user.wechat_openid, 
                                nickname: payload.user.wechat_nickname 
                            })
                        });
                        const result = await res.json();
                        if (result.success) {
                            authService.updateCurrentUserObject(result.user);
                            onSuccess(result.user);
                            setError('微信小程序安全卡片绑定成功！');
                            setMpBindUuid(null);
                            setMpBindOpen(false);
                        } else {
                            setError(result.error || '微信确认绑定失败');
                        }
                    } catch (err: any) {
                        setError('微信小程序授权同步异常，请刷新重试');
                    }
                });
            } catch (err: any) {
                if (isCurrent) {
                    setError('微信统一身份盾网关初始化失败。');
                }
            } finally {
                if (isCurrent) {
                    setIsMpBindLoading(false);
                }
            }
        };

        startMpBindLifecycle();

        return () => {
            isCurrent = false;
            if (unsub) unsub();
        };
    }, [isOpen, activeTab, mpBindOpen]);

    const handleSendBindEmailCode = async () => {
        setIsSendingBindCode(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/bind-email-send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify({ email: emailToBind })
            });
            const result = await res.json();
            if (result.success) {
                setBindCodeSent(true);
                if (result.simulated) {
                    setSimulatedBindCode(result.code);
                    setError(`[安全网民盾] 模拟卡验证码已生成 : ${result.code}`);
                } else {
                    setError('动态安全码已发送至邮箱，请查收');
                }
            } else {
                setError(result.error || '验证验证码失败');
            }
        } catch (err) {
            setError('网络发送失败');
        } finally {
            setIsSendingBindCode(false);
        }
    };

    const handleConfirmBindEmail = async () => {
        setIsConfirmingBind(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/bind-email-confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify({ email: emailToBind, code: bindEmailCode })
            });
            const result = await res.json();
            if (result.success) {
                authService.updateCurrentUserObject(result.user);
                onSuccess(result.user);
                setError('验证成功。安全邮箱已成功绑定绑定卡片！');
                setBindCodeSent(false);
                setSimulatedBindCode(null);
                setEmailToBind('');
                setBindEmailCode('');
            } else {
                setError(result.error || '绑定失败');
            }
        } catch (err) {
            setError('网络确认超时');
        } finally {
            setIsConfirmingBind(false);
        }
    };

    const handleUnbindEmail = async () => {
        setIsConfirmingBind(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/unbind-email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            const result = await res.json();
            if (result.success) {
                authService.updateCurrentUserObject(result.user);
                onSuccess(result.user);
                setError('已安全解除身份卡片的邮箱验证关系。');
            } else {
                setError(result.error || '解绑邮箱失败');
            }
        } catch (e) {
            setError('网络解绑冲突');
        } finally {
            setIsConfirmingBind(false);
        }
    };

    const handleUnbindMp = async () => {
        setIsConfirmingBind(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/unbind-mp', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            const result = await res.json();
            if (result.success) {
                authService.updateCurrentUserObject(result.user);
                onSuccess(result.user);
                setError('微信小程序关联关系已完全解除绑定。');
            } else {
                setError(result.error || '解绑微信小程序失败');
            }
        } catch (e) {
            setError('微信解绑冲突');
        } finally {
            setIsConfirmingBind(false);
        }
    };

    const t = {
        zh: {
            title: "修改个人资料",
            subtitle: "完善您在星河创协的身份卡片",
            label_name: "真实姓名",
            label_class: "班级/专业",
            label_category: "成员类别",
            label_intro: "个人简介 (最懂你的黑科技金句)",
            label_avatar: "头像链接 (可选)",
            cat_core: "核心成员",
            cat_service: "服务人员",
            btn_save: "保存更改",
            error_generic: "保存失败，请稍后重试",
            success_save: "更新成功！"
        },
        en: {
            title: "Edit Profile",
            subtitle: "Update your identity card details",
            label_name: "Full Name",
            label_class: "Class/Major",
            label_category: "Member Category",
            label_intro: "Brief Intro / Bio",
            label_avatar: "Avatar URL",
            cat_core: "Core Member",
            cat_service: "Service Personnel",
            btn_save: "Save Changes",
            error_generic: "Failed to save. Please try again,",
            success_save: "Profile updated successfully!"
        }
    };

    const curT = t[lang];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await authService.updateProfile(formData);
            if (res.success) {
                onSuccess(res.user);
                setError(curT.success_save);
                setTimeout(() => {
                    onClose();
                }, 1000);
            } else {
                setError(res.error || curT.error_generic);
            }
        } catch (err) {
            setError(curT.error_generic);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="h-24 bg-gradient-to-br from-[#39FF14]/10 to-blue-600/10 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 topo-bg white"></div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8">
                            <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">
                                {curT.title}
                            </h2>
                            <p className="text-[#39FF14] text-[10px] uppercase tracking-widest mb-6">{curT.subtitle}</p>

                            {/* TAB CONTROLS */}
                            <div className="flex gap-4 mb-6 border-b border-white/5 pb-2">
                                <button 
                                    type="button" 
                                    onClick={() => { setActiveTab('bio'); setError(null); }}
                                    className={`text-xs pb-1 transition-all font-semibold ${activeTab === 'bio' ? 'text-blue-400 border-b-2 border-blue-500 font-bold' : 'text-white/40 hover:text-white/70'}`}
                                >
                                    🖋️ 希望修改基本资料
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => { setActiveTab('security'); setError(null); }}
                                    className={`text-xs pb-1 transition-all font-semibold ${activeTab === 'security' ? 'text-emerald-400 border-b-2 border-emerald-500 font-bold' : 'text-white/40 hover:text-white/70'}`}
                                >
                                    🛡️ 绑定安全卡片与微信网关
                                </button>
                            </div>

                            {activeTab === 'bio' ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2 ml-1">{curT.label_name}</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                                            <input 
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2 ml-1">{curT.label_class}</label>
                                        <div className="relative">
                                            <GraduationCap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                                            <input 
                                                type="text"
                                                required
                                                value={formData.className}
                                                onChange={e => setFormData({...formData, className: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 transition-all text-sm"
                                                placeholder="比如: 软件24-14 / Web Admin"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2 ml-1">{curT.label_category}</label>
                                        <div className="flex gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, category: 'core'})}
                                                className={`flex-1 py-3 rounded-xl border transition-all text-xs font-bold ${formData.category === 'core' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                                            >
                                                {curT.cat_core}
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, category: 'service'})}
                                                className={`flex-1 py-3 rounded-xl border transition-all text-xs font-bold ${formData.category === 'service' ? 'bg-[#39FF14] border-[#39FF14] text-black' : 'bg-white/5 border-white/10 text-white/40'}`}
                                            >
                                                {curT.cat_service}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2 ml-1">{curT.label_intro}</label>
                                        <div className="relative">
                                            <FileText size={16} className="absolute left-4 top-5 text-white/20" />
                                            <textarea 
                                                required
                                                rows={2}
                                                value={formData.intro}
                                                onChange={e => setFormData({...formData, intro: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 transition-all text-xs"
                                                placeholder="简述你的特长或在协会的角色"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <p className={`text-xs ${error.includes('成功') ? 'text-[#39FF14]' : 'text-red-500'} bg-white/5 p-3 rounded-lg`}>{error}</p>
                                    )}

                                    <button 
                                        disabled={isLoading}
                                        className="w-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50 font-bold py-4 rounded-xl transition-all mt-4 flex items-center justify-center gap-2 group text-sm"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>
                                                <Save size={18} />
                                                {curT.btn_save}
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-4 text-white">
                                    {/* Unbind / Bind email segment */}
                                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                    <Mail size={14} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold">主安全联系邮箱</h4>
                                                    <p className="text-[9px] text-white/40">用于邮箱密匙验证并保持此卡片全网唯一</p>
                                                </div>
                                            </div>
                                            {currentUser?.email ? (
                                                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full font-bold font-mono">已绑定</span>
                                            ) : (
                                                <span className="text-[9px] bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full font-bold">未配置</span>
                                            )}
                                        </div>

                                        {currentUser?.email ? (
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <div className="bg-black/40 border border-white/5 p-2 px-3 rounded-xl flex-1 text-xs font-mono text-white/60 truncate">
                                                    {currentUser.email}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleUnbindEmail}
                                                    disabled={isConfirmingBind}
                                                    className="bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold"
                                                >
                                                    解除绑定
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 pt-1 text-xs">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        value={emailToBind}
                                                        onChange={e => setEmailToBind(e.target.value)}
                                                        className="bg-black/40 border border-white/10 rounded-xl p-2 px-3 text-xs outline-none focus:border-blue-500/50 flex-1 text-white"
                                                        placeholder="要绑定的主邮箱 (email@example.com)"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleSendBindEmailCode}
                                                        disabled={isSendingBindCode || !emailToBind}
                                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-black text-xs font-bold px-4 py-2 rounded-xl transition-all font-mono cursor-pointer"
                                                    >
                                                        {isSendingBindCode ? '发送中...' : '发送校验密码'}
                                                    </button>
                                                </div>

                                                {bindCodeSent && (
                                                    <div className="flex gap-2 pt-1">
                                                        <input
                                                            type="text"
                                                            value={bindEmailCode}
                                                            onChange={e => setBindEmailCode(e.target.value)}
                                                            className="bg-black/40 border border-white/10 rounded-xl p-2 px-3 text-xs outline-none focus:border-blue-500/50 flex-1 font-mono tracking-wider text-center text-white"
                                                            placeholder="动态安全验证码"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleConfirmBindEmail}
                                                            disabled={isConfirmingBind || !bindEmailCode}
                                                            className="bg-white text-black hover:bg-neutral-200 disabled:opacity-40 text-xs font-bold px-5 py-2 rounded-xl transition-all cursor-pointer"
                                                        >
                                                            {isConfirmingBind ? '校验中...' : '立即确认绑定'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Unbind / Bind WeChat MP Segment */}
                                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                    <Smartphone size={14} className="text-emerald-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold">微信自主安全盾</h4>
                                                    <p className="text-[9px] text-white/40">一键扫一扫，星河系统微信盾安全配对免签服务</p>
                                                </div>
                                            </div>
                                            {currentUser?.wechat_openid ? (
                                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold font-mono font-bold">已绑定</span>
                                            ) : (
                                                <span className="text-[9px] bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full font-bold">未配置</span>
                                            )}
                                        </div>

                                        {currentUser?.wechat_openid ? (
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <div className="bg-black/40 border border-white/5 p-2 px-3 rounded-xl flex-1 text-xs truncate text-emerald-400 font-medium">
                                                    已绑定: {currentUser.wechat_nickname || '星河微信安全成员'}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleUnbindMp}
                                                    disabled={isConfirmingBind}
                                                    className="bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold"
                                                >
                                                    解除绑定
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 pt-1">
                                                {!mpBindOpen ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setMpBindOpen(true); }}
                                                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/5"
                                                    >
                                                        <QrCode size={14} />
                                                        <span>启动动态小程序扫码绑定</span>
                                                    </button>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-3 bg-black/40 border border-white/10 rounded-xl space-y-3 relative overflow-hidden">
                                                        {isMpBindLoading ? (
                                                            <div className="space-y-1.5 flex flex-col items-center py-2">
                                                                <Loader2 className="animate-spin text-emerald-400" size={24} />
                                                                <p className="text-[9px] text-white/50">正在建立星河安全绑定通道...</p>
                                                            </div>
                                                        ) : mpBindUuid ? (
                                                            <div className="flex flex-col items-center space-y-2 text-center w-full">
                                                                <div className="w-24 h-24 border border-dashed border-emerald-500/30 rounded-full p-2 flex items-center justify-center bg-slate-950 relative">
                                                                    <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin flex items-center justify-center">
                                                                        <QrCode size={14} className="text-emerald-400" />
                                                                    </div>
                                                                </div>
                                                                <p className="text-[10px] text-emerald-400 font-mono tracking-wider animate-pulse">安全微信绑定通道已挂起</p>
                                                                <p className="text-[9px] text-white/30 truncate font-mono max-w-[150px]">{mpBindUuid}</p>
                                                                
                                                                {/* Sim confirm buttons */}
                                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg w-full space-y-1.5 text-left text-[10px]">
                                                                    <p className="text-white/40">在手机微信上确认绑定操作同步：</p>
                                                                    <div className="flex gap-2">
                                                                        <input 
                                                                            type="text"
                                                                            value={simulatedBindNickname}
                                                                            onChange={e => setSimulatedBindNickname(e.target.value)}
                                                                            className="bg-black border border-white/10 rounded p-1 px-2 text-[9px] flex-1 text-white outline-none"
                                                                            placeholder="微信绑定昵称"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={async () => {
                                                                                try {
                                                                                    setIsConfirmingBind(true);
                                                                                    setError(null);
                                                                                    await wechatService.authorizeMp(mpBindUuid, simulatedBindOpenid, simulatedBindNickname);
                                                                                } catch (e: any) {
                                                                                    setError(e.message || '模拟绑定客户端授权失败');
                                                                                } finally {
                                                                                    setIsConfirmingBind(false);
                                                                                }
                                                                            }}
                                                                            className="bg-emerald-500/20 text-emerald-300 font-bold px-2.5 rounded cursor-pointer text-[9px] hover:bg-emerald-500/30"
                                                                        >
                                                                            授权绑定
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-red-400">绑定会话生成失败</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => { setMpBindOpen(false); setMpBindUuid(null); }}
                                                            className="text-[9px] hover:underline text-white/35 cursor-pointer"
                                                        >
                                                            关闭绑定通道
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {error && (
                                        <p className={`text-xs ${error.includes('成功') ? 'text-[#39FF14]' : 'text-red-500'} bg-white/5 p-3 rounded-lg`}>{error}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UserProfileEditModal;
