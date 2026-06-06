import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, User, Lock, ArrowRight, Loader2, Eye, EyeOff, Check, 
    Sparkles, ArrowLeft, CheckCircle2, RefreshCw, 
    Smartphone, Phone, FileText, ShieldAlert, Mail
} from 'lucide-react';
import { authService, User as AuthUser } from '../services/authService';
import { wechatService } from '../services/wechatService';

interface MemberAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
    lang: 'zh' | 'en';
}

type AuthMethod = 'password' | 'email' | 'sms' | 'mp';

const SHOWCASE_PHOTOS = [
    {
        src: '/images/img2317.jpg',
        titleZh: '安全工程专业',
        titleEn: 'Safety Engineering Major',
        descZh: '深耕工业系统安全风险分析、灾害防控及智慧检测，夯实安全生产技术根基。'
    },
    {
        src: '/images/img2904.jpg',
        titleZh: '能源化学专业',
        titleEn: 'Energy & Chemistry Major',
        descZh: '主攻新型清洁能源转化、先进化学工程材料以及工业生产过程中的安全环保化学技术。'
    },
    {
        src: '/images/img34d0.jpg',
        titleZh: '应急技术与管理专业',
        titleEn: 'Emergency Technology & Management Major',
        descZh: '研究并整合多物理场灾害预警、全过程应急管理信息化与智能协同指挥决策。'
    }
];

const MemberAuthModal: React.FC<MemberAuthModalProps> = ({ isOpen, onClose, onSuccess, lang }) => {
    // OS Browser Simulator Integration State
    const [browserView, setBrowserView] = useState<'portal' | 'authgate'>('authgate');
    const [browserActiveTab, setBrowserActiveTab] = useState<'jwzx' | 'xinghe' | 'webvpn'>('webvpn');
    const [browserLoading, setBrowserLoading] = useState(false);
    const [browserLoadingProgress, setBrowserLoadingProgress] = useState(0);
    const [browserUrlField, setBrowserUrlField] = useState('webvpn.lntu.edu.cn/https/77726476706e69737468656265737421f1e2559434357a467b1ac7a09641367b918300a4219f/authserver/login?service=https%3A%2F%2Fwebvpn.lntu.edu.cn%2Flogin%3Fcas_login%3Dtrue');

    // Simulated SSO CAS Redirect States
    const [isPortalAuthenticated, setIsPortalAuthenticated] = useState(false);
    const [portalUser, setPortalUser] = useState<any | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [redirectStatusText, setRedirectStatusText] = useState('');

    // Basic control states
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successUser, setSuccessUser] = useState<any | null>(null);

    // Mini Program WeChat QR states
    const [mpUuid, setMpUuid] = useState<string | null>(null);
    const [isMpLoading, setIsMpLoading] = useState(false);
    const [mpStatus, setMpStatus] = useState<'pending' | 'confirmed' | 'expired'>('pending');
    const [mockMpClientOpen, setMockMpClientOpen] = useState(false);
    const [simulatedNickname, setSimulatedNickname] = useState('星河学术探针');
    const [simulatedOpenid, setSimulatedOpenid] = useState('mp_user_99a8');
    const [simulatedEmail, setSimulatedEmail] = useState('');
    const [qrMode, setQrMode] = useState<'standard' | 'raw'>('standard');

    // Forms
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        className: '',
        category: 'core',
        memberCode: '',
        intro: '',
        phone: '',
        smsCode: '',
        email: '',
        emailCode: ''
    });

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [showTermsOverlay, setShowTermsOverlay] = useState<'none' | 'service' | 'privacy'>('none');
    
    // Quick Account Swappers
    const [historyUsers, setHistoryUsers] = useState<AuthUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
    const [useAnotherAccount, setUseAnotherAccount] = useState(false);

    // Captcha States
    const [isAgreementChecked, setIsAgreementChecked] = useState(true);
    const [shakeAgreement, setShakeAgreement] = useState(false);
    const [isPuzzleOpen, setIsPuzzleOpen] = useState(false);
    const [puzzleX, setPuzzleX] = useState(0);
    const [targetPuzzleX, setTargetPuzzleX] = useState(130);
    const [isDraggingPuzzle, setIsDraggingPuzzle] = useState(false);
    const [puzzleError, setPuzzleError] = useState(false);
    const [puzzleSuccess, setPuzzleSuccess] = useState(false);
    const [startX, setStartX] = useState(0);
    const [pendingAction, setPendingAction] = useState<'login' | 'register' | 'sms' | 'quick' | 'email'>('login');

    // Virtual Notification Toasts
    const [smsTimer, setSmsTimer] = useState(0);
    const [mockSmsBanner, setMockSmsBanner] = useState<{ code: string; message: string } | null>(null);
    const [emailTimer, setEmailTimer] = useState(0);
    const [mockEmailBanner, setMockEmailBanner] = useState<{ code: string; message: string } | null>(null);

    // Browser Simulator redirect timeline
    const triggerRedirectToCas = () => {
        setBrowserLoading(true);
        setBrowserLoadingProgress(15);
        let progress = 15;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 20) + 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setBrowserActiveTab('webvpn');
                setBrowserView('authgate');
                setBrowserUrlField('webvpn.lntu.edu.cn/https/77726476706e69737468656265737421f1e2559434357a467b1ac7a09641367b918300a4219f/authserver/login?service=https%3A%2F%2Fwebvpn.lntu.edu.cn%2Flogin%3Fcas_login%3Dtrue');
                setBrowserLoading(false);
            }
            setBrowserLoadingProgress(progress);
        }, 100);
    };

    // Auto states reset
    useEffect(() => {
        if (isOpen) {
            setBrowserView('authgate');
            setBrowserActiveTab('webvpn');
            setBrowserLoading(false);
            setBrowserLoadingProgress(0);
            setBrowserUrlField('webvpn.lntu.edu.cn/https/77726476706e69737468656265737421f1e2559434357a467b1ac7a09641367b918300a4219f/authserver/login?service=https%3A%2F%2Fwebvpn.lntu.edu.cn%2Flogin%3Fcas_login%3Dtrue');
            resetStates();
        }
    }, [isOpen]);

    // Live sync wechat MP connection rules
    useEffect(() => {
        if (!isOpen || authMethod !== 'mp' || mode !== 'login') return;

        let unsubscribe: (() => void) | null = null;
        let isCurrent = true;

        const startMpSession = async () => {
            setIsMpLoading(true);
            setError(null);
            try {
                const session = await wechatService.initMpSession();
                if (!isCurrent) return;
                setMpUuid(session.uuid);
                setMpStatus('pending');

                unsubscribe = wechatService.subscribeToMpSync(
                    session.uuid,
                    (payload: { token: string; user: any }) => {
                        if (!isCurrent) return;
                        setMpStatus('confirmed');
                        localStorage.setItem('xh_token', payload.token);
                        localStorage.setItem('xh_user', JSON.stringify(payload.user));
                        saveToHistoryList(payload.user);
                        onSuccess(payload.user);
                        onClose();
                    },
                    (err) => console.error('WeChat Sync fail:', err)
                );
            } catch (err: any) {
                if (isCurrent) setError('初始化微信小程序网关服务失败');
            } finally {
                if (isCurrent) setIsMpLoading(false);
            }
        };

        startMpSession();
        return () => {
            isCurrent = false;
            if (unsubscribe) unsubscribe();
        };
    }, [isOpen, authMethod, mode]);

    // History login cache config
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
                    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=lupeng&backgroundColor=b6e3f4,c0aede,d1d4f9&hairColor=000000,101010&skinColor=ffd1a9,f1c27d,e8b584',
                    intro: '星河科创核心组长 · 快捷终端一键授权'
                },
                {
                    id: '10002',
                    username: 'wangax',
                    name: '王傲星 (安全运维)',
                    className: '信安24-1班',
                    category: 'core',
                    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=wangax&backgroundColor=b6e3f4,c0aede,d1d4f9&hairColor=000000,101010&skinColor=ffd1a9,f1c27d,e8b584',
                    intro: '星河网络防御中心讲师 · 本地快捷登录'
                }
            ];
            setHistoryUsers(defaults);
            setSelectedUser(defaults[0]);
            localStorage.setItem('xh_history_users', JSON.stringify(defaults));
        }
    }, [isOpen]);

    // Timers
    useEffect(() => {
        if (smsTimer > 0) {
            const t = setTimeout(() => setSmsTimer(smsTimer - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [smsTimer]);

    useEffect(() => {
        if (emailTimer > 0) {
            const t = setTimeout(() => setEmailTimer(emailTimer - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [emailTimer]);

    // Move sliding puzzle
    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDraggingPuzzle) return;
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const deltaX = clientX - startX;
            setPuzzleX(Math.max(0, Math.min(220, deltaX)));
        };

        const handleUp = () => {
            if (!isDraggingPuzzle) return;
            setIsDraggingPuzzle(false);
            if (Math.abs(puzzleX - targetPuzzleX) <= 6) {
                setPuzzleSuccess(true);
                setPuzzleError(false);
                setTimeout(() => {
                    setIsPuzzleOpen(false);
                    setPuzzleSuccess(false);
                    setPuzzleX(0);
                    executePendingSubmit();
                }, 800);
            } else {
                setPuzzleError(true);
                setTimeout(() => {
                    setPuzzleX(0);
                    setPuzzleError(false);
                }, 600);
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

    const saveToHistoryList = (user: AuthUser) => {
        const updated = [user, ...historyUsers.filter(u => u.username !== user.username)].slice(0, 4);
        setHistoryUsers(updated);
        localStorage.setItem('xh_history_users', JSON.stringify(updated));
    };

    const triggerSubmitWithCaptcha = (action: 'login' | 'register' | 'sms' | 'quick' | 'email') => {
        if (!isAgreementChecked) {
            setShakeAgreement(true);
            setTimeout(() => setShakeAgreement(false), 600);
            return;
        }
        setTargetPuzzleX(Math.floor(Math.random() * 100) + 110);
        setPuzzleX(0);
        setPendingAction(action);
        setIsPuzzleOpen(true);
    };

    const executePendingSubmit = () => {
        if (pendingAction === 'login') submitPasswordLogin();
        else if (pendingAction === 'register') submitPasswordRegister();
        else if (pendingAction === 'sms') submitSMSLogin();
        else if (pendingAction === 'quick') submitQuickLogin();
        else if (pendingAction === 'email') submitEmailLogin();
    };

    const submitPasswordLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await authService.login({ username: formData.username, password: formData.password });
            if (res.success) {
                saveToHistoryList(res.user);
                triggerSuccessFlow(res.user);
            } else {
                setError(res.error || '登录鉴权失败，请检查用户名或密码');
            }
        } catch (_) {
            setError('物理通道网关异常');
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
                setError('注册成功！已切换至统一CAS密码登入通道');
            } else {
                setError(res.error || '注册失败');
            }
        } catch (_) {
            setError('档案递交失败，请检查参数或邀请码。');
        } finally {
            setIsLoading(false);
        }
    };

    const submitSMSLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await authService.loginWithSms(formData.phone, formData.smsCode);
            if (res.success) {
                saveToHistoryList(res.user);
                triggerSuccessFlow(res.user);
            } else {
                setError(res.error || '短信校验密钥无效');
            }
        } catch (_) {
            setError('验证短报文鉴权阻断');
        } finally {
            setIsLoading(false);
        }
    };

    const submitEmailLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await authService.loginWithEmail(formData.email, formData.emailCode);
            if (res.success) {
                saveToHistoryList(res.user);
                triggerSuccessFlow(res.user);
            } else {
                setError(res.error || '邮箱安全验证密码不匹配');
            }
        } catch (_) {
            setError('安全邮件隧道传输错误');
        } finally {
            setIsLoading(false);
        }
    };

    const submitQuickLogin = async () => {
        if (!selectedUser) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await authService.loginQuick(selectedUser.username);
            if (res.success) {
                triggerSuccessFlow(res.user);
            } else {
                setError(res.error || '快速登录密钥会话已过期');
            }
        } catch (_) {
            setError('缓存快速登录读取阻断');
        } finally {
            setIsLoading(false);
        }
    };

    const triggerSuccessFlow = (user: any) => {
        setSuccessUser(user);
        setIsRedirecting(true);
        setRedirectStatusText('CAS 统一身份网关授权成功！已生成安全服务票据 Token...');
        
        // Step 1: Simulated verification
        setTimeout(() => {
            setRedirectStatusText('正在对主程序「星河安全学术科研舱」进行安全令牌回调...');
            setBrowserLoading(true);
            setBrowserLoadingProgress(60);
        }, 600);

        // Step 2: Final entry to association workspace
        setTimeout(() => {
            setBrowserLoadingProgress(100);
            setBrowserLoading(false);
            setIsRedirecting(false);
            onSuccess(user);
            onClose();
            resetStates();
        }, 1300);
    };

    const sendSmsCode = async () => {
        if (!formData.phone) {
            setError('请输入手机号码以分发验证短信');
            return;
        }
        setSmsTimer(60);
        setError(null);
        try {
            const res = await authService.sendSmsVerify(formData.phone);
            if (res.success && res.code) {
                setMockSmsBanner({
                    code: res.code,
                    message: `【星河盾科创网关】尊敬的成员您好，您的统一验证登录验证码为：${res.code}。验证码3分钟内有效，请勿泄露。`
                });
            } else {
                setError(res.error || '下发短信令牌受限');
            }
        } catch (_) {
            setError('网关信令分发异常');
        }
    };

    const sendEmailCode = async () => {
        if (!formData.email) {
            setError('请输入认证电子邮箱');
            return;
        }
        setEmailTimer(60);
        setError(null);
        try {
            const res = await authService.sendEmailVerify(formData.email);
            if (res.success && res.code) {
                setMockEmailBanner({
                    code: res.code,
                    message: `【星河身份网关】统一验证密令分发，您的邮箱校验码为 ${res.code}。请在当前虚拟浏览器表单中提交校验，星河防泄密保卫部提醒。`
                });
            } else {
                setError(res.error || '该邮箱未能在组织档案网内检索到匹配项，请点击注册');
            }
        } catch (_) {
            setError('分发认证邮件时网内断开');
        }
    };

    const resetStates = () => {
        setFormData({
            username: '', password: '', name: '', className: '',
            category: 'core', memberCode: '', intro: '',
            phone: '', smsCode: '', email: '', emailCode: ''
        });
        setMode('login');
        setAuthMethod('password');
        setError(null);
        setSuccessUser(null);
        setMockSmsBanner(null);
        setMockEmailBanner(null);
        setUseAnotherAccount(false);
        setIsPortalAuthenticated(false);
        setPortalUser(null);
        setIsRedirecting(false);
        setRedirectStatusText('');
    };

    const handlePuzzleStart = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setIsDraggingPuzzle(true);
        setStartX(clientX - puzzleX);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] w-screen h-screen bg-[#04060f] flex flex-col overflow-hidden text-slate-100 select-none font-sans">
            {/* Top Browser Applet Bar Chrome (Safari/Chrome Simulator Style) */}
            <div className="bg-[#111424] border-b border-white/5 py-2 px-4 flex flex-col gap-1.5 shrink-0 z-20 relative select-none">
                <div className="flex items-center justify-between">
                    {/* Operating System Dot Actions (macOS style decoration) */}
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={onClose}
                            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center justify-center text-[7px] text-red-950 font-bold"
                        >
                            ✕
                        </button>
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                        <span className="font-mono text-[9px] text-slate-500 hidden sm:inline ml-1.5 uppercase tracking-widest">Gateway Engine v5.1</span>
                    </div>

                    {/* Window Name Label */}
                    <div className="text-[10.5px] text-white/50 font-mono tracking-wider truncate bg-black/20 border border-white/5 px-4.5 py-0.5 rounded-full select-all">
                        {browserView === 'portal' ? 'Xinghe Educational Online System' : '安全科技创新协会验证'}
                    </div>

                    {/* End Indicator */}
                    <div className="flex items-center gap-1.5 text-[9px] text-[#4ade80] font-mono leading-none select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                        <span>SSL ENCRYPTED</span>
                    </div>
                </div>

                {/* Simulated Tabs (matches user screenshot 3) */}
                <div className="flex items-end gap-1 -mb-2 pt-1 scrollbar-none overflow-x-auto select-none">
                    <button 
                        onClick={() => { resetStates(); onClose(); }}
                        className="px-3.5 py-1 rounded-t-lg text-[10.5px] font-semibold flex items-center gap-1.5 text-slate-400 hover:text-slate-200 bg-black/10 hover:bg-[#15192c] transition-colors cursor-pointer"
                    >
                        <Sparkles size={11} className="text-blue-400" />
                        <span>星河科技创新协会 HP</span>
                    </button>
                    {browserView === 'authgate' && (
                        <div className="px-4 py-1.5 rounded-t-lg text-[10.5px] font-extrabold flex items-center gap-1.5 bg-[#161a35] text-[#39ff14] border-t border-x border-white/5 select-none animate-fade-in animate-pulse">
                            <Lock size={10} className="text-[#39ff14]" />
                            <span>安全科技创新协会验证</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Browser Navigation URL controls Bar (matches screenshot 3) */}
            <div className="bg-[#161a35] border-b border-white/5 px-4 py-2 flex items-center gap-3 shrink-0 z-10 select-none">
                <div className="flex items-center gap-2 text-slate-400 shrink-0">
                    <button 
                        disabled={true} 
                        className="p-1 px-1.5 rounded bg-black/10 opacity-30 cursor-not-allowed text-xs"
                    >
                        🗙
                    </button>
                    <button 
                        onClick={() => {
                            setBrowserLoading(true);
                            setBrowserLoadingProgress(100);
                            setTimeout(() => setBrowserLoading(false), 300);
                        }}
                        className="p-1 px-1.5 rounded bg-black/20 hover:bg-black/40 cursor-pointer text-xs"
                    >
                        ↺
                    </button>
                </div>

                {/* Fully Editable Address Input Field */}
                <div className="flex-1 bg-black/45 border border-white/15 rounded-lg py-1.5 px-3.5 text-xs text-white/90 font-sans flex items-center gap-1.5 shadow-inner overflow-hidden select-all">
                    <Lock size={11} className="text-[#39ff14]" />
                    <span className="flex-1 font-bold text-slate-100 text-[11px] tracking-wide">安全科技创新协会验证</span>
                </div>
            </div>

            {/* Thin network progress banner */}
            <div className="w-full h-[2.5px] bg-slate-900 shrink-0 relative overflow-hidden">
                <AnimatePresence>
                    {browserLoading && (
                        <motion.div 
                            initial={{ width: '0%' }}
                            animate={{ width: `${browserLoadingProgress}%` }}
                            exit={{ opacity: 0 }}
                            className="absolute left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-red-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Core Display Web Portals Viewport */}
            <div className="flex-1 relative overflow-y-auto bg-[#080a18] flex flex-col">
                <AnimatePresence mode="wait">
                    
                    {/* VIEW 1: LNTU JWZX PORTAL HOMEPAGE (Screenshot 3 style) */}
                    {browserView === 'portal' && (
                        <motion.div 
                            key="portal_view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col bg-slate-50 text-slate-800 font-sans select-text scrollbar-thin"
                        >
                            {/* Academic Portal Top Royal Blue Header */}
                            <header className="bg-[#193c72] px-6 py-4 flex flex-col sm:flex-row items-center justify-between select-none shadow-md text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 font-black text-[#193c72] border-2 border-orange-400">
                                        CAS
                                    </div>
                                    <div>
                                        <h1 className="text-base font-extrabold tracking-wider leading-none">安全科技创新协会验证</h1>
                                        <p className="text-[11px] font-bold opacity-80 mt-1 uppercase tracking-wider">星河统一验证中心 PORTAL ACCESS GATE</p>
                                    </div>
                                </div>
                                {isPortalAuthenticated && portalUser ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span>SSO 会话联结已建立</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/10 select-none">
                                            <img 
                                                src={portalUser.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${portalUser.username}&backgroundColor=b6e3f4,c0aede,d1d4f9&hairColor=000000,101010&skinColor=ffd1a9,f1c27d,e8b584`} 
                                                className="w-5 h-5 rounded-full border border-white/20 bg-slate-800"  
                                                alt="User"
                                                referrerPolicy="no-referrer"
                                            />
                                            <span className="text-xs font-bold">{portalUser.name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-4 mt-3 sm:mt-0 text-[11px] font-medium opacity-95">
                                        <span className="hover:underline hover:text-blue-300 cursor-not-allowed">智慧树</span>
                                        <span className="hover:underline hover:text-blue-300 cursor-not-allowed">雨课堂</span>
                                        <span className="hover:underline hover:text-blue-300 cursor-not-allowed">超星泛雅</span>
                                        <button 
                                            onClick={triggerRedirectToCas}
                                            className="bg-orange-500 hover:bg-orange-600 hover:scale-102 transition-all px-4 py-1.5 rounded-md text-white font-extrabold shadow-md cursor-pointer flex items-center gap-1 text-[11.5px]"
                                        >
                                            <User size={12} />
                                            <span>学生/教师统一登录中心</span>
                                        </button>
                                    </div>
                                )}
                            </header>

                            {/* Academic Secondary Navigation tabs */}
                            <nav className="bg-[#122e5a] text-white/90 text-xs py-2 px-6 flex items-center justify-center gap-6 overflow-x-auto whitespace-nowrap shadow-inner select-none">
                                <span className="border-b-2 border-orange-400 font-bold pb-1 text-orange-400 cursor-pointer">首页</span>
                                <span className="hover:text-blue-200 cursor-not-allowed">部门概况</span>
                                <span className="hover:text-blue-200 cursor-not-allowed">教学运行</span>
                                <span className="hover:text-blue-200 cursor-not-allowed">课程建设</span>
                                <span className="hover:text-blue-200 cursor-not-allowed">实践教学</span>
                                <span className="hover:text-blue-200 cursor-not-allowed">考务管理</span>
                                <span className="hover:text-blue-200 cursor-not-allowed">学籍档案</span>
                            </nav>

                            {isPortalAuthenticated && portalUser ? (
                                <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 max-w-4xl mx-auto text-center">
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-slate-800 font-sans space-y-5"
                                    >
                                        <div className="w-16 h-16 bg-[#10b981]/5 text-[#10b981] rounded-full flex items-center justify-center mx-auto mb-2 border border-[#10b981]/10 shadow-inner">
                                            <CheckCircle2 size={32} className="text-[#10b981]" />
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black text-emerald-800 leading-tight">安全科技创新协会授权证书建立成功</h3>
                                            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono mt-1">XINGHE UNIFIED SSO SECURITY HANDSHAKE COMPLETED</p>
                                        </div>

                                        <div className="bg-[#f0f9f4] border-l-4 border-emerald-500 rounded-r-xl p-4.5 text-left text-xs text-slate-700 leading-relaxed font-sans space-y-2.5 shadow-inner">
                                            <p className="font-bold text-emerald-800 flex items-center gap-1 select-none">
                                                <span>🛡️ 安全科技创新协会验证中心：</span>
                                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-1.5 py-0.2 rounded">安全互信状态已激活</span>
                                            </p>
                                            <p>尊敬的 <strong>{portalUser.name}</strong> 成员，您已通过安全科技创新协会统一验证。当前登录客户端已经成功校验单点登录令牌 (SSO Ticket)，并顺利授权您进入 <strong>星河安全科技创新协会</strong> 的后台系统空间。</p>
                                            
                                            <div className="border-t border-emerald-100/60 pt-2.5 mt-2 text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 text-slate-600 select-all">
                                                <div>学籍账号：<span className="font-bold text-slate-800">{portalUser.username}</span></div>
                                                <div>归属专业：<span className="font-bold text-slate-800">{portalUser.className || '安全科学组'}</span></div>
                                                <div>系统角色：<span className="font-bold text-slate-800">{portalUser.category === 'core' ? '星河核心研习专家' : '注册学术成员'}</span></div>
                                                <div>加密算法：<span className="font-bold text-slate-800">ECDSA / SHA256 RSA-4096</span></div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                onSuccess(portalUser);
                                                onClose();
                                                resetStates();
                                            }}
                                            className="mt-4 bg-gradient-to-r from-[#193c72] to-[#122e5a] hover:from-[#112950] hover:to-[#0a1b37] hover:scale-[1.03] active:scale-[0.98] text-white font-extrabold tracking-wider py-4 px-12 rounded-xl shadow-lg shadow-blue-900/20 transition-all cursor-pointer text-xs flex items-center gap-2 mx-auto"
                                        >
                                            <Sparkles size={14} className="text-orange-400" />
                                            <span>🪐 登入星河安全学术科研舱</span>
                                            <ArrowRight size={12} />
                                        </button>
                                    </motion.div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 max-w-4xl mx-auto text-center">
                                    <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-slate-800 font-sans space-y-5">
                                        {/* Scenic Emblem Banner background fallback */}
                                        <div className="w-16 h-16 bg-[#193c72]/5 text-[#193c72] rounded-full flex items-center justify-center mx-auto mb-2 border border-[#193c72]/10 shadow-inner">
                                            🏫
                                        </div>
                                        <h3 className="text-xl font-black text-[#193c72] leading-tight">安全科技创新协会验证</h3>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">XINGHE SAFETY SCIENCE STUDY CENTER</p>

                                        <div className="bg-[#f0f4f9] border-l-4 border-orange-500 rounded-r-xl p-4 text-left text-xs text-slate-700 leading-relaxed font-sans mt-4">
                                            <p className="font-bold text-[#193c72] mb-1">📢 星河科创防泄漏统一身份验证通告 :</p>
                                            请星河安全科技创新协会各研究组（安全工程组、能源化学组、应急管理与技术组）技术研习新晋成员，前往 <strong>统一身份验证网关 (安全科技创新协会验证)</strong> 登录账号以下发安全证书。首次入库成员可切换申请注册成员选项进行提报建档。
                                        </div>

                                        <button 
                                            onClick={triggerRedirectToCas}
                                            className="mt-6 bg-[#193c72] hover:bg-[#112950] hover:scale-[1.03] active:scale-[0.98] text-white font-extrabold tracking-wider py-4 px-10 rounded-xl shadow-lg shadow-blue-900/10 transition-all cursor-pointer text-xs flex items-center gap-1.5 mx-auto"
                                        >
                                            <Lock size={12} className="animate-pulse text-orange-400" />
                                            <span>登入安全科技创新协会验证中心</span>
                                            <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* VIEW 2: REAL LNTU CAS WEBVPN UNIFIED AUTH SYSTEM (Screenshots 1 & 2 style) */}
                    {browserView === 'authgate' && (
                        <motion.div 
                            key="authgate_view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 relative w-full h-full"
                        >
                            {/* SUCCESS ANIMATION COVER */}
                            <AnimatePresence>
                                {successUser && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-55 bg-[#030610] flex flex-col items-center justify-center p-8 text-center text-white"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                                            <CheckCircle2 size={32} className="text-emerald-400 animate-pulse" />
                                        </div>
                                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono">CAS GATEWAY AUTHORIZED</p>
                                        <h2 className="text-2xl font-black mt-2 tracking-tight text-white">
                                            欢迎回归, {successUser.name}
                                        </h2>
                                        <p className="text-xs text-white/40 mt-1 max-w-xs truncate">{successUser.className} · {successUser.intro || '星河科创核心研习员'}</p>

                                        {isRedirecting && (
                                            <div className="mt-8 space-y-4 w-full max-w-xs mx-auto animate-fade-in">
                                                <div className="flex justify-between text-[10.5px] font-mono text-emerald-400/90 tracking-wide select-none">
                                                    <span className="animate-pulse">🔄 Returning to Portal...</span>
                                                    <span>SSO Handshake</span>
                                                </div>
                                                <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-emerald-400 transition-all duration-300" 
                                                        style={{ width: `${browserLoadingProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-[11px] font-mono text-cyan-300/80 leading-relaxed font-bold animate-pulse">
                                                    {redirectStatusText}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* RESPONSIVE LAYOUT DESKTOP GATE (Sunset Background) */}
                            <div className="hidden md:flex relative w-full h-full bg-slate-950 items-center justify-center p-6 bg-cover bg-center select-none" style={{ backgroundImage: `linear-gradient(rgba(10, 5, 2, 0.62), rgba(2, 4, 15, 0.88)), url('https://s41.ax1x.com/2026/03/31/peGSu0x.jpg')` }}>
                                {/* Center Glassmorphic CAS Portal Card */}
                                <div className="w-full max-w-[940px] min-h-[480px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.9)] flex overflow-hidden">
                                    
                                    {/* Left login form area */}
                                    <div className="w-[58%] p-8 flex flex-col justify-between text-white border-r border-white/5 relative">
                                        <div>
                                            {/* LNTU CAS Standard Header */}
                                            <div className="flex items-center gap-3.5 pb-4 mb-5 border-b border-white/10 select-none">
                                                <div className="w-9 h-9 rounded-full bg-slate-900 border border-[#39ff14]/30 text-[#39ff14] font-black flex items-center justify-center shadow-lg text-xs font-mono">SEC</div>
                                                <div className="leading-tight">
                                                    <h3 className="text-[13px] font-extrabold tracking-wider">安全科技创新协会验证</h3>
                                                    <p className="text-[9.5px] text-[#39ff14] font-bold tracking-widest uppercase mt-0.5 font-mono">Xinghe Security Verification</p>
                                                </div>
                                            </div>

                                            {/* Internal selector links inside left card */}
                                            <div className="flex gap-4.5 mb-5 border-b border-white/5 pb-2 text-[11px] font-semibold">
                                                <button onClick={() => { setMode('login'); setAuthMethod('password'); }} className={`pb-1 ${authMethod === 'password' && mode === 'login' ? 'text-red-400 border-b-2 border-red-500 font-black' : 'text-white/40 hover:text-white/75'}`}>账号登录</button>
                                                <button onClick={() => { setMode('login'); setAuthMethod('email'); }} className={`pb-1 ${authMethod === 'email' && mode === 'login' ? 'text-red-400 border-b-2 border-red-500 font-black' : 'text-white/40 hover:text-white/75'}`}>邮箱密令</button>
                                                <button onClick={() => { setMode('login'); setAuthMethod('sms'); }} className={`pb-1 ${authMethod === 'sms' && mode === 'login' ? 'text-red-400 border-b-2 border-red-500 font-black' : 'text-white/40 hover:text-white/75'}`}>短信验证</button>
                                                <button onClick={() => { setMode('register'); setAuthMethod('password'); }} className={`pb-1 ${mode === 'register' ? 'text-red-400 border-b-2 border-red-500 font-black' : 'text-white/40 hover:text-white/75'}`}>成员档案提报</button>
                                            </div>

                                            {/* Forms views switch inside primary block */}
                                            {error && (
                                                <div className="p-3 bg-red-500/10 text-red-300 border border-red-500/15 rounded-xl text-xs mb-4 flex gap-1.5 items-start">
                                                    <ShieldAlert size={13} className="shrink-0 mt-0.5" />
                                                    <p className="leading-relaxed">{error}</p>
                                                </div>
                                            )}

                                            {/* PASSWORD LOGIN FORM */}
                                            {mode === 'login' && authMethod === 'password' && (
                                                <div className="space-y-3.5">
                                                    <div className="relative">
                                                        <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                                        <input 
                                                            type="text"
                                                            value={formData.username}
                                                            onChange={e => setFormData({...formData, username: e.target.value})}
                                                            placeholder="请输入学号 / 工号"
                                                            className="w-full bg-[#ebf1f5] text-slate-900 border border-slate-300 rounded-lg py-3 px-4 pl-11 text-xs focus:bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                                        <input 
                                                            type={isPasswordVisible ? "text" : "password"}
                                                            value={formData.password}
                                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                                            placeholder="请输入登录密码"
                                                            className="w-full bg-[#ebf1f5] text-slate-900 border border-slate-300 rounded-lg py-3 px-4 pl-11 text-xs focus:bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50"
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                        >
                                                            {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* EMAIL SECURITY FORM */}
                                            {mode === 'login' && authMethod === 'email' && (
                                                <div className="space-y-3">
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                                            placeholder="注册绑定的电子邮箱 (yourname@domain.com)"
                                                            className="flex-1 bg-[#ebf1f5] text-slate-900 border border-slate-300 rounded-lg py-3 px-4 text-xs focus:bg-white focus:outline-none focus:border-red-600"
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={sendEmailCode}
                                                            disabled={emailTimer > 0}
                                                            className="bg-[#1e293b] hover:bg-[#334155] border border-white/5 rounded-lg px-3.5 py-3 text-[11px] font-bold text-white transition-all disabled:opacity-45"
                                                        >
                                                            {emailTimer > 0 ? `${emailTimer}s` : '分发验证码'}
                                                        </button>
                                                    </div>
                                                    <input 
                                                        type="text"
                                                        value={formData.emailCode}
                                                        onChange={e => setFormData({...formData, emailCode: e.target.value})}
                                                        placeholder="验证码 (在顶部模拟邮箱收件箱获取)"
                                                        className="w-full bg-[#ebf1f5] text-slate-900 border border-slate-300 rounded-lg py-3 px-4 text-xs focus:bg-white focus:outline-none focus:border-red-600"
                                                    />
                                                </div>
                                            )}

                                            {/* SMS KEY FORM */}
                                            {mode === 'login' && authMethod === 'sms' && (
                                                <div className="space-y-3">
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text"
                                                            value={formData.phone}
                                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                                            placeholder="入档备案的手机号码"
                                                            className="flex-1 bg-[#ebf1f5] text-slate-900 border border-slate-300 rounded-lg py-3 px-4 text-xs focus:bg-white focus:outline-none focus:border-red-600"
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={sendSmsCode}
                                                            disabled={smsTimer > 0}
                                                            className="bg-[#1e293b] hover:bg-[#334155] border border-white/5 rounded-lg px-3.5 py-3 text-[11px] font-bold text-white transition-all disabled:opacity-45"
                                                        >
                                                            {smsTimer > 0 ? `${smsTimer}s` : '发送下发密文'}
                                                        </button>
                                                    </div>
                                                    <input 
                                                        type="text"
                                                        value={formData.smsCode}
                                                        onChange={e => setFormData({...formData, smsCode: e.target.value})}
                                                        placeholder="请输入收到的手机验证短密文"
                                                        className="w-full bg-[#ebf1f5] text-slate-900 border border-slate-300 rounded-lg py-3 px-4 text-xs focus:bg-white focus:outline-none focus:border-red-600"
                                                    />
                                                </div>
                                            )}

                                            {/* WECHAT MP QR SCAN COMPONENT */}
                                            {mode === 'login' && authMethod === 'mp' && (
                                                <div className="bg-slate-950/45 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                                                    {isMpLoading ? (
                                                        <div className="py-6 space-y-2">
                                                            <Loader2 className="animate-spin text-emerald-400" size={24} />
                                                            <p className="text-[10px] text-white/40">正在构建加密信道...</p>
                                                        </div>
                                                    ) : mpUuid ? (
                                                        <div className="flex flex-col items-center justify-center space-y-3">
                                                            <div className="w-32 h-32 bg-white rounded-xl p-1.5 flex items-center justify-center relative overflow-hidden group shadow-lg">
                                                                <img 
                                                                    src={qrMode === 'standard' ? wechatService.getQrImageUrl(mpUuid) : `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mpUuid)}`} 
                                                                    className="w-full h-full object-contain"
                                                                    alt="WeChat QR Code"
                                                                    referrerPolicy="no-referrer"
                                                                />
                                                                <div className="absolute top-0 inset-x-0 h-0.5 bg-emerald-400 opacity-60 animate-bounce pointer-events-none" />
                                                            </div>
                                                            <p className="text-[10.5px] font-bold text-emerald-400">微信扫一扫 · 安全极速扫码</p>
                                                            <button 
                                                                onClick={() => setMockMpClientOpen(!mockMpClientOpen)}
                                                                className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                                                            >
                                                                <Smartphone size={11} />
                                                                <span>{mockMpClientOpen ? '收起微信模拟扫描仪' : '打开虚拟微信客户端(快捷测试)'}</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="py-4">信息信令断开</div>
                                                    )}
                                                </div>
                                            )}

                                            {/* REGISTER MEMBERSHIP FORM */}
                                            {mode === 'register' && (
                                                <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="text" placeholder="学号/工号 (账号)" value={formData.username} onChange={e=>setFormData({...formData, username:e.target.value})} className="bg-[#ebf1f5] text-slate-900 rounded-lg p-2.5 text-xs focus:bg-white" />
                                                        <input type="password" placeholder="档案访问密码" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} className="bg-[#ebf1f5] text-slate-900 rounded-lg p-2.5 text-xs focus:bg-white" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="text" placeholder="入伙姓名" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="bg-[#ebf1f5] text-slate-900 rounded-lg p-2.5 text-xs focus:bg-white" />
                                                        <input type="text" placeholder="专业（能源化学、安全、应急）" value={formData.className} onChange={e=>setFormData({...formData, className:e.target.value})} className="bg-[#ebf1f5] text-slate-900 rounded-lg p-2.5 text-xs focus:bg-white" />
                                                    </div>
                                                    <input type="email" placeholder="个人注册电子邮箱" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} className="w-full bg-[#ebf1f5] text-slate-900 rounded-lg p-2.5 text-xs focus:bg-white" />
                                                    <input type="text" placeholder="科创组加入注册邀请码: XINGHE2026" value={formData.memberCode} onChange={e=>setFormData({...formData, memberCode:e.target.value})} className="w-full bg-[#ebf1f5] border border-orange-300 text-slate-900 rounded-lg p-2.5 text-xs font-bold focus:bg-white" />
                                                </div>
                                            )}

                                            {/* Standard CAS Sign In triggering Button config */}
                                            {authMethod !== 'mp' && (
                                                <button 
                                                    onClick={() => triggerSubmitWithCaptcha(mode === 'login' ? 'login' : 'register')}
                                                    disabled={isLoading}
                                                    className="w-full bg-[#b22222] hover:bg-[#8e1b1b] disabled:opacity-40 text-white font-extrabold py-3.5 px-6 rounded-lg text-xs mt-4 tracking-[6px] transition-all flex items-center justify-center cursor-pointer shadow-md select-none"
                                                >
                                                    {isLoading ? <Loader2 className="animate-spin" size={13} /> : (mode === 'login' ? '登  录' : '提交星河档案并认证')}
                                                </button>
                                            )}

                                            <div className="text-[10px] text-white/30 text-center mt-3 select-none">
                                                登录即代表您已自动阅读并接受星河协会教务验证保密守则条令
                                            </div>
                                        </div>

                                        {/* Footer copyright */}
                                        <div className="text-[10px] text-white/20 text-center mt-4">
                                            中国·阜新·辽宁工程技术大学 © 统一身份认证
                                        </div>
                                    </div>

                                    {/* Right vertical other authentication selector Column */}
                                    <div className="w-[42%] bg-white/5 p-8 flex flex-col justify-center items-center text-center space-y-6 relative border-l border-white/5 select-none text-white">
                                        <div className="text-[11px] font-bold tracking-widest text-[#a5b4fc] uppercase opacity-75">
                                            其他认证授权通道
                                        </div>
                                        
                                        <div className="flex flex-col items-center gap-2">
                                            <button 
                                                onClick={() => { setMode('login'); setAuthMethod('mp'); }}
                                                className="w-16 h-16 rounded-full bg-[#07c160] hover:scale-105 active:scale-95 cursor-pointer transition-transform flex items-center justify-center shadow-lg shadow-emerald-500/15"
                                                title="WeChat Scan Authentication"
                                            >
                                                <Check className="text-white shrink-0 font-bold" size={24} />
                                            </button>
                                            <span className="text-xs font-semibold text-white/70">统一身份微信扫一扫</span>
                                        </div>

                                        <p className="text-[10px] text-white/35 leading-relaxed max-w-[200px] select-none">
                                            亦可点击顶端页签一键返回主应用，或通过左侧切换验证码和档案录入机制。
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* RESPONSIVE LAYOUT MOBILE GATE (Matches Screenshot 1 style perfectly) */}
                            <div className="flex md:hidden relative w-full h-full bg-[#fcfdfe] text-slate-800 flex-col justify-between p-6 overflow-y-auto select-none font-sans">
                                
                                {/* Absolute floating active WeChat notifications Toast */}
                                <div className="absolute top-4 inset-x-4 bg-[#f8f9fa] border border-slate-200 shadow-xl rounded-2xl p-3 flex items-center justify-between z-30 animate-bounce">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-[#07c160] flex items-center justify-center">
                                            <span className="text-white text-xs font-bold font-mono">W</span>
                                        </div>
                                        <div className="leading-tight">
                                            <h4 className="text-[11px] font-bold text-slate-900">毕业晚会话剧 // 微信提示</h4>
                                            <p className="text-[10px] text-slate-500">软件 25-8 王一冰 : 1</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-300">✕</span>
                                </div>

                                {/* Main Mobile content */}
                                <div className="my-auto pt-14 space-y-7">
                                    {/* Red circular center logo */}
                                    <div className="text-center space-y-2.5 select-none">
                                        <div className="w-14 h-14 bg-slate-900 border border-[#39ff14]/30 text-[#39ff14] rounded-full flex items-center justify-center font-black mx-auto shadow-md scale-102 font-mono text-sm">
                                            SEC
                                        </div>
                                        <h2 className="text-lg font-black text-slate-900 tracking-wide">安全科技创新协会验证</h2>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 leading-none font-mono">XINGHE SECURITY VALIDATION SYSTEM</p>
                                    </div>

                                    {/* Mobile error layout */}
                                    {error && (
                                        <div className="p-3.5 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs space-y-1">
                                            <p className="font-bold">⚠️ 提示:</p>
                                            <p className="opacity-90">{error}</p>
                                        </div>
                                    )}

                                    {/* Mobile input fields */}
                                    {mode === 'login' ? (
                                        <div className="space-y-4">
                                            <input 
                                                type="text"
                                                value={formData.username}
                                                onChange={e=>setFormData({...formData, username: e.target.value})}
                                                placeholder="请输入学号/工号"
                                                className="w-full bg-[#f4f7f9] border border-slate-200 rounded-xl py-3.5 px-4 text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#3182f6] transition-all"
                                            />
                                            <input 
                                                type="password"
                                                value={formData.password}
                                                onChange={e=>setFormData({...formData, password: e.target.value})}
                                                placeholder="请输入密码"
                                                className="w-full bg-[#f4f7f9] border border-slate-200 rounded-xl py-3.5 px-4 text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#3182f6] transition-all"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-[#f4f7f9] p-4 rounded-2xl border border-slate-100 space-y-2 max-h-[160px] overflow-y-auto">
                                            <input type="text" placeholder="学号" value={formData.username} onChange={e=>setFormData({...formData, username:e.target.value})} className="w-full bg-white p-2 border border-slate-150 rounded text-xs" />
                                            <input type="password" placeholder="密码" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} className="w-full bg-white p-2 border border-slate-150 rounded text-xs" />
                                            <input type="text" placeholder="内部邀请码: XINGHE2026" value={formData.memberCode} onChange={e=>setFormData({...formData, memberCode:e.target.value})} className="w-full bg-white border border-blue-400 p-2 rounded text-xs font-bold" />
                                        </div>
                                    )}

                                    {/* Action button in sky blue color matching mobile screenshot */}
                                    <button 
                                        onClick={() => triggerSubmitWithCaptcha(mode === 'login' ? 'login' : 'register')}
                                        disabled={isLoading}
                                        className="w-full bg-[#3182f6] hover:bg-blue-600 active:scale-95 text-white font-extrabold tracking-widest text-xs py-3.5 rounded-xl shadow-md shadow-blue-500/10 cursor-pointer transition-all duration-150 flex items-center justify-center"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin text-white" size={13} /> : '登   录'}
                                    </button>

                                    {/* Toggles */}
                                    <div className="flex justify-between items-center text-[10.5px] text-blue-500 font-bold px-1 select-none">
                                        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="hover:underline">
                                            {mode === 'login' ? '首次登录：注册激活' : '返回常规登录'}
                                        </button>
                                        <button onClick={() => { setBrowserView('portal'); setBrowserUrlField('jwzx.lntu.edu.cn/'); }} className="hover:underline flex items-center gap-0.5">
                                            <span>星河教务门户</span>
                                            <ArrowRight size={10} />
                                        </button>
                                    </div>
                                </div>

                                {/* Footer copyright mobile */}
                                <div className="text-[10px] text-slate-400 text-center select-none pt-4 font-sans">
                                    星河安全科技创新协会 统一身份验证
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Simulated floating wechat applet emulator screen component */}
                <AnimatePresence>
                    {mockMpClientOpen && mpUuid && (
                        <div className="fixed inset-y-12 right-6 w-80 z-45 bg-[#080b18] border-2 border-emerald-500 rounded-[30px] p-3 flex flex-col justify-between shadow-2xl overflow-hidden text-white font-mono scale-95" style={{ outline: '10px solid #1a1d2e' }}>
                            <div className="flex justify-between items-center select-none border-b border-white/5 pb-2.5 mb-2 text-[10.5px] text-emerald-400 font-bold">
                                <span>星河手机模拟微信端 v2</span>
                                <button onClick={() => setMockMpClientOpen(false)} className="text-white/40 hover:text-white">✕</button>
                            </div>
                            <div className="space-y-4 flex-1 flex flex-col justify-between pt-1">
                                <div className="text-center space-y-1 py-1.5 bg-[#0e1227] rounded-xl border border-white/5">
                                    <Sparkles size={16} className="text-emerald-400 mx-auto animate-pulse" />
                                    <h5 className="text-[10px] font-black">统一安全二维码桥接鉴权</h5>
                                    <p className="text-[8px] text-white/30 truncate">ID: {mpUuid}</p>
                                </div>

                                <div className="space-y-2 text-[9px]">
                                    <p className="font-bold text-slate-300">快速虚拟登录身份 :</p>
                                    <div className="grid grid-cols-2 gap-1.5 leading-none">
                                        <div onClick={() => { setSimulatedOpenid('openid_lupeng'); setSimulatedNickname('陆鹏'); }} className={`p-2 border rounded-xl cursor-pointer ${simulatedOpenid === 'openid_lupeng' ? 'bg-emerald-500/10 border-emerald-500' : 'border-white/5 hover:bg-white/5'}`}>
                                            <p className="font-bold">陆鹏 (组长)</p>
                                            <span className="text-[7.5px] text-white/30">安全23-2</span>
                                        </div>
                                        <div onClick={() => { setSimulatedOpenid('openid_wangax'); setSimulatedNickname('王傲星'); }} className={`p-2 border rounded-xl cursor-pointer ${simulatedOpenid === 'openid_wangax' ? 'bg-emerald-500/10 border-emerald-500' : 'border-white/5 hover:bg-white/5'}`}>
                                            <p className="font-bold">王傲星 (运维)</p>
                                            <span className="text-[7.5px] text-white/30">信安24-1</span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={async () => {
                                        try {
                                            setIsLoading(true);
                                            await wechatService.authorizeMp(mpUuid, simulatedOpenid, simulatedNickname);
                                            setMockMpClientOpen(false);
                                        } catch (_) {
                                            setError('模拟小程序授权中断。');
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                    disabled={isLoading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2.5 rounded-xl text-[10px] cursor-pointer text-center tracking-wider transition-all"
                                >
                                    一键进行微信扫码确认授权
                                </button>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* ==================================================== */}
            {/* OVERLAYS: Standalone Drag Sliding Captcha Shield      */}
            {/* ==================================================== */}
            <AnimatePresence>
                {isPuzzleOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1100] bg-[#060813]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
                    >
                        <div className={`w-80 bg-[#0c0f1d] border border-white/10 rounded-2xl p-4 shadow-2xl relative ${puzzleError ? 'animate-shake' : ''}`}>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle2 className="text-blue-400" size={13} />
                                    <span>星河安全盾 · 人机校验</span>
                                </span>
                                <button 
                                    onClick={() => { setIsPuzzleOpen(false); setPuzzleX(0); setPuzzleError(false); }}
                                    className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/5"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="h-32 bg-gradient-to-br from-[#121932] via-[#0b0f22] to-[#161c36] rounded-xl relative overflow-hidden flex items-center justify-center border border-white/5">
                                <div className="absolute inset-[24px] bg-indigo-500/10 filter blur-xl" />
                                <div className="absolute top-4 left-6 w-1 h-1 rounded-full bg-white/40 animate-ping" />
                                <div className="absolute bottom-6 right-16 w-1 h-1 rounded-full bg-blue-400/40" />
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:14px_14px]" />

                                <div 
                                    style={{ left: `${targetPuzzleX}px` }}
                                    className="absolute w-10 h-10 border border-emerald-500/50 bg-emerald-500/25 rounded-xl flex items-center justify-center shadow-[inset_0_0_10px_rgba(16,185,129,0.3)] z-10 transition-all"
                                >
                                    <Lock size={12} className="text-emerald-400 animate-pulse" />
                                </div>

                                <div 
                                    style={{ left: `${puzzleX}px` }}
                                    className="absolute w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20 transition-transform z-20"
                                >
                                    <Sparkles size={14} className="text-white" />
                                </div>

                                {puzzleSuccess && (
                                    <div className="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center z-30">
                                        <CheckCircle2 size={32} className="text-white animate-bounce" />
                                        <p className="text-xs font-bold text-white mt-1">校验通过 (Passed)</p>
                                    </div>
                                )}
                            </div>

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

                            <div className="mt-3 flex justify-between items-center text-[10px] pl-1 font-mono">
                                <span className={puzzleError ? 'text-red-400 font-bold' : 'text-white/30'}>
                                    {puzzleError ? '坐标偏差过大，请对准拼图' : '星河防网络嗅探安全守护盾'}
                                </span>
                                <button 
                                    onClick={() => { setPuzzleX(0); setPuzzleError(false); }}
                                    className="hover:text-white flex items-center gap-1 hover:bg-white/5 px-2 py-0.5 rounded transition-all text-white/40"
                                >
                                    <RefreshCw size={9} />
                                    <span>Reset</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Virtual Simulated Email alerts notification toast */}
            <AnimatePresence>
                {mockEmailBanner && (
                    <motion.div 
                        initial={{ opacity: 0, y: -65 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[1100] w-full max-w-sm bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between text-white text-xs gap-3"
                    >
                        <div className="flex gap-2.5 items-start">
                            <Mail size={16} className="text-blue-400 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="font-bold flex items-center gap-1.5">
                                    <span>智慧校园邮箱收件箱</span>
                                    <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-mono uppercase">VIRTUAL INBOX</span>
                                </h4>
                                <p className="text-white/70 leading-relaxed mt-1 text-[11px] select-text">{mockEmailBanner.message}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                setFormData(prev => ({ ...prev, emailCode: mockEmailBanner.code }));
                                setMockEmailBanner(null);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-1.5 rounded transition-all text-[10.5px] cursor-pointer active:scale-98"
                        >
                            一键复制并自动填入邮箱验证码
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Virtual Simulated SMS alerts notification toast */}
            <AnimatePresence>
                {mockSmsBanner && (
                    <motion.div 
                        initial={{ opacity: 0, y: -65 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[1100] w-full max-w-sm bg-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between text-white text-xs gap-3"
                    >
                        <div className="flex gap-2.5 items-start">
                            <Phone size={16} className="text-blue-400 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="font-bold flex items-center gap-1.5">
                                    <span>智能模拟手机短信网关</span>
                                    <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-mono uppercase font-bold">VIRTUAL SMS</span>
                                </h4>
                                <p className="text-white/70 leading-relaxed mt-1 text-[11px] select-text">{mockSmsBanner.message}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                setFormData(prev => ({ ...prev, smsCode: mockSmsBanner.code }));
                                setMockSmsBanner(null);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-1.5 rounded transition-all text-[10.5px] cursor-pointer active:scale-98"
                        >
                            一键复制并自动填入短信验证码
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MemberAuthModal;
