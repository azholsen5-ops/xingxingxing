import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, User, Lock, ArrowRight, Loader2, Eye, EyeOff, Check, 
    Sparkles, QrCode, ArrowLeft, CheckCircle2, RefreshCw, 
    Smartphone, Phone, FileText, ShieldAlert
} from 'lucide-react';
import { authService, User as AuthUser } from '../services/authService';

interface MemberAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
    lang: 'zh' | 'en';
}

type AuthMethod = 'password' | 'qrcode' | 'sms';

const MemberAuthModal: React.FC<MemberAuthModalProps> = ({ isOpen, onClose, onSuccess, lang }) => {
    // Basic control states
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successUser, setSuccessUser] = useState<any | null>(null);

    // Form inputs state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        className: '',
        category: 'core',
        memberCode: '',
        intro: '',
        phone: '',
        smsCode: ''
    });

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [showTermsOverlay, setShowTermsOverlay] = useState<'none' | 'service' | 'privacy'>('none');
    
    // QQ-Style Quick Login & Stored Accounts
    const [historyUsers, setHistoryUsers] = useState<AuthUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
    const [useAnotherAccount, setUseAnotherAccount] = useState(false);

    // High fidelity Captcha states
    const [isAgreementChecked, setIsAgreementChecked] = useState(true);
    const [shakeAgreement, setShakeAgreement] = useState(false);
    const [isPuzzleOpen, setIsPuzzleOpen] = useState(false);
    const [puzzleX, setPuzzleX] = useState(0);
    const [targetPuzzleX, setTargetPuzzleX] = useState(130);
    const [isDraggingPuzzle, setIsDraggingPuzzle] = useState(false);
    const [puzzleError, setPuzzleError] = useState(false);
    const [puzzleSuccess, setPuzzleSuccess] = useState(false);
    const [startX, setStartX] = useState(0);
    const [pendingAction, setPendingAction] = useState<'login' | 'register' | 'sms' | 'quick'>('login');

    // SMS states
    const [smsTimer, setSmsTimer] = useState(0);
    const [mockSmsBanner, setMockSmsBanner] = useState<{ code: string; message: string } | null>(null);

    // Load stored accounts and pre-populate defaults for live play!
    useEffect(() => {
        if (!isOpen) return;
        const saved = localStorage.getItem('xh_history_users');
        if (saved) {
            const list = JSON.parse(saved) as AuthUser[];
            setHistoryUsers(list);
            if (list.length > 0) setSelectedUser(list[0]);
        } else {
            const defaults: AuthUser[] = [
                {
                    id: '10001',
                    username: 'lupeng',
                    name: '陆鹏 (协会研习主管)',
                    className: '安全23-2班',
                    category: 'core',
                    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=lupeng',
                    intro: '星河科创核心组长 · 快捷终端一键授权'
                },
                {
                    id: '10002',
                    username: 'wangax',
                    name: '王傲星 (安全运维)',
                    className: '信安24-1班',
                    category: 'core',
                    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=wangax',
                    intro: '星河网络防御中心讲师 · 本地快捷登录'
                }
            ];
            setHistoryUsers(defaults);
            setSelectedUser(defaults[0]);
            localStorage.setItem('xh_history_users', JSON.stringify(defaults));
        }
    }, [isOpen]);

    // Handle background dragging calculations for sliding puzzle block
    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDraggingPuzzle) return;
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const deltaX = clientX - startX;
            const newX = Math.max(0, Math.min(220, deltaX)); // clamp within bounding slider slot
            setPuzzleX(newX);
        };

        const handleUp = () => {
            if (!isDraggingPuzzle) return;
            setIsDraggingPuzzle(false);
            
            // Validate snap alignments
            if (Math.abs(puzzleX - targetPuzzleX) <= 6) {
                setPuzzleSuccess(true);
                setPuzzleError(false);
                setTimeout(() => {
                    setIsPuzzleOpen(false);
                    setPuzzleSuccess(false);
                    setPuzzleX(0);
                    // Run actual credentials verify method
                    executePendingSubmit();
                }, 900);
            } else {
                setPuzzleError(true);
                setTimeout(() => {
                    setPuzzleX(0);
                    setPuzzleError(false);
                }, 700);
            }
        };

        if (isDraggingPuzzle) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDraggingPuzzle, startX, puzzleX, targetPuzzleX]);

    // Action Triggering with Captcha
    const triggerSubmitWithCaptcha = (action: 'login' | 'register' | 'sms' | 'quick') => {
        if (!isAgreementChecked) {
            setShakeAgreement(true);
            setTimeout(() => setShakeAgreement(false), 600);
            return;
        }
        // Randomize target offset for captcha block
        setTargetPuzzleX(Math.floor(Math.random() * 100) + 110);
        setPuzzleX(0);
        setPendingAction(action);
        setIsPuzzleOpen(true);
    };

    // Callback executing verified submits
    const executePendingSubmit = () => {
        if (pendingAction === 'login') submitPasswordLogin();
        else if (pendingAction === 'register') submitPasswordRegister();
        else if (pendingAction === 'sms') submitSMSLogin();
        else if (pendingAction === 'quick') submitQuickLogin();
    };

    // Submits credentials to SQLite backend database
    const submitPasswordLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await authService.login({ username: formData.username, password: formData.password });
            if (res.success) {
                saveToHistoryList(res.user);
                triggerSuccessFlow(res.user);
            } else {
                setError(res.error || (lang === 'zh' ? '登录鉴权失败，请检查用户名或密码' : 'Sign in failed'));
            }
        } catch (err) {
            setError(lang === 'zh' ? '请求网关错误，请重试' : 'Node error, retry later.');
        } finally {
            setIsLoading(false);
        }
    };

    const submitPasswordRegister = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await authService.register(formData);
            if (res.success) {
                setMode('login');
                setError(lang === 'zh' ? '注册成功！已切换至登录窗口，请登录' : 'Registration completed. Sign in now.');
            } else {
                setError(res.error || 'Registration failed');
            }
        } catch (err) {
            setError('System registration error');
        } finally {
            setIsLoading(false);
        }
    };

    // Quick Login using stored cookie/credentials bypass
    const submitQuickLogin = async () => {
        if (!selectedUser) return;
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(r => setTimeout(r, 1000));
            // Simulate direct token validation
            localStorage.setItem('xh_token', 'mock_quick_token_' + selectedUser.id);
            localStorage.setItem('xh_user', JSON.stringify(selectedUser));
            authService['currentUser'] = selectedUser;
            authService['token'] = 'mock_quick_token_' + selectedUser.id;
            triggerSuccessFlow(selectedUser);
        } catch (err) {
            setError('Quick login failed');
        } finally {
            setIsLoading(false);
        }
    };

    // SMS Code Authenticator Logic
    const triggerSendSMS = () => {
        if (!formData.phone || formData.phone.length < 10) {
            setError(lang === 'zh' ? '请输入完整的手机号码' : 'Enter standard phone number');
            return;
        }
        setSmsTimer(60);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Timer countdown
        const interval = setInterval(() => {
            setSmsTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        setMockSmsBanner({
            code,
            message: lang === 'zh' 
                ? `【星河科创】您的短信验证码为: ${code}，用于快捷授权终端登录。请勿泄露给他人。` 
                : `[StarRiver Secure] Code ${code} for Terminal Access. Do not reveal.`
        });
    };

    const submitSMSLogin = async () => {
        if (!mockSmsBanner || formData.smsCode !== mockSmsBanner.code) {
            setError(lang === 'zh' ? '手机验证码输入错误或失效' : 'Invalid verification code');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(r => setTimeout(r, 1000));
            const mockUser: AuthUser = {
                id: 'phone_' + formData.phone.slice(-4),
                username: 'phone_' + formData.phone.slice(-4),
                name: `手机用户_${formData.phone.slice(-4)}`,
                className: '可信无线终端',
                category: 'service',
                avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${formData.phone}`,
                intro: '通过可信手机SIM硬件校验登录'
            };
            localStorage.setItem('xh_token', 'mock_jwt_phone_auth');
            localStorage.setItem('xh_user', JSON.stringify(mockUser));
            authService['currentUser'] = mockUser;
            authService['token'] = 'mock_jwt_phone_auth';
            saveToHistoryList(mockUser);
            triggerSuccessFlow(mockUser);
        } catch (e) {
            setError('Auth system fault');
        } finally {
            setIsLoading(false);
        }
    };

    // Appending profile to history users array
    const saveToHistoryList = (user: AuthUser) => {
        const saved = localStorage.getItem('xh_history_users');
        let list: AuthUser[] = saved ? JSON.parse(saved) : [];
        list = list.filter(u => u.username !== user.username);
        list.unshift(user);
        localStorage.setItem('xh_history_users', JSON.stringify(list));
        setHistoryUsers(list);
        setSelectedUser(user);
    };

    const deleteHistoryUser = (e: React.MouseEvent, username: string) => {
        e.stopPropagation();
        const updated = historyUsers.filter(u => u.username !== username);
        setHistoryUsers(updated);
        localStorage.setItem('xh_history_users', JSON.stringify(updated));
        if (selectedUser?.username === username) {
            setSelectedUser(updated.length > 0 ? updated[0] : null);
        }
    };

    const triggerSuccessFlow = (user: any) => {
        setSuccessUser(user);
        setTimeout(() => {
            onSuccess(user);
            onClose();
            resetStates();
        }, 1800);
    };

    const resetStates = () => {
        setFormData({
            username: '',
            password: '',
            name: '',
            className: '',
            category: 'core',
            memberCode: '',
            intro: '',
            phone: '',
            smsCode: ''
        });
        setMode('login');
        setAuthMethod('password');
        setError(null);
        setSuccessUser(null);
        setMockSmsBanner(null);
        setUseAnotherAccount(false);
    };

    // Puzzle UI Dragging helpers
    const handlePuzzleStart = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setIsDraggingPuzzle(true);
        setStartX(clientX - puzzleX);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 select-none overflow-hidden">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { resetStates(); onClose(); }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />

                    {/* Authenticator shell panel */}
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-4xl bg-[#090b14] border border-white/10 rounded-[30px] shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col md:flex-row h-auto md:h-[600px] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close key */}
                        <button 
                            onClick={() => { resetStates(); onClose(); }}
                            className="absolute top-5 right-5 z-55 text-white/40 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
                        >
                            <X size={18} />
                        </button>

                        {/* ==================== LEFT SHOWCASE ==================== */}
                        <div className="w-full md:w-[350px] bg-gradient-to-br from-slate-950 to-[#0c0f20] relative hidden md:flex flex-col justify-between p-8 border-r border-white/5 overflow-hidden">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full filter blur-[100px]" />
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold tracking-widest text-white uppercase font-sans">星河科创 ID</h3>
                                    <p className="text-[9px] text-white/30 tracking-wider">STAR RIVER SECURE GATE</p>
                                </div>
                            </div>

                            <div className="relative z-10 my-auto py-4">
                                <span className="px-2 py-0.5 text-[8px] font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                                    {lang === 'zh' ? '内部鉴权系统' : 'CORE SECURITY'}
                                </span>
                                <h2 className="text-xl font-black text-white mt-3 leading-snug tracking-tight">
                                    {lang === 'zh' ? '引领前沿发展 · 守护系统安全' : 'Advancing Frontiers, Guarding Networks'}
                                </h2>
                                <p className="text-[11px] text-white/45 leading-relaxed mt-2 font-light">
                                    {lang === 'zh' 
                                        ? '深度融合校内统一身份认证与星河自主滑动防御算法，提供毫秒级高吞吐量的高速鉴权连接。' 
                                        : 'Seamless integration with campus directory catalogs and active drag security puzzle guards.'}
                                </p>
                            </div>

                            <div className="relative z-10 pt-4 border-t border-white/5 flex items-center gap-2.5 text-[10px] text-white/30 font-mono">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>SERVER ONLINE (3000)</span>
                            </div>
                        </div>

                        {/* ==================== RIGHT PANEL ==================== */}
                        <div className="flex-1 flex flex-col justify-between p-7 md:p-10 bg-[#070912]/95 relative text-white">
                            
                            {/* QQ client diagonal style ribbon toggler */}
                            <div 
                                onClick={() => {
                                    if (authMethod === 'qrcode') {
                                        setAuthMethod('password');
                                    } else {
                                        setAuthMethod('qrcode');
                                        setError(null);
                                    }
                                }}
                                className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-600/30 hover:from-blue-600/50 to-transparent flex items-center justify-center cursor-pointer group z-40 transition-all rounded-bl-3xl border-l border-b border-white/5"
                                title={authMethod === 'qrcode' ? '密码登录' : '扫码登录'}
                            >
                                {authMethod === 'qrcode' ? (
                                    <Lock size={14} className="text-blue-400 group-hover:scale-110 transition-transform absolute top-3.5 right-3.5" />
                                ) : (
                                    <QrCode size={14} className="text-emerald-400 group-hover:scale-110 transition-transform absolute top-3.5 right-3.5" />
                                )}
                            </div>

                            {/* SUCCESS AUTHORIZATION LANDING COVER */}
                            <AnimatePresence>
                                {successUser && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 1.05 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-50 bg-[#090b14] flex flex-col items-center justify-center p-8 text-center"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                                            <CheckCircle2 size={32} className="text-emerald-400 animate-pulse" />
                                        </div>
                                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono">SESSION AUTHENTICATED</p>
                                        <h2 className="text-2xl font-black mt-2 tracking-tight">
                                            {lang === 'zh' ? `欢迎回归, ${successUser.name}` : `Welcome Back, ${successUser.name}`}
                                        </h2>
                                        <p className="text-xs text-white/40 mt-1 max-w-xs truncate">{successUser.intro || 'Star River Innovation hub member'}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* HEADER */}
                            <div>
                                <h2 className="text-xl font-extrabold tracking-tight">
                                    {mode === 'login' ? (lang === 'zh' ? '星河身份网关认证' : 'Member Gate Authenticate') : (lang === 'zh' ? '加入星河科技创新' : 'Request Registry Seats')}
                                </h2>
                                <p className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5">
                                    {mode === 'login' ? 'SECURE CONSOLE LOGIN PORTAL' : 'STUDENT MEMBERSHIP FORM'}
                                </p>

                                {/* Method options */}
                                {mode === 'login' && authMethod !== 'qrcode' && (
                                    <div className="flex gap-4 mt-5 border-b border-white/5 pb-2">
                                        <button 
                                            onClick={() => setAuthMethod('password')}
                                            className={`text-xs pb-1 transition-all font-semibold ${authMethod === 'password' ? 'text-blue-400 border-b-2 border-blue-500 font-bold' : 'text-white/40 hover:text-white/70'}`}
                                        >
                                            {lang === 'zh' ? '密码登录' : 'Password Mode'}
                                        </button>
                                        <button 
                                            onClick={() => setAuthMethod('sms')}
                                            className={`text-xs pb-1 transition-all font-semibold ${authMethod === 'sms' ? 'text-blue-400 border-b-2 border-blue-500 font-bold' : 'text-white/40 hover:text-white/70'}`}
                                        >
                                            {lang === 'zh' ? '手机验证码登录' : 'Mobile SMS Key'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* FORM INTERFACES MODULE SWITCHER */}
                            <div className="my-auto space-y-4 pt-4">
                                {error && (
                                    <div className={`p-3 rounded-xl text-xs flex gap-2 ${error.includes('成功') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/10'}`}>
                                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {/* --- 1. MOCK HISTORICAL QUICK ACCOUNT SWAPPER (QQ STYLE) --- */}
                                {mode === 'login' && authMethod === 'password' && historyUsers.length > 0 && selectedUser && !useAnotherAccount ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-5 text-center flex flex-col items-center"
                                    >
                                        <div className="relative group">
                                            <div className="absolute inset-x-0 -top-1 bottom-1 bg-blue-500/20 rounded-full filter blur animate-pulse" />
                                            <img 
                                                src={selectedUser.avatar} 
                                                className="w-20 h-20 rounded-full border-2 border-blue-500/50 p-1 bg-slate-950 relative z-10" 
                                                alt="avatar" 
                                            />
                                            <span className="absolute bottom-0 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 z-20 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold">{selectedUser.name}</h3>
                                            <p className="text-[10px] text-white/30 font-mono mt-0.5 flex justify-center items-center gap-1">
                                                <span>{selectedUser.className || '内部席位'}</span>
                                                <span>·</span>
                                                <span className="text-blue-400 uppercase">{selectedUser.category} Member</span>
                                            </p>
                                        </div>

                                        {/* Trigger action button */}
                                        <div className="w-full max-w-sm space-y-3">
                                            <button
                                                type="button"
                                                onClick={() => triggerSubmitWithCaptcha('quick')}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <span>{lang === 'zh' ? '一键快捷安全登录' : 'Quick Secure Access'}</span>
                                                <ArrowRight size={14} />
                                            </button>

                                            <div className="flex justify-between items-center text-[10px] text-white/35 px-1">
                                                <button 
                                                    onClick={() => setUseAnotherAccount(true)}
                                                    className="hover:text-white hover:underline transition-all"
                                                >
                                                    {lang === 'zh' ? '使用其他用户名登录' : 'Use password login'}
                                                </button>
                                                <span>|</span>
                                                <button 
                                                    onClick={() => setMode('register')}
                                                    className="hover:text-white hover:underline transition-all"
                                                >
                                                    {lang === 'zh' ? '新成员资料注册' : 'Create new seat'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dropdown list of secondary accounts */}
                                        {historyUsers.length > 1 && (
                                            <div className="w-full max-w-sm pt-4 border-t border-white/5 space-y-2">
                                                <p className="text-[9px] text-white/35 uppercase text-left tracking-wider pl-1 font-mono">切换其他历史已存账户</p>
                                                <div className="flex gap-2 justify-start overflow-x-auto pb-1 max-w-full">
                                                    {historyUsers.map((u) => (
                                                        <div 
                                                            key={u.username}
                                                            onClick={() => setSelectedUser(u)}
                                                            className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer shrink-0 transition-all ${selectedUser.username === u.username ? 'bg-blue-600/15 border-blue-500 text-white' : 'bg-white/[0.01] border-white/5 text-white/50 hover:text-white/80'}`}
                                                        >
                                                            <img src={u.avatar} className="w-5 h-5 rounded-full" alt="avatar" />
                                                            <span className="text-[10px] font-medium max-w-[80px] truncate">{u.name.split(' ')[0]}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={(e) => deleteHistoryUser(e, u.username)}
                                                                className="text-white/20 hover:text-red-400 p-0.5 rounded transition-colors ml-1"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    /* --- 2. PASSWORD LOGIN FORM / APPLICATION SUBMISSIONS --- */
                                    authMethod === 'password' && (
                                        <form onSubmit={(e) => { e.preventDefault(); triggerSubmitWithCaptcha(mode === 'login' ? 'login' : 'register'); }} className="space-y-3.5">
                                            
                                            {/* Username field */}
                                            <div>
                                                <label className="block text-[10px] text-white/40 uppercase tracking-widest pl-1 font-semibold mb-1">
                                                    {lang === 'zh' ? '账号用户名 (拼音/数字码)' : 'Username credentials'}
                                                </label>
                                                <div className="relative">
                                                    <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={formData.username}
                                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                                        placeholder={lang === 'zh' ? "如: wangxiaoming" : "E.g. wangxiaoming"}
                                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-normal outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Password Field */}
                                            <div>
                                                <label className="block text-[10px] text-white/40 uppercase tracking-widest pl-1 font-semibold mb-1">
                                                    {lang === 'zh' ? '系统访问鉴权密码' : 'Secret password key'}
                                                </label>
                                                <div className="relative">
                                                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                                                    <input 
                                                        type={isPasswordVisible ? "text" : "password"} 
                                                        required
                                                        value={formData.password}
                                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                                        placeholder="••••••••"
                                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs outline-none focus:border-blue-500/50 transition-all"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60"
                                                    >
                                                        {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Extra register profile configuration fields */}
                                            <AnimatePresence>
                                                {mode === 'register' && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="space-y-3 pt-1 overflow-hidden"
                                                    >
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[9px] text-white/40 uppercase tracking-wider mb-1 pl-1">真实姓名</label>
                                                                <input 
                                                                    type="text" required
                                                                    value={formData.name}
                                                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-blue-500/50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[9px] text-white/40 uppercase tracking-wider mb-1 pl-1">专业班级</label>
                                                                <input 
                                                                    type="text" required
                                                                    value={formData.className}
                                                                    onChange={e => setFormData({...formData, className: e.target.value})}
                                                                    placeholder="安全23-2"
                                                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-blue-500/50"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[9px] text-white/40 uppercase tracking-wider mb-1 pl-1">一句话简介</label>
                                                            <input 
                                                                type="text"
                                                                value={formData.intro}
                                                                onChange={e => setFormData({...formData, intro: e.target.value})}
                                                                placeholder="日常科创分工或负责模块"
                                                                className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-blue-500/50"
                                                            />
                                                        </div>

                                                        <div>
                                                            <div className="flex justify-between items-center pl-1 mb-1">
                                                                <label className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">内部加入邀请码 (Secure Token)</label>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setFormData({...formData, memberCode: 'XINGHE2026'})}
                                                                    className="text-[8px] text-blue-400 hover:underline"
                                                                >
                                                                    点此自动填入默认测试码
                                                                </button>
                                                            </div>
                                                            <input 
                                                                type="text" required
                                                                value={formData.memberCode}
                                                                onChange={e => setFormData({...formData, memberCode: e.target.value})}
                                                                placeholder="XINGHE2026"
                                                                className="w-full bg-[#faaf00]/[0.02] border border-amber-500/20 text-[#ffb000] rounded-xl py-2.5 px-3 text-xs outline-none font-bold placeholder:text-white/10 placeholder:font-normal focus:border-amber-500"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Form Button */}
                                            <button 
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none mt-4 cursor-pointer"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin text-white" size={14} /> : (
                                                    <>
                                                        <span>{mode === 'login' ? '安全鉴权登录' : '提交星河档案并注册'}</span>
                                                        <ArrowRight size={13} />
                                                    </>
                                                )}
                                            </button>

                                            {/* Link switcher links */}
                                            <div className="flex gap-2 justify-between items-center text-[10px] text-white/35 pt-1 px-1">
                                                <button 
                                                    type="button" 
                                                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                                                    className="hover:text-white hover:underline transition-all"
                                                >
                                                    {mode === 'login' ? '没有账户？即刻申请新席位加入 ✨' : '已有星河活跃席位？立即直接登录 🔑'}
                                                </button>
                                                {historyUsers.length > 0 && mode === 'login' && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setUseAnotherAccount(false)}
                                                        className="text-blue-400 hover:underline hover:text-blue-300"
                                                    >
                                                        返回快捷登录
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    )
                                )}

                                {/* --- 3. SMS PHONE MODULE --- */}
                                {mode === 'login' && authMethod === 'sms' && (
                                    <form onSubmit={(e) => { e.preventDefault(); triggerSubmitWithCaptcha('sms'); }} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-1 pl-1">
                                                11位手机号码 (SIM Hardware Verify)
                                            </label>
                                            <div className="relative">
                                                <Smartphone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                                                <input 
                                                    type="tel" required
                                                    value={formData.phone}
                                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                                    placeholder="13800138000"
                                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-3 pl-10 pr-24 text-xs outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all"
                                                />
                                                <button 
                                                    type="button"
                                                    disabled={smsTimer > 0}
                                                    onClick={triggerSendSMS}
                                                    className="absolute right-2 top-1.5 bottom-1.5 px-3 rounded-lg text-[10px] max-w-[120px] font-bold bg-blue-600 text-white disabled:bg-white/10 disabled:text-white/30 transition-all select-none hover:bg-blue-500 cursor-pointer"
                                                >
                                                    {smsTimer > 0 ? `${smsTimer}s` : '获取验证码'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Verification Code */}
                                        <div>
                                            <label className="block text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-1 pl-1">
                                                手机短信验证码
                                            </label>
                                            <div className="relative">
                                                <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                                                <input 
                                                    type="text" required
                                                    value={formData.smsCode}
                                                    onChange={e => setFormData({...formData, smsCode: e.target.value})}
                                                    placeholder="输入6位短信验证码"
                                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-3 pl-10 text-xs outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : (
                                                <>
                                                    <span>短信快捷登录</span>
                                                    <ArrowRight size={13} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}

                                {/* --- 4. WECHAT SCAN MODE (QQ STYLE SCAN) --- */}
                                {mode === 'login' && authMethod === 'qrcode' && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-1 flex flex-col items-center justify-center text-center space-y-4"
                                    >
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <QrCode size={16} className="text-emerald-400" />
                                            <span>企业微信安全扫码</span>
                                        </h3>
                                        <p className="text-[11px] text-white/45 max-w-xs leading-relaxed font-light">
                                            请使用企业微信扫一扫扫描下方由星河盾生成的一次性动态安全令牌
                                        </p>

                                        {/* Dual scanner target image */}
                                        <div 
                                            onClick={() => triggerSuccessFlow({
                                                id: 'wechat_scan',
                                                username: 'wechat_member',
                                                name: '扫码达人 (微信接入)',
                                                className: '安全23-2班',
                                                category: 'core',
                                                avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=scan_auth',
                                                intro: '通过统一终端扫码互认鉴权成功'
                                            })}
                                            className="w-40 h-40 bg-white p-2.5 rounded-2xl relative shadow-2xl hover:scale-105 transition-all outline outline-emerald-500/40 overflow-hidden group cursor-pointer"
                                        >
                                            <img 
                                                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=StarRiverSecureScan" 
                                                className="w-full h-full object-contain filter brightness-95" 
                                                alt="QR scanner" 
                                            />
                                            {/* Dynamic scan line laser */}
                                            <motion.div 
                                                animate={{ top: ['4%', '96%', '4%'] }}
                                                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                                                className="absolute left-0 right-0 h-0.5 bg-green-500/80 shadow-[0_0_10px_#22c55e]"
                                            />
                                            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                                <p className="text-[9px] text-[#22c55e] font-bold">模拟环境手机扫码</p>
                                                <p className="text-[8px] text-white/50 mt-1">点击直接登录</p>
                                            </div>
                                        </div>

                                        <p className="text-[10px] text-emerald-400/80 font-mono tracking-wider flex items-center gap-1">
                                            <RefreshCw size={11} className="animate-spin text-emerald-400" />
                                            <span>动态终端二维码安全监听中...</span>
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            {/* ==================== FOOTER AGREEMENTS ==================== */}
                            {mode === 'login' && authMethod !== 'qrcode' && (
                                <div className="mt-6 pt-4 border-t border-white/5">
                                    {/* Checklist compliance block */}
                                    <motion.div 
                                        animate={shakeAgreement ? { x: [-6, 6, -6, 6, 0] } : {}}
                                        transition={{ duration: 0.4 }}
                                        className="flex gap-2.5 items-start text-[10px]"
                                    >
                                        <input 
                                            type="checkbox"
                                            id="agree_box"
                                            checked={isAgreementChecked}
                                            onChange={(e) => setIsAgreementChecked(e.target.checked)}
                                            className={`mt-0.5 rounded border-white/25 bg-white/[0.04] text-blue-500 focus:ring-0 cursor-pointer w-3.5 h-3.5 transition-all ${!isAgreementChecked && shakeAgreement ? 'outline outline-1 outline-red-500' : ''}`}
                                        />
                                        <label htmlFor="agree_box" className="text-white/40 leading-relaxed hover:text-white/60 transition-colors cursor-pointer select-none">
                                            我已认真阅读并同意 
                                            <button type="button" onClick={() => setShowTermsOverlay('service')} className="text-blue-400 hover:underline mx-0.5 font-bold">《星河网关系统使用守则》</button> 
                                            与 
                                            <button type="button" onClick={() => setShowTermsOverlay('privacy')} className="text-blue-400 hover:underline mx-0.5 font-bold">《自主安全防泄密承诺书》</button>
                                        </label>
                                    </motion.div>
                                </div>
                            )}

                        </div>
                    </motion.div>

                    {/* ==================================================== */}
                    {/* OVERLAYS: Gorgeous SMS Simulated Notifications Banner */}
                    {/* ==================================================== */}
                    <AnimatePresence>
                        {mockSmsBanner && (
                            <motion.div 
                                initial={{ opacity: 0, y: -60, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -40 }}
                                className="fixed top-6 left-1/2 -translate-x-1/2 z-[1100] w-full max-w-md bg-slate-900/95 border border-blue-500/30 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <Smartphone size={16} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                <span>智能模拟手机短信网关</span>
                                                <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded uppercase">VIRTUAL SMS</span>
                                            </h4>
                                            <p className="text-[11px] text-white/70 leading-relaxed mt-1">{mockSmsBanner.message}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setMockSmsBanner(null)}
                                        className="text-white/40 hover:text-white pb-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="mt-3 flex gap-2 justify-end">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, smsCode: mockSmsBanner.code }));
                                            setMockSmsBanner(null);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold py-1 px-3 rounded"
                                    >
                                        一键自动复制并填充 (Fill Input)
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ==================================================== */}
                    {/* OVERLAYS: Standalone Drag Sliding Captcha Shield      */}
                    {/* ==================================================== */}
                    <AnimatePresence>
                        {isPuzzleOpen && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-[#060813]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
                            >
                                <div className={`w-80 bg-[#0c0f1d] border border-white/10 rounded-2xl p-4 shadow-2xl relative ${puzzleError ? 'animate-shake' : ''}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                            <CheckCircle2 className="text-blue-400" size={13} />
                                            <span>星河安全盾 · 滑块人机校验</span>
                                        </span>
                                        <button 
                                            onClick={() => { setIsPuzzleOpen(false); setPuzzleX(0); setPuzzleError(false); }}
                                            className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/5"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Starry Galaxy gradient canvas simulation */}
                                    <div className="h-32 bg-gradient-to-br from-[#121932] via-[#0b0f22] to-[#161c36] rounded-xl relative overflow-hidden flex items-center justify-center border border-white/5">
                                        {/* Radiant graphics */}
                                        <div className="absolute inset-[24px] bg-indigo-500/10 filter blur-xl" />
                                        <div className="absolute top-4 left-6 w-1 h-1 rounded-full bg-white/40 animate-ping" />
                                        <div className="absolute bottom-6 right-16 w-1 h-1 rounded-full bg-blue-400/40" />
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:14px_14px]" />

                                        {/* Target Outlined socket shape hole */}
                                        <div 
                                            style={{ left: `${targetPuzzleX}px` }}
                                            className="absolute w-10 h-10 border border-emerald-500/50 bg-emerald-500/25 rounded-xl flex items-center justify-center shadow-[inset_0_0_10px_rgba(16,185,129,0.3)] z-10 transition-all"
                                        >
                                            <Lock size={12} className="text-emerald-400 animate-pulse" />
                                        </div>

                                        {/* Movable draggable slider piece block */}
                                        <div 
                                            style={{ left: `${puzzleX}px` }}
                                            className="absolute w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20 transition-transform z-20"
                                        >
                                            <Sparkles size={14} className="text-white" />
                                        </div>

                                        {/* Dynamic Success overlay */}
                                        {puzzleSuccess && (
                                            <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center z-30">
                                                <CheckCircle2 size={32} className="text-white animate-bounce" />
                                                <p className="text-xs font-bold text-white mt-1">校验成功 (Passed)</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Handle sliding drag track */}
                                    <div className="mt-4 relative h-8 bg-white/[0.03] border border-white/5 rounded-full flex items-center select-none overflow-hidden">
                                        <div 
                                            style={{ width: `${puzzleX + 20}px` }}
                                            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-600/20 to-indigo-500/30 border-r border-indigo-500/40"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[9px] text-white/30 tracking-wider">👉 向右滑动滑块完成对齐拼图</span>
                                        </div>

                                        <div 
                                            onMouseDown={handlePuzzleStart}
                                            onTouchStart={handlePuzzleStart}
                                            style={{ left: `${puzzleX}px` }}
                                            className="absolute top-0 bottom-0 w-12 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full border border-white/25 flex items-center justify-center cursor-ew-resize shadow-md hover:from-blue-400 hover:to-indigo-500 active:scale-95 transition-transform z-30"
                                        >
                                            <ArrowRight size={14} className="text-white" />
                                        </div>
                                    </div>

                                    {/* Bottom status alert row */}
                                    <div className="mt-3 flex justify-between items-center text-[10px] pl-1 select-none font-mono">
                                        <span className={puzzleError ? 'text-red-400 font-bold' : 'text-white/30'}>
                                            {puzzleError ? '拼图坐标不对，请重试 ×' : '智能云鉴权防刷护盾'}
                                        </span>
                                        <button 
                                            onClick={() => { setPuzzleX(0); setPuzzleError(false); }}
                                            className="hover:text-white flex items-center gap-1 hover:bg-white/5 px-2 py-0.5 rounded transition-all text-white/40"
                                        >
                                            <RefreshCw size={9} /> Reset
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ==================================================== */}
                    {/* OVERLAYS: Document Interactive Regulations Scroll */}
                    {/* ==================================================== */}
                    <AnimatePresence>
                        {showTermsOverlay !== 'none' && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/95 z-55 flex flex-col p-6 overflow-y-auto"
                            >
                                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4 select-none">
                                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <FileText size={16} className="text-blue-400" />
                                        <span>
                                            {showTermsOverlay === 'service' ? '星河科创：终端服务使用公约' : '星河科创：信息自主安全保密守则'}
                                        </span>
                                    </h3>
                                    <button 
                                        onClick={() => setShowTermsOverlay('none')}
                                        className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/5"
                                    >
                                        ✕ 关闭阅读 (Close)
                                    </button>
                                </div>
                                <div className="space-y-4 text-xs font-light leading-relaxed text-white/75 overflow-y-auto pr-1">
                                    {showTermsOverlay === 'service' ? (
                                        <>
                                            <p className="font-bold text-white text-sm">【一、星河网络安全与行为条款】</p>
                                            <p>所有常驻成员及临时终端访问人，必须遵守协会校内科技探索指南。禁止利用该客户端泄露系统开发代码；禁止滥用WebSocket网关连接，亦禁止针对协会内部数据库进行自动化嗅探与漏洞测试。</p>
                                            <p className="font-bold text-white text-sm">【二、数据保护与共享政策】</p>
                                            <p>星河科创网关收集的所有用户简介、头像照片及常驻分类，仅存储于隔离容器内部。用户退出登录或删除历史账号时，本地所有相关JWT会话令牌及历史记录将被一键清空。</p>
                                            <p>点击“同意本守则”代表您自愿服从星河科创指导委员会的一切学联统筹。</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold text-white text-sm">【一、红蓝攻防及涉密协议声明】</p>
                                            <p>本协议属于星河科创卓越人才孵化保密条件之一。任何获评卓越核心席位的技术研发人员，在研究智能硬件巡检、红外图形识别、网络隔离穿透等技术模块时，禁止未经网络中心授权私自对外分发接口或软件程序。</p>
                                            <p className="font-bold text-white text-sm">【二、个人信息与认证声明书】</p>
                                            <p>本系统采用高强度哈希加盐密码算法保护您的登陆安全，用户密码传输经高保真隔离封装，以确保护盾在公共部署环境下不发生敏感数据外泄。任何测试数据将于测试周期结束后自动销毁归档。</p>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            )}
        </AnimatePresence>
    );
};

export default MemberAuthModal;
