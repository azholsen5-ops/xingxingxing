import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Tag, FileText, GraduationCap, Loader2, Save } from 'lucide-react';
import { authService } from '../services/authService';

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

    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        className: currentUser?.className || '',
        category: currentUser?.category || 'core',
        intro: currentUser?.intro || '',
        avatar: currentUser?.avatar || ''
    });

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
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
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
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UserProfileEditModal;
