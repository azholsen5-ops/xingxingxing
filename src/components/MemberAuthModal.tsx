import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, Mail, Users, ArrowRight, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

interface MemberAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
    lang: 'zh' | 'en';
}

const MemberAuthModal: React.FC<MemberAuthModalProps> = ({ isOpen, onClose, onSuccess, lang }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        className: '',
        category: 'core',
        memberCode: '',
        intro: ''
    });

    const t = {
        zh: {
            title_login: "成员登录",
            title_register: "加入协会",
            label_username: "用户名",
            label_password: "密码",
            label_name: "真实姓名",
            label_class: "班级/专业",
            label_category: "成员类别",
            label_member_code: "加入邀请码 (会员号)",
            label_intro: "个人简介",
            cat_core: "核心成员",
            cat_service: "服务人员",
            btn_login: "登录系统",
            btn_register: "注册账户",
            switch_to_register: "还没有账户？申请加入",
            switch_to_login: "已有账户？立即登录",
            error_generic: "操作失败，请检查输入或网络",
            success_register: "注册成功，请登录"
        },
        en: {
            title_login: "Member Login",
            title_register: "Join Association",
            label_username: "Username",
            label_password: "Password",
            label_name: "Full Name",
            label_class: "Class/Major",
            label_category: "Member Category",
            label_member_code: "Membership Code",
            label_intro: "Brief Intro",
            cat_core: "Core Member",
            cat_service: "Service Personnel",
            btn_login: "Login",
            btn_register: "Register",
            switch_to_register: "No account? Apply now",
            switch_to_login: "Have an account? Login",
            error_generic: "Action failed, check input or network",
            success_register: "Success, please login"
        }
    };

    const curT = t[lang];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const res = await authService.login({ username: formData.username, password: formData.password });
                if (res.success) {
                    onSuccess(res.user);
                    onClose();
                } else {
                    setError(res.error || curT.error_generic);
                }
            } else {
                const res = await authService.register(formData);
                if (res.success) {
                    setMode('login');
                    setError(curT.success_register);
                } else {
                    setError(res.error || curT.error_generic);
                }
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
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Image/Pattern */}
                        <div className="h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 topo-bg white"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Users size={40} className="text-blue-500/50" />
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8">
                            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
                                {mode === 'login' ? curT.title_login : curT.title_register}
                            </h2>
                            <p className="text-white/40 text-xs mb-8">STAR RIVER TECH INNOVATION HUB</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2 ml-1">{curT.label_username}</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                                        <input 
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={e => setFormData({...formData, username: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 transition-all"
                                            placeholder="Member ID"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2 ml-1">{curT.label_password}</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                                        <input 
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {mode === 'register' && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <div>
                                            <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2 ml-1">{curT.label_name}</label>
                                            <input 
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-blue-500/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2 ml-1">{curT.label_class}</label>
                                            <input 
                                                type="text"
                                                required
                                                value={formData.className}
                                                onChange={e => setFormData({...formData, className: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10"
                                                placeholder="e.g. 软件23-1"
                                            />
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
                                                    className={`flex-1 py-3 rounded-xl border transition-all text-xs font-bold ${formData.category === 'service' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                                                >
                                                    {curT.cat_service}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-2 ml-1">{curT.label_intro}</label>
                                            <textarea 
                                                value={formData.intro}
                                                onChange={e => setFormData({...formData, intro: e.target.value})}
                                                rows={2}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-blue-500/50 transition-all text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-yellow-500/60 uppercase tracking-widest mb-2 ml-1 font-bold">{curT.label_member_code}</label>
                                            <input 
                                                type="text"
                                                required
                                                value={formData.memberCode}
                                                onChange={e => setFormData({...formData, memberCode: e.target.value})}
                                                className="w-full bg-white/5 border-yellow-500/20 rounded-xl py-4 px-4 text-white outline-none focus:border-yellow-500/50 transition-all placeholder:text-white/10"
                                                placeholder="SECRET CODE"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {error && (
                                    <p className={`text-xs ${error.includes('成功') ? 'text-[#39FF14]' : 'text-red-500'} bg-red-500/10 p-3 rounded-lg`}>{error}</p>
                                )}

                                <button 
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all mt-4 flex items-center justify-center gap-2 group"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                        <>
                                            {mode === 'login' ? curT.btn_login : curT.btn_register}
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <button 
                                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                    className="text-white/30 text-xs hover:text-white transition-colors"
                                >
                                    {mode === 'login' ? curT.switch_to_register : curT.switch_to_login}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MemberAuthModal;
