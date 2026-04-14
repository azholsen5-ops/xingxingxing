/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { animate, svg, stagger } from 'animejs';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, Menu, X, Phone, Mail, MapPin, ArrowUp, Trophy, Laptop, User, MessageCircle, Music, AlertCircle, Share2, Search, ArrowRight, Award, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addDocument } from './firebase';
import Galaxy3D from './components/Galaxy3D';
import ImageTrail from './components/ImageTrail';
import ProfileCard from './components/ProfileCard';
import GlitchText from './components/GlitchText';
import ShinyText from './components/ShinyText';
import AgreementOverlay from './components/AgreementOverlay';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    errorInfo: string;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, errorInfo: '' };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, errorInfo: error.message };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">糟糕，出错了</h2>
                        <p className="text-gray-600 mb-8">
                            应用程序遇到了一个意外错误。请尝试刷新页面或稍后再试。
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                        >
                            刷新页面
                        </button>
                        {(import.meta as any).env?.DEV && (
                            <pre className="mt-6 p-4 bg-gray-100 rounded-lg text-xs text-left overflow-auto max-h-40 text-red-500">
                                {this.state.errorInfo}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

gsap.registerPlugin(ScrollTrigger);

// --- Types ---
interface Member {
    id: string;
    name: string;
    className: string;
    avatar: string;
    intro: string;
    awards: string[];
    category?: 'student' | 'teacher' | 'service';
}

const memberData: Record<string, Member> = {
    liqin: { 
        id: 'liqin',
        name: "李溱", 
        className: "安全23-2", 
        avatar: "https://picsum.photos/150/150?member1", 
        intro: "研究方向为矿山安全监测技术，具备扎实数据处理能力。", 
        awards:["2025年挑战杯省级特等奖", "安全专业一等奖学金"] 
    },
    niedongyang: { 
        id: 'niedongyang',
        name: "聂冬样", 
        className: "安全24-1", 
        avatar: "https://s41.ax1x.com/2026/03/12/peA9kl9.jpg", 
        intro: "主攻机器人视觉算法，负责视觉方案设计与落地。", 
        awards:["2024年辽宁省科创一等奖", "机器人高级职业证书"] 
    },
    heshiyu: { 
        id: 'heshiyu',
        name: "贺诗雨", 
        className: "安全23-5", 
        avatar: "https://picsum.photos/150/150?member3", 
        intro: "主攻安全风险管理与应急技术，参与省级科研项目。", 
        awards:["2024年安全创新一等奖", "优秀学生干部"] 
    },
    zhangming: {
        id: 'lupeng',
        name: "路鹏",
        className: "安全23-2",
        avatar: "/public/2317d6156558f4618fe9ac7194fc9201_compressed.jpg",
        intro: "擅长安全系统工程与风险评估。",
        awards: ["2024年校级优秀学生"]
    },
    lihua: {
        id: 'lihua',
        name: "李华",
        className: "机器人24-1",
        avatar: "https://picsum.photos/150/150?member5",
        intro: "专注于自动化控制与机器人结构设计。",
        awards: ["2024年机器人大赛二等奖"]
    },
    // Teachers
    qijiayi: {
        id: 'qijiayi',
        name: "齐嘉义",
        className: "首席指导教师",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
        intro: "安全工程学院教授，博士生导师。深耕矿山安全领域30余年，主持国家级科研项目10余项，在国内外核心期刊发表论文50余篇。",
        awards: ["国家科技进步二等奖", "全国优秀教师", "省级教学名师"]
    },
    wanganquan: {
        id: 'wanganquan',
        name: "王安全",
        className: "技术指导教师",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
        intro: "副教授，主要研究方向为智能监测系统与传感器网络。拥有多项发明专利，指导学生获得国家级科创竞赛奖项20余项。",
        awards: ["省部级科技进步一等奖", "校级优秀指导教师", "智能安全系统专利发明人"]
    },
    lichuangxin: {
        id: 'lichuangxin',
        name: "李创新",
        className: "创新指导教师",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
        intro: "高级工程师，专注于大学生科创项目孵化 with 竞赛指导。具有丰富的行业背景，擅长将理论研究转化为实际应用场景。",
        awards: ["挑战杯全国优秀指导教师", "互联网+大赛金奖导师", "大学生创业孵化基地负责人"]
    },
    zhaozhinen: {
        id: 'zhaozhinen',
        name: "赵智能",
        className: "AI指导教师",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
        intro: "人工智能实验室主任，专注于深度学习与计算机视觉在安全领域的应用。主导开发了多套智能预警系统。",
        awards: ["人工智能杰出青年奖", "省级科技进步二等奖", "多项AI算法专利持有者"]
    },
    sunshijian: {
        id: 'sunshijian',
        name: "孙实践",
        className: "工程指导教师",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        intro: "资深高级工程师，拥有20年一线工程实践经验。擅长硬件电路设计与机械结构优化，是团队的技术压舱石。",
        awards: ["全国技术能手", "五一劳动奖章获得者", "多项实用新型专利发明人"]
    },
    zhouyanjiu: {
        id: 'zhouyanjiu',
        name: "周研究",
        className: "学术指导教师",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
        intro: "博士后研究员，专注于安全科学前沿理论研究。在国际顶级期刊发表多篇高影响力论文。",
        awards: ["国家自然科学基金获得者", "青年学者奖"]
    },
    wulilun: {
        id: 'wulilun',
        name: "吴理论",
        className: "理论指导教师",
        avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=400",
        intro: "资深讲师，擅长将复杂的物理理论转化为易于理解的工程模型。深受学生喜爱。",
        awards: ["校级教学成果一等奖", "最受欢迎教师"]
    },
    zhengshijian: {
        id: 'zhengshijian',
        name: "郑实践",
        className: "实践指导教师",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=400",
        intro: "拥有丰富的工厂安全管理经验，指导学生进行实地调研与安全评估。",
        awards: ["注册安全工程师", "行业安全顾问"]
    },
    qianchuangxin: {
        id: 'qianchuangxin',
        name: "钱创新",
        className: "创业指导教师",
        avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400",
        intro: "成功创业者，指导学生进行项目商业化与市场推广。拥有广泛的投融资资源。",
        awards: ["年度创业导师", "天使投资人"]
    },
    wangzhinen: {
        id: 'wangzhinen',
        name: "王智能",
        className: "机器人指导教师",
        avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=400",
        intro: "机器人竞赛金牌教练，指导学生在各类机器人大赛中屡获佳绩。",
        awards: ["ROBOCON优秀指导教师", "机器人技术专家"]
    },
    zhangxiaoming: {
        id: 'zhangxiaoming',
        name: "张晓明",
        className: "宣传部部长",
        avatar: "https://picsum.photos/150/150?service1",
        intro: "负责协会品牌宣传与活动推广，擅长视觉设计与新媒体运营。",
        awards: ["优秀学生干部", "校园媒体大赛二等奖"],
        category: 'service'
    },
    wangfang: {
        id: 'wangfang',
        name: "王芳",
        className: "秘书处秘书长",
        avatar: "https://picsum.photos/150/150?service2",
        intro: "负责协会日常行政事务与财务管理，工作细致严谨。",
        awards: ["社会实践先进个人", "校级奖学金"],
        category: 'service'
    },
    liwei: {
        id: 'liwei',
        name: "李伟",
        className: "组织部部长",
        avatar: "https://picsum.photos/150/150?service3",
        intro: "负责协会成员考核与团队建设，具有极强的组织协调能力。",
        awards: ["优秀志愿者", "团队协作奖"],
        category: 'service'
    }
};

function App() {
    const [lang, setLang] = useState<'zh' | 'en'>('zh');
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('intro');
    const [scrolled, setScrolled] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [selectedAward, setSelectedAward] = useState<any | null>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const progressCircleRef = useRef<SVGCircleElement>(null);

    const [isContactSubmitting, setIsContactSubmitting] = useState(false);
    const [contactSubmitted, setContactSubmitted] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinStep, setJoinStep] = useState(1);
    const [joinData, setJoinData] = useState({ name: '', studentId: '', majorClass: '', phone: '', intro: '' });
    const [isJoinSubmitting, setIsJoinSubmitting] = useState(false);
    const [joinSubmitted, setJoinSubmitted] = useState(false);
    const [hasAcceptedAgreement, setHasAcceptedAgreement] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);

    const [achieveIndex, setAchieveIndex] = useState(0);
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [shareToast, setShareToast] = useState<string | null>(null);
    const [is3DLoading, setIs3DLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isPageLoaded, setIsPageLoaded] = useState(false);

    useEffect(() => {
        const handleLoad = () => setIsPageLoaded(true);
        if (document.readyState === 'complete') {
            setIsPageLoaded(true);
        } else {
            window.addEventListener('load', handleLoad);
        }
        return () => window.removeEventListener('load', handleLoad);
    }, []);

    const handleShareAward = async (e: React.MouseEvent, award: any) => {
        e.stopPropagation();
        const shareText = `【星河荣誉】${award.title}\n项目：${award.project}\n团队：${award.team}\n查看更多：${window.location.href}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: award.title,
                    text: shareText,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                setShareToast('链接已复制到剪贴板');
                setTimeout(() => setShareToast(null), 3000);
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        }
    };

    const videoRef = useRef<HTMLVideoElement>(null);
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const badgeGroupRef = useRef<THREE.Group | null>(null);
    const loadingOverlayRef = useRef<HTMLDivElement>(null);
    const hallOfFameRef = useRef<HTMLDivElement>(null);
    const horizontalScrollRef = useRef<HTMLDivElement>(null);
    const experienceRef = useRef<HTMLElement>(null);
    const scribbleRef = useRef<SVGSVGElement>(null);
    const styleTransitionRef = useRef<HTMLDivElement>(null);
    const styleTransitionScribbleRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    // --- Translations ---
    const t = {
        zh: {
            logo_text: "星河科技创新协会", nav_intro: "团队简介", nav_advisor: "指导教师", nav_history: "发展历程", nav_style: "团队风采", nav_experience: "经验分享", nav_achieve: "成果展示", nav_members: "团队成员", nav_join: "加入我们", nav_contact: "联系我们", title_teachers: "Our Teachers", advisor_1_title: "首席指导教师", advisor_2_title: "技术指导教师", advisor_3_title: "创新指导教师", history_scroll: "滚动探索", history_fg: "星河协会<br>科技发展历程", footer_copyright: "© 2026 安全学院星河科技创新协会 版权所有",
            history_1: "协会成立，开启安全工程新篇章", history_2: "智能监测线上首开先河", history_3: "建立中国首条无害化安全生产线", history_4: "市场排名领先，成果显著", history_5: "动力环技术取得重大突破",
            slider_1: "探索安全科技无限可能<br>用创新解决实际问题",
            slider_2: "星河科技创新协会<br>凝心聚力 共创未来",
            slider_3: "深耕安全工程<br>赋能技术创新",
            slider_4: "斩获多项省级大奖<br>彰显团队实力",
            stat_year: "成立年限", stat_awards: "省级以上奖项", stat_member: "培养成员",
            stats_title: "协会历程", stats_subtitle: "自 2023 年以来",
            stats_item_1: "核心科研项目", stats_item_2: "国家级奖项", stats_item_3: "平均专利产出", stats_item_4: "合作企业",
            milestone_title: "荣誉殿堂", milestone_year: "年份", milestone_achieve: "成就", milestone_impact: "影响力",
            hall_of_fame_title: "荣誉殿堂",
            hall_of_fame_subtitle: "记录协会每一个辉煌时刻",
            hall_item_1_title: "挑战杯省级特等奖",
            hall_item_1_desc: "凭借《矿山智能巡检机器人》项目，在数千个参赛项目中脱颖而出，展现了协会顶尖的研发实力。",
            hall_item_2_title: "国家级实用新型专利",
            hall_item_2_desc: "协会成员自主研发的“一种多功能安全监测传感器”获得国家知识产权局授权，标志着技术成果转化的重大突破。",
            hall_item_3_title: "互联网+金奖",
            hall_item_3_desc: "在大学生创新创业大赛中，我们的智慧安全云平台项目获得了专家评委的一致好评。",
            hall_item_4_title: "年度优秀学生社团",
            hall_item_4_desc: "连续三年被评为校级“十佳社团”，在学术氛围、科技创新和社会实践方面均表现卓越。",
            hero_mission: "使命", hero_mission_desc: "以科技守护安全，用创新驱动未来",
            hero_vision: "愿景", hero_vision_desc: "打造国内领先的大学生科创孵化平台",
            hero_values: "价值观", hero_values_desc: "求实、创新、协作、卓越",
            hero_research: "研究方向", hero_research_desc: "智能监测、机器人、安全系统工程",
            experience_title: "光耀星河 · 经验分享记录",
            search_placeholder: "搜索成员姓名或班级...",
            footer_follow: "关注我们", footer_wechat: "扫码关注微信", footer_qq: "扫码加入QQ群", footer_douyin: "扫码关注抖音",
            footer_about: "关于我们", footer_structure: "组织架构", footer_awards: "获奖证书", footer_projects: "研发项目", footer_patents: "专利成果",
            footer_recruit: "招新纳贤", footer_requirements: "招新要求", footer_apply: "报名方式", footer_questions: "常见问题",
            footer_privacy: "隐私政策", footer_terms: "使用条款", footer_sitemap: "网站地图",
            modal_awards: "获奖情况",
            members_core: "核心成员",
            members_service: "服务人员",
            style_big_text: "星河璀璨，创新无界。<br/>在科技的征途中，<br/>书写属于我们的辉煌篇章。",
            style_quote: "创新是引领发展的第一动力，星河人永远在路上。",
            style_final_text: "自协会成立以来，我们怀揣着对科技的热爱，<br/>不懈努力，只为将每一个创新的梦想变为现实。",
            three_top: "星河科技创新协会<br/>Xinghe Sci-Tech<br/>Innovation Association<br/><span class='neon-blue'>探索未知，链接未来。</span>",
            three_bottom: "<div class='text-right'><span class='block text-3xl mb-2'>用科技</span><span class='block text-6xl font-black'>创造<span class='text-blue-400'>星辰大海</span></span></div>"
        },
        en: {
            logo_text: "Xinghe Tech", nav_intro: "Intro", nav_advisor: "Advisors", nav_history: "History", nav_style: "Style", nav_experience: "Experience", nav_achieve: "Awards", nav_members: "Members", nav_join: "Join Us", nav_contact: "Contact", title_teachers: "Our Teachers", advisor_1_title: "Chief Advisor", advisor_2_title: "Tech Advisor", advisor_3_title: "Innovation Advisor", history_scroll: "Scroll", history_fg: "XINGHE Tech<br>History", footer_copyright: "© 2026 Xinghe Tech. All Rights Reserved.",
            history_1: "Association founded, opening a new chapter in safety engineering", history_2: "Smart monitoring launched online", history_3: "Established China's first harmless production line", history_4: "Leading market position with significant results", history_5: "Major breakthrough in power ring technology",
            slider_1: "Explore Infinite Possibilities<br>Solve Real Problems with Innovation",
            slider_2: "Xinghe Tech Association<br>Unite for a Better Future",
            slider_3: "Deep Dive into Safety Engineering<br>Empower Tech Innovation",
            slider_4: "Multiple Provincial Awards<br>Showcasing Team Strength",
            stat_year: "Years Founded", stat_awards: "Provincial Awards", stat_member: "Members Trained",
            stats_title: "Association History", stats_subtitle: "Since 2023",
            stats_item_1: "Core Research Projects", stats_item_2: "National Awards", stats_item_3: "Avg. Patent Output", stats_item_4: "Partner Enterprises",
            milestone_title: "Hall of Fame", milestone_year: "Year", milestone_achieve: "Achievement", milestone_impact: "Impact",
            hall_of_fame_title: "Hall of Fame",
            hall_of_fame_subtitle: "Recording every brilliant moment of the association",
            hall_item_1_title: "Challenge Cup Grand Prize",
            hall_item_1_desc: "With the 'Mine Intelligent Inspection Robot' project, it stood out among thousands of entries, demonstrating the association's top R&D strength.",
            hall_item_2_title: "National Utility Model Patent",
            hall_item_2_desc: "A 'multi-functional safety monitoring sensor' independently developed by association members was authorized by the State Intellectual Property Office.",
            hall_item_3_title: "Internet+ Gold Award",
            hall_item_3_desc: "In the College Students' Innovation and Entrepreneurship Competition, our smart safety cloud platform project received unanimous praise.",
            hall_item_4_title: "Outstanding Student Society",
            hall_item_4_desc: "Voted as one of the 'Top Ten Societies' for three consecutive years, excelling in academic atmosphere and technological innovation.",
            hero_mission: "Mission", hero_mission_desc: "Protect safety with tech, drive future with innovation",
            hero_vision: "Vision", hero_vision_desc: "Build a leading tech innovation platform for students",
            hero_values: "Values", hero_values_desc: "Truth, Innovation, Collaboration, Excellence",
            hero_research: "Research", hero_research_desc: "Smart Monitoring, Robotics, Safety Engineering",
            experience_title: "Xinghe Glory · Experience Sharing",
            search_placeholder: "Search member name or class...",
            footer_follow: "Follow Us", footer_wechat: "Scan for WeChat", footer_qq: "Scan for QQ Group", footer_douyin: "Scan for Douyin",
            footer_about: "About Us", footer_structure: "Structure", footer_awards: "Certificates", footer_projects: "Projects", footer_patents: "Patents",
            footer_recruit: "Recruitment", footer_requirements: "Requirements", footer_apply: "How to Apply", footer_questions: "FAQ",
            footer_privacy: "Privacy Policy", footer_terms: "Terms of Use", footer_sitemap: "Sitemap",
            modal_awards: "Awards",
            members_core: "Core Members",
            members_service: "Service Personnel",
            style_big_text: "STARRY RIVER, BOUNDLESS INNOVATION. <br/>ON THE JOURNEY OF TECHNOLOGY, <br/>WRITING OUR OWN <span class='text-blue-400'>GLORIOUS CHAPTER</span>.",
            style_quote: "Innovation is the primary driver of development; Xinghe people are always on the road.",
            style_final_text: "SINCE THE ASSOCIATION WAS FOUNDED, WE HAVE CARRIED A LOVE FOR TECHNOLOGY, <br/>WORKING TIRELESSLY TO MAKE EVERY INNOVATIVE DREAM COME TRUE.",
            three_top: "Xinghe Sci-Tech<br/>Innovation Association<br/><span class='neon-blue'>Explore the unknown, link the future.</span>",
            three_bottom: "<div class='text-right'><span class='block text-3xl mb-2'>Create the <span class='text-blue-400'>Sea of Stars</span></span><span class='block text-6xl font-black'>with Technology</span></div>"
        }
    };

    const slides = [
        { type: 'galaxy', text: lang === 'zh' ? '探索星河<br>科技守护安全' : 'Explore the Galaxy<br>Tech Guarding Safety' },
        { type: 'video', src: 'https://res.cloudinary.com/dtwkzeixa/video/upload/f_auto,q_auto/微信视频2026-03-14_155822_614_jzhor0.mp4', text: t[lang].slider_1 },
        { type: 'image', src: 'https://s41.ax1x.com/2026/03/12/pekbs3V.jpg', text: t[lang].slider_2 },
        { type: 'image', src: 'https://s41.ax1x.com/2026/03/12/pekbfE9.jpg', text: t[lang].slider_3 },
        { type: 'image', src: 'https://s41.ax1x.com/2026/03/12/pekb2B4.jpg', text: t[lang].slider_4 },
        { type: 'image', src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80', text: "跨学科合作<br>突破技术壁垒" },
        { type: 'image', src: '/public/a571e63fdca829ed428888e19430a731_compressed.jpg', text: "实战模拟演练<br>提升工程效率" },
        { type: 'image', src: '/public/34d0f06b7f10dec793580b9936f4b52b_compressed.jpg', text: "多元文化融合<br>迸发无限灵感" },
        { type: 'image', src: '/public/d342fcca3547b5792307ef9d7bd04970_compressed.jpg', text: "星河长存<br>创新无悔" },
    ];

    // --- Effects ---
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setScrolled(scrollY > 50);
            setShowBackToTop(scrollY > 300);
            
            // Calculate scroll progress for top bar
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const progress = (winScroll / height) * 100;
            
            if (progressBarRef.current) {
                progressBarRef.current.style.width = `${progress}%`;
            }

            // Update scroll progress ring
            if (progressCircleRef.current) {
                const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
                const scrollProgress = scrollY / scrollTotal;
                const circumference = 2 * Math.PI * 30;
                const offset = circumference - (scrollProgress * circumference);
                progressCircleRef.current.style.strokeDashoffset = offset.toString();
            }

            // Reveal animation
            document.querySelectorAll('.reveal').forEach(el => {
                if(el.getBoundingClientRect().top < window.innerHeight - 100) {
                    el.classList.add('active');
                }
            });
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (window.innerWidth < 1024) return;
            setCursorPos({ x: e.clientX, y: e.clientY });
            
            // Check if hovering over interactive elements
            const target = e.target as HTMLElement;
            const isClickable = target.closest('button, a, .member-card, .award-item-museum, .news-card, .bento-item, .nav-link-museum');
            setIsHovering(!!isClickable);
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Background Color Transitions & Active Section Tracking
    useEffect(() => {
        const sections = ['#intro', '#history', '#advisor', '#style', '#experience', '#achievements', '#news', '#members', '#join', '#contact'];
        const bgColors = {
            '#intro': '#050505',
            '#history': '#0d1117',
            '#advisor': '#050505',
            '#style': '#050505',
            '#experience': '#050505',
            '#achievements': '#ffffff',
            '#news': '#f0f7ff',
            '#members': '#e5e7eb',
            '#join': '#e5e7eb',
            '#contact': '#e5e7eb'
        };

        // Reset to initial color when at the very top
        ScrollTrigger.create({
            trigger: 'body',
            start: "top top",
            end: "top 10%",
            onEnterBack: () => {
                gsap.to('body', { backgroundColor: '#050505', duration: 1, ease: "power2.inOut" });
                document.body.classList.remove('light-theme');
                setActiveSection('intro');
            }
        });

        const triggers = sections.map((selector) => {
            return ScrollTrigger.create({
                trigger: selector,
                start: "top 50%",
                end: "bottom 50%",
                onToggle: (self) => {
                    if (self.isActive) {
                        setActiveSection(selector.substring(1));
                    }
                },
                onEnter: () => {
                    if (bgColors[selector as keyof typeof bgColors]) {
                        gsap.to('body', { backgroundColor: bgColors[selector as keyof typeof bgColors], duration: 1.2, ease: "power2.inOut" });
                    }
                    if (['#achievements', '#news', '#members', '#join', '#contact'].includes(selector)) {
                        document.body.classList.add('light-theme');
                    } else {
                        document.body.classList.remove('light-theme');
                    }
                },
                onEnterBack: () => {
                    if (bgColors[selector as keyof typeof bgColors]) {
                        gsap.to('body', { backgroundColor: bgColors[selector as keyof typeof bgColors], duration: 1.2, ease: "power2.inOut" });
                    }
                    if (['#achievements', '#news', '#members', '#join', '#contact'].includes(selector)) {
                        document.body.classList.add('light-theme');
                    } else {
                        document.body.classList.remove('light-theme');
                    }
                }
            });
        });

        // Refresh after a delay to ensure all dynamic heights are accounted for
        const timer = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 1500);

        return () => {
            triggers.forEach(t => t.kill());
            clearTimeout(timer);
        };
    }, []);

    // Slider Timer
    useEffect(() => {
        let timer: NodeJS.Timeout;
        
        // Disable auto-paging for galaxy slide to let users explore
        if (slides[currentSlide].type === 'galaxy') {
            return;
        }

        if (slides[currentSlide].type === 'video' && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
            videoRef.current.onended = () => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            };
        } else {
            timer = setTimeout(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [currentSlide, slides.length]);

    // Hall of Fame 1:1 Lando Parallax & Horizontal Scroll
    useEffect(() => {
        if (!hallOfFameRef.current || !horizontalScrollRef.current) return;

        const ctx = gsap.context(() => {
            // Wait a moment for layout to stabilize
            setTimeout(() => {
                if (!horizontalScrollRef.current || !hallOfFameRef.current || !experienceRef.current) return;
                
                const initScroll = () => {
                    if (!horizontalScrollRef.current || !hallOfFameRef.current || !experienceRef.current) return;
                    
                    // Kill all existing triggers related to this section to avoid stacking
                    ScrollTrigger.getAll().forEach(t => {
                        if (t.vars.id === "achievements-pin" || (t.trigger === hallOfFameRef.current && t.vars.scrub)) {
                            t.kill();
                        }
                    });
                    
                    // IMPORTANT: Reset transform before measuring scrollWidth to get accurate dimensions
                    gsap.set(horizontalScrollRef.current, { x: 0 });
                    
                    // Force layout recalculation
                    const scrollWidth = horizontalScrollRef.current.scrollWidth;
                    const windowWidth = window.innerWidth;
                    
                    // If scrollWidth is too small, it's likely not loaded yet or flex items are wrapping.
                    if (scrollWidth <= windowWidth + 100 && horizontalScrollRef.current.children.length > 3) {
                        return;
                    }

                    const scrollDistance = Math.max(0, scrollWidth - windowWidth);
                    
                    // Pin the Achievements section
                    ScrollTrigger.create({
                        trigger: hallOfFameRef.current,
                        start: "top top",
                        end: () => `+=${scrollDistance}`,
                        pin: true,
                        pinSpacing: true,
                        invalidateOnRefresh: true,
                        id: "achievements-pin",
                        onRefresh: (self) => {
                            if (self.progress === 0) {
                                gsap.set(horizontalScrollRef.current, { x: 0 });
                            }
                        }
                    });

                    // Timeline for horizontal scroll
                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: hallOfFameRef.current,
                            start: "top top",
                            end: () => `+=${scrollDistance}`,
                            scrub: 1,
                            invalidateOnRefresh: true,
                        }
                    });

                    tl.to(horizontalScrollRef.current, {
                        x: -scrollDistance,
                        ease: "none",
                        onUpdate: function() {
                            const progress = this.progress();
                            const counter = document.querySelector('.lando-counter span');
                            const progressBar = document.querySelector('.lando-progress-fill') as HTMLElement;
                            
                            if (counter) {
                                const slideNum = Math.min(8, Math.max(1, Math.ceil(progress * 8)));
                                counter.textContent = slideNum.toString();
                            }
                            
                            if (progressBar) {
                                progressBar.style.width = `${progress * 100}%`;
                            }
                        }
                    });

                    // Parallax for individual items
                    const layers = gsap.utils.toArray<HTMLElement>('.parallax-layer');
                    layers.forEach((layer) => {
                        const speed = parseFloat(layer.dataset.speed || '0');
                        gsap.to(layer, {
                            x: () => -200 * speed,
                            y: () => 120 * speed,
                            ease: "none",
                            scrollTrigger: {
                                trigger: hallOfFameRef.current,
                                start: "top top",
                                end: () => `+=${scrollDistance}`,
                                scrub: true,
                                invalidateOnRefresh: true,
                            }
                        });
                    });

                    // Animate all scribbles with scroll
                    const scribbles = document.querySelectorAll('.scribble-animate');
                    scribbles.forEach((scribble) => {
                        const path = scribble as SVGPathElement;
                        const length = path.getTotalLength();
                        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
                        
                        // Find the nearest section to use as trigger
                        const section = path.closest('section') || hallOfFameRef.current;
                        
                        gsap.to(path, {
                            strokeDashoffset: 0,
                            ease: "none",
                            scrollTrigger: {
                                trigger: section,
                                start: "top 80%",
                                end: "top 20%",
                                scrub: 1,
                                invalidateOnRefresh: true,
                            }
                        });
                    });

                    // Special handling for the main signature in Achievements to draw during horizontal scroll
                    if (scribbleRef.current) {
                        const signature = scribbleRef.current.querySelector('#xinghe-signature') as SVGPathElement;
                        if (signature) {
                            const length = signature.getTotalLength();
                            gsap.set(signature, { strokeDasharray: length, strokeDashoffset: length });
                            gsap.to(signature, {
                                strokeDashoffset: 0,
                                ease: "none",
                                scrollTrigger: {
                                    trigger: hallOfFameRef.current,
                                    start: "top top",
                                    end: () => `+=${scrollDistance * 0.5}`,
                                    scrub: 1,
                                    invalidateOnRefresh: true,
                                }
                            });
                        }
                    }

                    ScrollTrigger.refresh();
                };

                // Use ResizeObserver for more reliable initialization
                const ro = new ResizeObserver(() => {
                    initScroll();
                });
                if (horizontalScrollRef.current) ro.observe(horizontalScrollRef.current);

                // Initial attempts
                initScroll();
                setTimeout(initScroll, 500);
                setTimeout(initScroll, 2000);
                
                window.addEventListener('load', initScroll);
                window.addEventListener('resize', initScroll);

                return () => {
                    ro.disconnect();
                    window.removeEventListener('load', initScroll);
                    window.removeEventListener('resize', initScroll);
                };
            }, 100);
        }, hallOfFameRef);

        return () => ctx.revert();
    }, []);

    // Three.js & GSAP 3D Effect
    useEffect(() => {
        if (!mainCanvasRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 6;

        const renderer = new THREE.WebGLRenderer({ canvas: mainCanvasRef.current, alpha: true, antialias: window.innerWidth >= 1024 });
        renderer.setSize(window.innerWidth, window.innerHeight);
        const isMobile = window.innerWidth < 1024;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
        // In Three.js r152+, outputEncoding is replaced by outputColorSpace
        (renderer as any).outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2; 

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let isFlipping = false;

        const onCanvasClick = (event: MouseEvent) => {
            if (!badgeGroupRef.current || isFlipping) return;

            const rect = mainCanvasRef.current!.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(badgeGroupRef.current.children, true);

            if (intersects.length > 0) {
                isFlipping = true;
                gsap.to(badgeGroupRef.current.rotation, {
                    y: badgeGroupRef.current.rotation.y + Math.PI * 2,
                    duration: 1.2,
                    ease: "back.inOut(1.7)",
                    onComplete: () => { isFlipping = false; }
                });
            }
        };

        mainCanvasRef.current.addEventListener('click', onCanvasClick);

        // --- Post Processing (Bloom) ---
        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // --- 0. Mouse Tracking for Parallax (Disabled per user request) ---
        // const mouse = { x: 0, y: 0 };
        // const handleMouseMove = (event: MouseEvent) => {
        //     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        //     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        // };
        // window.addEventListener('mousemove', handleMouseMove);

        // --- 0.5 Enhanced Particle System (Realistic Bokeh Dust) ---
        const particlesCount = isMobile ? 40 : 150;
        const positions = new Float32Array(particlesCount * 3);
        const sizes = new Float32Array(particlesCount);
        const randoms = new Float32Array(particlesCount); // For individual animation offsets

        for(let i = 0; i < particlesCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
            sizes[i] = Math.random() * 0.2 + 0.05;
            randoms[i] = Math.random();
        }

        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particlesGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        // Create a soft bokeh texture programmatically
        const createParticleTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(canvas);
        };

        const particlesMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: createParticleTexture() }
            },
            vertexShader: `
                uniform float uTime;
                attribute float size;
                attribute float aRandom;
                varying float vAlpha;
                void main() {
                    vec3 pos = position;
                    // Organic drifting movement
                    pos.x += sin(uTime * 0.2 + aRandom * 10.0) * 0.5;
                    pos.y += cos(uTime * 0.3 + aRandom * 10.0) * 0.5;
                    pos.z += sin(uTime * 0.1 + aRandom * 10.0) * 0.3;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    // Size attenuation (smaller when far)
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;

                    // Twinkling effect based on time and random offset
                    vAlpha = 0.2 + 0.8 * (0.5 + 0.5 * sin(uTime * 1.2 + aRandom * 20.0));
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                varying float vAlpha;
                void main() {
                    vec4 texColor = texture2D(uTexture, gl_PointCoord);
                    gl_FragColor = vec4(texColor.rgb, texColor.a * vAlpha * 0.5);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.4,  // 强度 (strength)
            0.4,  // 半径 (radius)
            0.85  // 阈值 (threshold)
        );
        if (isMobile) bloomPass.enabled = false;
        composer.addPass(bloomPass);

        // --- 1. 环境映射 (Environment Mapping) ---
        // 使用 PMREMGenerator 生成一个程序化的环境贴图，让金属反射更真实
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        
        // 创建一个临时的环境场景来捕捉光影
        const envScene = new THREE.Scene();
        const envPoint1 = new THREE.PointLight(0xffffff, 50);
        envPoint1.position.set(5, 5, 5);
        envScene.add(envPoint1);
        const envPoint2 = new THREE.PointLight(0x4444ff, 30);
        envPoint2.position.set(-5, -5, -5);
        envScene.add(envPoint2);
        
        const envTarget = pmremGenerator.fromScene(envScene);
        scene.environment = envTarget.texture;

        // 2. 全局环境光：提供基础亮度，不需要太高
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
        scene.add(ambientLight);

        // 2. 正面点光源：调低强度，避免正面过曝
        const frontPointLight = new THREE.PointLight(0xffffff, 1.5, 20); 
        frontPointLight.position.set(0, 0, 8); 
        scene.add(frontPointLight);

        // 3. 侧面补光：调低强度，消除那个刺眼的“大灯”白斑
        const rimLight = new THREE.DirectionalLight(0xffffff, 1.0); 
        rimLight.position.set(-5, 5, 5); 
        scene.add(rimLight);

        const loadingManager = new THREE.LoadingManager();
        loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            setLoadingProgress(Math.round((itemsLoaded / itemsTotal) * 100));
        };
        loadingManager.onLoad = () => {
            // Check if page is also loaded
            const checkAllLoaded = () => {
                if (document.readyState === 'complete') {
                    // Small delay for a smoother transition
                    setTimeout(() => {
                        if (loadingOverlayRef.current) {
                            gsap.to(loadingOverlayRef.current, {
                                opacity: 0,
                                duration: 1.2,
                                ease: "power3.inOut",
                                onComplete: () => setIs3DLoading(false)
                            });
                        } else {
                            setIs3DLoading(false);
                        }
                    }, 800);
                } else {
                    // If page not ready, wait a bit and check again
                    setTimeout(checkAllLoaded, 100);
                }
            };
            checkAllLoaded();
        };

        const badgeGroup = new THREE.Group();
        badgeGroupRef.current = badgeGroup;
        const textureLoader = new THREE.TextureLoader(loadingManager);
        
        // Use a placeholder for the badge logo
        textureLoader.load('/logo-main.png', (frontTex) => {
            textureLoader.load('/back-logo.png', (backTex) => {
                const geometry = new THREE.CylinderGeometry(1.8, 1.8, 0.25, 64);
                
                // Fix front texture orientation: ensure it's upright and not mirrored
                frontTex.center.set(0.5, 0.5);
                frontTex.rotation = 0; 
                frontTex.repeat.x = 1;
                frontTex.offset.x = 0;

                // Fix back texture orientation: ensure it's upright and not mirrored
                backTex.center.set(0.5, 0.5);
                backTex.rotation = Math.PI; // Keep rotation to stay upright
                backTex.repeat.x = 1; 
                backTex.offset.x = 0;

                // Configure textures for better clarity and color accuracy
                frontTex.colorSpace = THREE.SRGBColorSpace;
                frontTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                backTex.colorSpace = THREE.SRGBColorSpace;
                backTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

                // 1. 正面材质（Logo面）：干净、平滑的滴胶质感
                const frontMat = new THREE.MeshPhysicalMaterial({
                  map: frontTex,
                  metalness: 0.0,
                  roughness: 0.05,          // 稍微增加一点粗糙度，减少刺眼的反射
                  clearcoat: 1.0,
                  clearcoatRoughness: 0.0,
                  transparent: true,        // 开启透明支持
                  alphaTest: 0.1,           // 过滤掉接近透明的像素
                });

                // 2. 背面材质
                const backMat = new THREE.MeshPhysicalMaterial({
                  map: backTex,
                  metalness: 0.0,
                  roughness: 0.05,
                  clearcoat: 1.0,
                  clearcoatRoughness: 0.0,
                  transparent: true,
                  alphaTest: 0.1,
                });

                // 3. 侧边材质：哑光拉丝感银色
                const metalMat = new THREE.MeshPhysicalMaterial({
                  color: 0xdddddd,          
                  metalness: 0.9,           // 依然是金属
                  roughness: 0.2,           // 增加粗糙度，让反射变模糊，消除锐利的白斑
                  clearcoat: 0.5,           // 降低涂层反射
                  clearcoatRoughness: 0.1,
                  reflectivity: 0.5,        // 降低反射率
                  envMapIntensity: 0.8      // 降低环境贴图强度，让它看起来更沉稳
                });

                const badgeMesh = new THREE.Mesh(geometry, [metalMat, frontMat, backMat]);
            badgeMesh.rotation.x = Math.PI / 2;
            badgeMesh.rotation.y = Math.PI / 2; 


            badgeGroup.add(badgeMesh);
            scene.add(badgeGroup);

            badgeGroup.position.set(2.2, 0, 0);
            badgeGroup.rotation.set(0, Math.PI * 2, 0); // Start facing forward (Logo side)

            // GSAP Animations for 3D
            // Initial state: Hidden
            gsap.set(["#webgl-container", "#text1-three", "#text2-three"], { opacity: 0 });

            // 1. Container Visibility (Robust Range Control)
            // This ensures the badge is visible throughout the entire 3D section and reappears when scrolling back up
            ScrollTrigger.create({
                trigger: "#sec-hero-three",
                start: "top 80%",
                endTrigger: "#advisor",
                end: "top top",
                onToggle: self => gsap.to("#webgl-container", { 
                    opacity: self.isActive ? 1 : 0, 
                    duration: 0.4,
                    overwrite: "auto" 
                })
            });

            // 2. Hero Section Animations (Badge Movement & Text Transitions)
            // The badge moves to center as we scroll through the master wrapper
            const heroTl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".three-master-wrapper",
                    start: "top top",
                    endTrigger: "#history",
                    end: "top top",
                    scrub: 2 // Increased for more "weight" and smoothness
                }
            });

            // Badge Path: Stay Right & Front -> Center
            heroTl.to(badgeGroup.position, { x: 2.2, y: 0, z: 0, duration: 0.75, ease: "power2.inOut" })
                  .to(badgeGroup.rotation, { y: Math.PI * 2, x: 0, z: 0, duration: 0.75, ease: "power2.inOut" }, 0)
                  .to(badgeGroup.scale, { x: 0.4, y: 0.4, z: 0.4, duration: 0.75, ease: "power2.inOut" }, 0) // Scale up early and smoothly
                  .to(badgeGroup.position, { x: 0, y: 0, z: 0, duration: 0.75, ease: "power2.inOut" })
                  .to(badgeGroup.rotation, { y: Math.PI * 4, x: 0, z: 0, duration: 0.75, ease: "power2.inOut" }, 0.75);

            // Text Fading
            gsap.to("#text1-three", {
                opacity: 1,
                scrollTrigger: {
                    trigger: "#sec-hero-three",
                    start: "top 20%",
                    end: "top -20%",
                    scrub: true
                }
            });

            gsap.to("#text2-three", {
                opacity: 1,
                scrollTrigger: {
                    trigger: "#sec-hero-three",
                    start: "top -50%",
                    end: "top -100%",
                    scrub: true
                }
            });

            // Final Fade out for texts ONLY
            gsap.to(["#text1-three", "#text2-three"], {
                opacity: 0,
                scrollTrigger: {
                    trigger: "#sec-huge-three",
                    start: "top 20%",
                    end: "top -20%",
                    scrub: true
                }
            });

            // No more animations in huge-text-section to keep it "fixed" there
            
            // Refresh ScrollTrigger to ensure correct positions
            ScrollTrigger.refresh();

            // Number counting animation
            const nums = document.querySelectorAll('.animate-num');
            nums.forEach(el => {
                const num = el as HTMLElement;
                const target = parseFloat(num.innerText);
                const obj = { val: 0 };
                gsap.to(obj, {
                    val: target,
                    duration: 2,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: "#sec-stats-three",
                        start: "top 70%",
                    },
                    onUpdate: () => {
                        // Simple check for the 8.5 case
                        if (target === 8.5) {
                            num.innerHTML = `${Math.floor(obj.val)}<span style="font-size: 30px;">.${Math.round((obj.val % 1) * 10)}</span>`;
                        } else {
                            num.innerText = Math.floor(obj.val).toString();
                        }
                    }
                });
            });
        });
    });

        let animationId: number;
        const clock = new THREE.Clock();
        let isVisible = true;
        const observer = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
        }, { threshold: 0.1 });
        if (mainCanvasRef.current) observer.observe(mainCanvasRef.current);

        const threeAnimate = () => {
            animationId = requestAnimationFrame(threeAnimate);
            if (!isVisible) return;
            
            const elapsedTime = clock.getElapsedTime();
            
            if (badgeGroupRef.current) {
                // 1. Idle Floating (Breathing)
                // Subtle Y movement and very slow base rotation
                badgeGroupRef.current.position.y = Math.sin(elapsedTime * 0.8) * 0.15;
                
                // 2. Mouse Parallax (Disabled per user request)
                // badgeGroupRef.current.rotation.x += (0 - badgeGroupRef.current.rotation.x) * 0.05;
                // badgeGroupRef.current.rotation.z += (0 - badgeGroupRef.current.rotation.z) * 0.05;
            }

            // 3. Enhanced Particles Animation
            if (particlesMaterial.uniforms) {
                particlesMaterial.uniforms.uTime.value = elapsedTime;
            }
            particles.rotation.y = elapsedTime * 0.01;

            composer.render();
        };
        threeAnimate();

        // Anime.js SVG Animation
        animate(svg.createDrawable('.huge-svg .line'), {
            draw: ['0 0', '0 1', '1 1'],
            ease: 'inOutQuad',
            duration: 2000,
            delay: stagger(100),
            loop: true
        });

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
            ScrollTrigger.getAll().forEach(t => t.kill());
            
            // Dispose Three.js resources
            scene.traverse((object: any) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach((material: any) => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            renderer.dispose();
            composer.dispose();
            pmremGenerator.dispose();
            cancelAnimationFrame(animationId);
        };
    }, []);

    // History GSAP
    useEffect(() => {
        // Video Inspired History Animation
        const track = document.querySelector(".history-items-wrapper");
        const items = document.querySelectorAll(".history-item");
        const bgText = document.querySelector(".history-bg-text");
        const wheel = document.querySelector(".history-wheel-bg");
        const scrollHint = document.querySelector(".history-scroll-hint");
        
        if (track) {
            const historyTl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#history",
                    start: "top top",
                    end: "bottom bottom",
                    pin: true,
                    scrub: 2, // Matched with previous sections for consistency
                    onEnter: () => gsap.to("#history", { autoAlpha: 1, duration: 0.5, overwrite: "auto" }),
                    onLeave: () => gsap.to("#history", { autoAlpha: 0, duration: 0.5, overwrite: "auto" }),
                    onEnterBack: () => gsap.to("#history", { autoAlpha: 1, duration: 0.5, overwrite: "auto" }),
                    onLeaveBack: () => gsap.to("#history", { autoAlpha: 0, duration: 0.5, overwrite: "auto" })
                }
            });

            // 1. Initial Phase: Center the badge perfectly before horizontal scroll starts
            if (badgeGroupRef.current) {
                historyTl.to(badgeGroupRef.current.position, { x: 0, y: 0, z: 0, duration: 0.5, ease: "power2.inOut" });
                // Removed scale animation here to maintain the size from the previous section
            }

            // 2. Horizontal Scroll Phase: Move the track while badge stays fixed
            historyTl.to(track, {
                x: () => -(track.scrollWidth - window.innerWidth),
                ease: "none",
                duration: 3
            }, ">");

            // Continuous rotation during horizontal scroll
            if (badgeGroupRef.current) {
                historyTl.to(badgeGroupRef.current.rotation, { 
                    y: "+=" + (Math.PI * 6), // 3 full rotations to end back at front-facing
                    ease: "none",
                    duration: 3
                }, "<");
            }

            // 3. Parallax for background text
            if (bgText) {
                historyTl.to(bgText, {
                    x: -1500,
                    ease: "none",
                    duration: 3
                }, "<");
            }

            // 4. Scroll-driven wheel rotation
            if (wheel) {
                historyTl.to(wheel, {
                    rotation: 1080,
                    ease: "none",
                    duration: 3
                }, "<");
            }

            // 4. Fade out scroll hint
            if (scrollHint) {
                historyTl.to(scrollHint, {
                    opacity: 0,
                    y: -50,
                    ease: "power2.in",
                    duration: 0.3
                }, 0); // Fade out early
            }

            // 5. Buffer at the end to ensure 2026 is seen
            historyTl.to({}, { duration: 0.5 }); 
            if (badgeGroupRef.current) {
                historyTl.to(badgeGroupRef.current.rotation, { 
                    y: Math.PI * 8, // Ensure it's perfectly forward facing (multiple of 2PI)
                    duration: 0.5,
                    ease: "power2.out"
                }, "<");
            }
            // 6. Final Fade Out of content to prevent leakage (including the badge)
            historyTl.to([track, bgText, wheel, ".history-red-track", "#webgl-container"], {
                opacity: 0,
                y: -100,
                duration: 0.5,
                ease: "power2.in"
            }, ">");

            // 5. Active state for items as they pass the center
            items.forEach((item) => {
                ScrollTrigger.create({
                    trigger: item,
                    containerAnimation: historyTl,
                    start: "center center+=400", // Activate much earlier
                    end: "center center-=400",   // Stay active longer
                    onToggle: self => {
                        if (self.isActive) item.classList.add("active");
                        else item.classList.remove("active");
                    }
                });
            });

            // Force refresh after a tick to ensure scrollWidth is correct
            setTimeout(() => ScrollTrigger.refresh(), 100);
        }
    }, []);

    // Style Transition GSAP (Lando Norris Inspired)
    useEffect(() => {
        if (!styleTransitionRef.current) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: styleTransitionRef.current,
                    start: "top top",
                    end: "+=2000",
                    pin: true,
                    scrub: 1,
                }
            });

            tl.set(".style-transition-text-left", { xPercent: -300, yPercent: -50 });
            tl.set(".style-transition-text-right", { xPercent: 300, yPercent: -50 });

            // 1. Initial state: Image is full screen, text is outside
            // 2. Animation: Image shrinks to card, text flies in
            tl.to(".style-transition-image-wrapper", {
                width: "400px",
                height: "550px",
                borderRadius: "24px",
                rotation: -5,
                boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
                ease: "none"
            }, 0);

            tl.to(".style-transition-image", {
                scale: 1,
                ease: "none"
            }, 0);

            tl.to(".style-transition-text-left", {
                xPercent: -150,
                opacity: 1,
                ease: "none"
            }, 0);

            tl.to(".style-transition-text-right", {
                xPercent: 50,
                opacity: 1,
                ease: "none"
            }, 0);

            // 3. Scribble animation
            tl.to(".style-transition-scribble-wrapper", {
                opacity: 1,
                duration: 0.2
            }, 0.5);

            tl.to(".style-transition-scribble-path", {
                strokeDashoffset: 0,
                duration: 1,
                ease: "power2.inOut"
            }, 0.5);

            // 4. Final fade out to reveal the next section
            tl.to(styleTransitionRef.current, {
                opacity: 0,
                scale: 0.9,
                duration: 0.5
            }, 1.5);

        }, styleTransitionRef);

        return () => ctx.revert();
    }, []);

    // Style Bento Animation
    useEffect(() => {
        gsap.fromTo(".bento-item", 
            { y: 60, opacity: 0, scale: 0.9 },
            {
                y: 0, opacity: 1, scale: 1,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".bento-grid",
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            }
        );
        
        gsap.to(".style-bg-text", {
            x: -100,
            scrollTrigger: {
                trigger: "#style",
                start: "top bottom",
                end: "bottom top",
                scrub: 2
            }
        });
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.4;
        }
    }, []);

    // --- Handlers ---
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleMusic = () => {
        console.log("Toggle music clicked. Current state:", isMusicPlaying);
        if (audioRef.current) {
            if (isMusicPlaying) {
                console.log("Pausing audio");
                audioRef.current.pause();
                setIsMusicPlaying(false);
            } else {
                console.log("Attempting to play audio from:", audioRef.current.src);
                audioRef.current.volume = 0.4;
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log("Playback started successfully");
                        setIsMusicPlaying(true);
                    }).catch(error => {
                        console.error("Playback failed:", error);
                        setIsMusicPlaying(false);
                    });
                }
            }
        } else {
            console.error("Audio ref is null");
        }
    };
    const switchLang = (l: 'zh' | 'en') => setLang(l);
    const changeSlide = (n: number) => {
        setCurrentSlide((prev) => (prev + n + slides.length) % slides.length);
    };
    const moveCarousel = (d: number) => {
        const total = 6; // Total items
        setAchieveIndex((prev) => (prev + d + total) % total);
    };

    const showMemberModal = (id: string) => setSelectedMember(memberData[id]);
    const closeMemberModal = () => setSelectedMember(null);
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <div className="relative">
            {/* Scroll Progress Bar (Idea 7) */}
            <div ref={progressBarRef} className="scroll-progress-bar"></div>

            {/* Custom Cursor (Idea 8) */}
            <div 
                className={`custom-cursor hidden lg:flex ${isHovering ? 'hover' : ''}`}
                style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
            >
                <div className="star-cursor">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                    </svg>
                </div>
            </div>
            {/* Splash Screen */}
            <div className={`splash-screen ${!isLoading ? 'hidden' : ''}`}>
                <div className="splash-logo mb-8">
                    <img 
                        src="/wechat-qr.png" 
                        alt="星河科技创新协会" 
                        className="h-24 md:h-32 w-auto object-contain splash-logo-img" 
                        referrerPolicy="no-referrer"
                    />
                </div>
                <div className="splash-loader-text">星河科技创新协会</div>
            </div>

            {/* Header */}
            <header className={scrolled ? 'scrolled' : ''}>
                <div className="header-content">
                    <div className="logo h-14 flex items-center">
                        <img 
                            src="/wechat-qr.png" 
                            alt="星河科技创新协会" 
                            className="h-full w-auto object-contain scale-125 origin-left nav-logo-img" 
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <div className="menu-btn" onClick={toggleMenu}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </div>
                    <ul className={`nav-links ${isMenuOpen ? 'show' : ''}`}>
                        <li><a href="#intro" className={`nav-item ${activeSection === 'intro' ? 'active' : ''}`}>{t[lang].nav_intro}</a></li>
                        <li><a href="#history" className={`nav-item ${activeSection === 'history' ? 'active' : ''}`}>{t[lang].nav_history}</a></li>
                        <li><a href="#advisor" className={`nav-item ${activeSection === 'advisor' ? 'active' : ''}`}>{t[lang].nav_advisor}</a></li>
                        <li><a href="#style" className={`nav-item ${activeSection === 'style' ? 'active' : ''}`}>{t[lang].nav_style}</a></li>
                        <li><a href="#experience" className={`nav-item ${activeSection === 'experience' ? 'active' : ''}`}>{t[lang].nav_experience}</a></li>
                        <li><a href="#achievements" className={`nav-item ${activeSection === 'achievements' ? 'active' : ''}`}>{t[lang].nav_achieve}</a></li>
                        <li><a href="#news" className={`nav-item ${activeSection === 'news' ? 'active' : ''}`}>动态资讯</a></li>
                        <li><a href="#members" className={`nav-item ${activeSection === 'members' ? 'active' : ''}`}>{t[lang].nav_members}</a></li>
                        <li><a href="#join" className={`nav-item text-red-600 font-bold ${activeSection === 'join' ? 'active' : ''}`}>{t[lang].nav_join}</a></li>
                        <li><a href="#contact" className={`nav-item ${activeSection === 'contact' ? 'active' : ''}`}>{t[lang].nav_contact}</a></li>
                    </ul>
                    <div className="lang-switch">
                        <button 
                            className={`music-toggle ${isMusicPlaying ? 'playing' : ''}`} 
                            onClick={toggleMusic}
                            aria-label={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
                            type="button"
                        >
                            <Music size={18} />
                            <div className="music-bars">
                                <span></span><span></span><span></span>
                            </div>
                        </button>
                        <span className={lang === 'zh' ? 'active' : ''} onClick={() => switchLang('zh')}>简</span> / <span className={lang === 'en' ? 'active' : ''} onClick={() => switchLang('en')}>EN</span>
                    </div>
                </div>
                <audio 
                    ref={audioRef} 
                    loop 
                    preload="auto"
                    crossOrigin="anonymous"
                    src="https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3" 
                    onLoadStart={() => console.log("Audio load started")}
                    onCanPlay={() => console.log("Audio can play")}
                    onPlay={() => console.log("Audio started playing")}
                    onPause={() => console.log("Audio paused")}
                    onVolumeChange={() => console.log("Audio volume changed to:", audioRef.current?.volume)}
                    onWaiting={() => console.log("Audio waiting for data...")}
                    onStalled={() => console.log("Audio stalled")}
                    onSuspend={() => console.log("Audio suspended")}
                    onEmptied={() => console.log("Audio emptied")}
                    onAbort={() => console.log("Audio aborted")}
                    onEnded={() => console.log("Audio ended")}
                    onProgress={() => console.log("Audio progress...")}
                    onLoadedMetadata={() => console.log("Audio metadata loaded")}
                    onLoadedData={() => console.log("Audio data loaded")}
                    onError={(e) => console.error("Audio error:", e)}
                />
            </header>

            {/* 1. Hero Slider */}
            <section id="intro" className="hero-slider relative">
                {currentSlide !== 0 && <GalaxyParticles />}
                {slides.map((slide, index) => (
                    <div key={index} className={`slide ${currentSlide === index ? 'active' : ''}`}>
                        {slide.type === 'galaxy' ? (
                            <div className="absolute inset-0 z-0">
                                <Galaxy3D />
                            </div>
                        ) : slide.type === 'video' ? (
                            <video ref={videoRef} className="slide-media" autoPlay muted playsInline preload="auto">
                                <source src={slide.src} type="video/mp4" />
                            </video>
                        ) : (
                            <img className="slide-media" src={slide.src} alt="" />
                        )}
                        <div className="slide-overlay"></div>
                        <div className="slide-content pointer-events-none">
                            <h2 className="pointer-events-auto" dangerouslySetInnerHTML={{ __html: slide.text }}></h2>
                            {slide.type === 'galaxy' && (
                                <button 
                                    onClick={() => changeSlide(1)}
                                    className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all flex items-center gap-3 group pointer-events-auto"
                                >
                                    {lang === 'zh' ? '查看团队简介' : 'View Team Intro'}
                                    <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            )}
                            {slide.type !== 'galaxy' && (
                                <div className="hero-info-grid pointer-events-auto">
                                    <div className="hero-info-item">
                                        <div className="hero-info-label">{t[lang].hero_mission}</div>
                                        <div className="hero-info-value">{t[lang].hero_mission_desc}</div>
                                    </div>
                                    <div className="hero-info-item">
                                        <div className="hero-info-label">{t[lang].hero_vision}</div>
                                        <div className="hero-info-value">{t[lang].hero_vision_desc}</div>
                                    </div>
                                    <div className="hero-info-item">
                                        <div className="hero-info-label">{t[lang].hero_values}</div>
                                        <div className="hero-info-value">{t[lang].hero_values_desc}</div>
                                    </div>
                                    <div className="hero-info-item">
                                        <div className="hero-info-label">{t[lang].hero_research}</div>
                                        <div className="hero-info-value">{t[lang].hero_research_desc}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div className="slider-arrows">
                    <div className="slider-arrow" onClick={() => changeSlide(-1)}><ChevronLeft /></div>
                    <div className="slider-arrow" onClick={() => changeSlide(1)}><ChevronRight /></div>
                </div>
                <div className="slider-nav">
                    {slides.map((_, index) => (
                        <div 
                            key={index} 
                            className={`slider-dot ${currentSlide === index ? 'active' : ''}`} 
                            onClick={() => setCurrentSlide(index)}
                        ></div>
                    ))}
                </div>
                {/* Mode Toggle Button */}
                <button 
                    onClick={() => setCurrentSlide(currentSlide === 0 ? 1 : 0)}
                    className="absolute bottom-10 right-10 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/20 flex items-center gap-2 transition-all"
                >
                    {currentSlide === 0 ? <Laptop size={18} /> : <Trophy size={18} />}
                    {currentSlide === 0 ? (lang === 'zh' ? '查看简介' : 'View Intro') : (lang === 'zh' ? '探索星河' : 'Explore Galaxy')}
                </button>
            </section>

            {/* 2. Milestones */}
            <div className="milestones reveal">
                <div className="stat-item"><h3 className="animate-num">5</h3><p>{t[lang].stat_year}</p></div>
                <div className="stat-item"><h3 className="animate-num">24</h3><p>{t[lang].stat_awards}</p></div>
                <div className="stat-item"><h3 className="animate-num">50</h3><p>{t[lang].stat_member}</p></div>
            </div>

            {/* --- 3D SCROLLING MODULE (Master Wrapper) --- */}
            <div className="three-master-wrapper cursor-none">
                {/* The Sticky Container for the Badge */}
                <div id="webgl-container" className="fixed inset-0 z-0 pointer-events-none" style={{ background: 'transparent' }}>
                    {is3DLoading && (
                        <div ref={loadingOverlayRef} className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#050505] overflow-hidden">
                            {/* Animated Background Elements */}
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan-line"></div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
                            </div>

                            <div className="relative z-10 flex flex-col items-center">
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="mb-12"
                                >
                                    <h1 className="text-4xl md:text-6xl font-black tracking-[0.3em] text-white uppercase lando-sig-font">
                                        星河科技创新协会
                                    </h1>
                                    <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-600 to-transparent mt-4 shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
                                </motion.div>

                                <div className="w-72 md:w-96 h-[3px] bg-white/5 rounded-full overflow-hidden relative">
                                    <div 
                                        className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                                        style={{ width: `${loadingProgress}%` }}
                                    ></div>
                                    {/* Glint effect on progress bar */}
                                    <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ left: `${loadingProgress - 10}%` }}></div>
                                </div>

                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-6 flex flex-col items-center gap-2"
                                >
                                    <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] font-mono animate-pulse">
                                        Initializing System Core
                                    </p>
                                    <p className="text-blue-400/60 text-[14px] font-mono font-bold">
                                        {loadingProgress}%
                                    </p>
                                </motion.div>
                            </div>

                            {/* Corner Accents */}
                            <div className="absolute top-10 left-10 w-12 h-12 border-t-2 border-l-2 border-white/10"></div>
                            <div className="absolute top-10 right-10 w-12 h-12 border-t-2 border-r-2 border-white/10"></div>
                            <div className="absolute bottom-10 left-10 w-12 h-12 border-b-2 border-l-2 border-white/10"></div>
                            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-2 border-r-2 border-white/10"></div>
                        </div>
                    )}
                    <canvas ref={mainCanvasRef} id="webgl-canvas" aria-label="星河协会 3D 徽章展示" role="img"></canvas>
                </div>

                {/* The Content that scrolls over/under the badge */}
                <div className="three-content-overlay">
                    <section 
                        className="three-section cursor-none" 
                        id="sec-hero-three"
                    >
                        <div className="top-text-three" id="text1-three" dangerouslySetInnerHTML={{ __html: t[lang].three_top }}></div>
                        <div className="bottom-text-three" id="text2-three" dangerouslySetInnerHTML={{ __html: t[lang].three_bottom }}></div>
                    </section>

                    {/* Spacer section to allow badge rotation to complete */}
                    <section className="three-section" style={{ height: '150vh', pointerEvents: 'none' }}></section>

                    <section className="huge-text-section" id="sec-huge-three" style={{ height: '150vh' }}>
                        <div className="huge-svg-container">
                            <svg viewBox="35 15 460 210" className="huge-svg">
                                {/* Shadow Layer for 3D effect */}
                                <g stroke="rgba(88, 166, 255, 0.4)" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" transform="translate(5, 5)">
                                    <path className="line" d="M100 100 A 60 60 0 1 1 100 99 M100 100 H 160" />
                                    <path className="line" d="M180 120 A 40 40 0 1 1 180 119 M220 80 V 160" />
                                    <path className="line" d="M240 40 V 160" />
                                    <path className="line" d="M280 120 A 40 40 0 1 1 280 119 M320 80 V 160" />
                                    <path className="line" d="M350 80 L 410 160 M410 80 L 350 160" />
                                    <path className="line" d="M440 80 V 140 A 20 20 0 0 0 480 140 V 80 M480 140 V 180 A 40 40 0 0 1 400 180" />
                                </g>
                                {/* Main Layer */}
                                <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
                                    <path className="line" d="M100 100 A 60 60 0 1 1 100 99 M100 100 H 160" />
                                    <path className="line" d="M180 120 A 40 40 0 1 1 180 119 M220 80 V 160" />
                                    <path className="line" d="M240 40 V 160" />
                                    <path className="line" d="M280 120 A 40 40 0 1 1 280 119 M320 80 V 160" />
                                    <path className="line" d="M350 80 L 410 160 M410 80 L 350 160" />
                                    <path className="line" d="M440 80 V 140 A 20 20 0 0 0 480 140 V 80 M480 140 V 180 A 40 40 0 0 1 400 180" />
                                </g>
                            </svg>
                        </div>
                    </section>

                    <section className="stats-three-section cursor-auto" id="sec-stats-three" style={{ height: '150vh' }}>
                        <div className="stats-left">
                            <h2 style={{ fontSize: '40px', marginBottom: '20px' }}>
                                {t[lang].stats_title}<br/>
                                <span style={{ color: '#888', fontSize: '24px' }}>{t[lang].stats_subtitle}</span>
                            </h2>
                            <img loading="lazy" src="/public/981be86df3b3b8e32f8377f37faed65c_compressed.jpg" alt="Tech" />
                        </div>
                        
                        <div className="stats-right">
                            <div className="stats-grid">
                                <div className="stat-box">
                                    <p>{t[lang].stats_item_1}</p>
                                    <h2 className="animate-num">14</h2>
                                </div>
                                <div className="stat-box white">
                                    <p>{t[lang].stats_item_2}</p>
                                    <h2 className="animate-num">26</h2>
                                </div>
                                <div className="stat-box white">
                                    <p>{t[lang].stats_item_3}</p>
                                    <h2 className="animate-num">8<span style={{ fontSize: '30px' }}>.5</span></h2>
                                </div>
                                <div className="stat-box white">
                                    <p>{t[lang].stats_item_4}</p>
                                    <h2 className="animate-num">18</h2>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. History (Video Inspired Horizontal Scroll) */}
                    <section className="history-horizontal-section cursor-auto" id="history" style={{ height: '800vh' }}>
                        {/* High-end Damping Wheel Background */}
                        <div className="history-wheel-bg">
                            <svg viewBox="0 0 1000 1000" className="history-wheel-svg">
                                <circle cx="500" cy="500" r="450" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                <circle cx="500" cy="500" r="350" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="10 20" />
                                <circle cx="500" cy="500" r="250" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="1" />
                            </svg>
                        </div>

                        {/* Scroll to Explore Icon from Video */}
                        <div className="history-scroll-hint">
                            <div className="scroll-hint-text">scroll to explore</div>
                            <div className="scroll-hint-icon">
                                <div className="scroll-hint-dot"></div>
                            </div>
                        </div>

                        {/* Large Background Text from Video */}
                        <div className="history-bg-text-wrap">
                            <div className="history-bg-text" dangerouslySetInnerHTML={{ __html: t[lang].history_fg }}></div>
                        </div>

                        {/* Red Arrow Path from Video */}
                        <div className="history-red-track">
                            <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="history-red-svg">
                                <path d="M0,150 Q500,50 1000,150" fill="none" stroke="#ff3333" strokeWidth="2" strokeDasharray="10 15" />
                            </svg>
                            <div className="history-red-arrow">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#ff3333" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="history-horizontal-track">
                            <div className="history-items-wrapper">
                                {[
                                    { year: '2023', desc: t[lang].history_1 },
                                    { year: '2024', desc: t[lang].history_2 },
                                    { year: '2024.9', desc: t[lang].history_3 },
                                    { year: '2025.6', desc: t[lang].history_4 },
                                    { year: '2026', desc: t[lang].history_5 }
                                ].map((item, idx) => (
                                    <div key={idx} className={`history-item history-item-${idx} ${idx % 2 === 0 ? 'item-top' : 'item-bottom'}`}>
                                        <div className="history-item-content">
                                            <div className="history-year-huge">{item.year}</div>
                                            <div className="history-desc-box">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </section>


                </div>
            </div>
            {/* --- END 3D SCROLLING MODULE --- */}

            {/* Advisor Section (Editorial Style) */}
            <section className="hall-of-fame" id="advisor">
                <div className="hall-bg-lines">
                    <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                        <path d="M0,100 Q250,50 500,100 T1000,100" fill="none" stroke="white" strokeWidth="0.5" />
                        <path d="M0,200 Q250,150 500,200 T1000,200" fill="none" stroke="white" strokeWidth="0.5" />
                        <path d="M0,300 Q250,250 500,300 T1000,300" fill="none" stroke="white" strokeWidth="0.5" />
                        <path d="M0,400 Q250,350 500,400 T1000,400" fill="none" stroke="white" strokeWidth="0.5" />
                        <path d="M0,500 Q250,450 500,500 T1000,500" fill="none" stroke="white" strokeWidth="0.5" />
                        <path d="M0,600 Q250,550 500,600 T1000,600" fill="none" stroke="white" strokeWidth="0.5" />
                        <path d="M0,700 Q250,650 500,700 T1000,700" fill="none" stroke="white" strokeWidth="0.5" />
                        <path d="M0,800 Q250,750 500,800 T1000,800" fill="none" stroke="white" strokeWidth="0.5" />
                    </svg>
                </div>
                
                <div className="container hall-content relative">
                    <div className="absolute top-0 right-0 pointer-events-none z-10 opacity-20">
                        <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path className="scribble-animate" d="M50 150C100 50 200 250 250 150C300 50 350 250 380 150" stroke="#39FF14" strokeWidth="100" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className="hall-title-huge reveal font-black tracking-tighter leading-[1.1] mb-12 whitespace-nowrap">
                        {t[lang].nav_advisor}<br/>
                        <span className="text-[#39FF14]">ADVISORS</span>
                    </div>
                    
                    <p className="text-blue-400 font-mono tracking-[0.3em] uppercase text-sm mb-12 reveal">
                        {t[lang].title_teachers}
                    </p>

                    <div className="teacher-grid-container">
                        {[
                            'qijiayi',
                            'wanganquan',
                            'lichuangxin',
                            'zhaozhinen',
                            'sunshijian',
                            'zhouyanjiu',
                            'wulilun',
                            'zhengshijian',
                            'qianchuangxin'
                        ].map((id) => (
                            <ProfileCard 
                                key={id}
                                name={memberData[id].name}
                                title={memberData[id].className}
                                handle={id}
                                status="Online"
                                contactText="VIEW PROFILE"
                                avatarUrl={memberData[id].avatar}
                                showUserInfo
                                enableTilt={true}
                                enableMobileTilt={false}
                                variant="dark"
                                onContactClick={() => showMemberModal(id)}
                                behindGlowColor="rgba(37, 99, 235, 0.4)"
                                behindGlowEnabled
                                behindGlowSize="45%"
                                innerGradient="linear-gradient(145deg, rgba(37, 99, 235, 0.15) 0%, rgba(57, 255, 20, 0.1) 100%)"
                                iconUrl="data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z' fill='%2339FF14' fill-opacity='0.1'/%3E%3C/svg%3E"
                                className="reveal"
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* 4.5 Style Transition (Lando Norris Inspired) */}
            <section 
                ref={styleTransitionRef} 
                className="style-transition-section"
            >
                <div className="topo-bg opacity-20"></div>
                <div className="style-transition-container">
                    <div className="style-transition-text style-transition-text-left">TEAM</div>
                    <div className="style-transition-image-wrapper">
                        <div className="absolute -top-12 left-0 w-full text-center text-white/50 font-mono text-xs tracking-widest uppercase">
                            Xinghe Sci-Tech Innovation Association
                        </div>
                        <img 
                            src="https://s41.ax1x.com/2026/03/31/peGSu0x.jpg" 
                            alt="Team Style Transition" 
                            className="style-transition-image"
                        />
                        <div className="style-transition-scribble-wrapper">
                            <svg 
                                ref={styleTransitionScribbleRef}
                                viewBox="0 0 5708 2100" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="w-full h-auto"
                            >
                                <path
                                    id="style-signature"
                                    className="style-transition-scribble-path"
                                    stroke="#39FF14" 
                                    strokeWidth="100"
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    style={{ filter: 'drop-shadow(0 0 10px rgba(225, 255, 0, 0.4))' }}
                                    d="M0.060791 734.599C1929.23 498.432 5771.36 50.799 5706.56 149.599C5625.56 273.099 4670.06 559.099 3619.06 630.099C2568.06 701.099 1897.56 844.099 1460.06 706.099C1003.56 525.099 1051.06 710.099 984.561 320.599C918.061 -68.9009 1729.59 -8.52636 1897.56 26.0992C2011.56 49.5991 2159.06 149.599 2021.06 425.599C1874.69 718.341 1241.06 1176.6 1312.56 1248.1C1388.56 1270.9 1677.91 1205.1 1793.06 872.599C1849.11 710.765 1835.56 1048.1 1621.56 1276.6C1621.56 1337.4 1637.56 1377.93 1645.56 1390.6C1664.76 1276.2 1850.23 1266.93 1940.56 1276.6L1793.06 1771.1C1946.89 1324.1 2257.36 445.299 2268.56 506.099C2282.56 582.099 2420.56 720.599 2392.06 872.599C2363.56 1024.6 2486.56 406.099 2824.56 320.599C3162.56 235.099 3352.56 154.599 3362.06 278.099C3371.56 401.599 3390.06 649.099 3076.56 810.599C2763.06 972.099 2658.56 976.599 2644.06 924.599C2629.56 872.599 2972.56 520.599 3024.56 539.599C3157.56 458.599 3402.86 368.599 3457.06 368.599C3547.56 368.599 3609.56 292.599 3666.56 368.599C3704.56 398.432 3774.86 482.899 3752.06 582.099C3723.56 706.099 3681.06 957.599 3619.06 1038.6C3569.46 1103.4 3024.39 1772.6 2758.06 2099.1" 
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="style-transition-text style-transition-text-right">STYLE</div>
                    
                    {/* Next Page Indicator */}
                    <div className="absolute bottom-12 left-12 flex flex-col items-start gap-2 opacity-40">
                        <div className="text-[10px] font-mono tracking-widest uppercase text-white/50">Next Section</div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-[1px] bg-white/30"></div>
                            <div className="text-sm font-black tracking-tighter text-white uppercase italic">{t[lang].nav_style}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Style */}
            <section id="style" className="relative overflow-hidden">
                <div className="topo-bg opacity-20"></div>
                <div className="style-bg-text">TEAM STYLE</div>
                <div className="container relative z-10 reveal">
                    <div className="section-header">
                        <h2>{t[lang].nav_style}</h2>
                        <div className="line"></div>
                        <p className="text-gray-500 mt-4 max-w-2xl mx-auto">记录团队成长的每一个瞬间，从技术研讨到荣誉时刻，我们并肩作战，共同成长。</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-20 py-20">
                        <div className="bento-item w-[400px] aspect-video relative group reveal" style={{ transform: 'rotate(-2deg)' }}>
                            <span className="lando-label">TECHNICAL SEMINAR, 2024</span>
                            <div className="lando-img-container h-full">
                                <img loading="lazy" src="https://s41.ax1x.com/2026/03/14/peEwRzV.jpg" alt="技术研讨会" />
                            </div>
                            <div className="mt-4">
                                <div className="text-base font-black tracking-tight">技术研讨会</div>
                                <div className="text-[10px] opacity-50">深入探讨碱性电池技术细节，碰撞思维火花。</div>
                            </div>
                        </div>
                        
                        <div className="bento-item w-[500px] aspect-video relative group reveal mt-20" style={{ transform: 'rotate(3deg)' }}>
                            <span className="lando-label">PROJECT DEFENSE, 2024</span>
                            <div className="lando-img-container h-full">
                                <img loading="lazy" src="/public/67edb5010ee8485a1e8ea860b5951aa2_compressed.jpg" alt="项目答辩现场" />
                            </div>
                            <div className="mt-4">
                                <div className="text-base font-black tracking-tight">项目答辩现场</div>
                                <div className="text-[10px] opacity-50">自信展示研究成果，接受专家评审。</div>
                            </div>
                        </div>

                        <div className="bento-item w-[350px] aspect-square relative group reveal -mt-10" style={{ transform: 'rotate(-1deg)' }}>
                            <span className="lando-label">TEAM BUILDING, 2024</span>
                            <div className="lando-img-container h-full">
                                <img loading="lazy" src="/public/981be86df3b3b8e32f8377f37faed65c_compressed.jpg" alt="团建活动" />
                            </div>
                            <div className="mt-4">
                                <div className="text-base font-black tracking-tight">团建活动</div>
                                <div className="text-[10px] opacity-50">释放压力，增强团队凝聚力。</div>
                            </div>
                        </div>

                        <div className="bento-item w-[600px] aspect-video relative group reveal mt-10" style={{ transform: 'rotate(1.5deg)' }}>
                            <span className="lando-label">HONORARY PHOTO, 2024</span>
                            <div className="lando-img-container h-full">
                                <img loading="lazy" src="https://s41.ax1x.com/2026/03/14/peEw8VH.jpg" alt="荣誉合影" />
                            </div>
                            <div className="mt-4">
                                <div className="text-base font-black tracking-tight">荣誉合影</div>
                                <div className="text-[10px] opacity-50">汗水换来硕果，记录光荣时刻。</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Experience */}
            <section id="experience" ref={experienceRef} className="relative overflow-hidden pb-20">
                <div className="topo-bg opacity-20"></div>
                <div className="container relative z-10 reveal">
                    <div className="section-header mb-20">
                        <h2 className="text-3xl font-black tracking-tighter text-white">{t[lang].experience_title}</h2>
                        <div className="line w-20 h-1.5 bg-[#39FF14] mt-4"></div>
                    </div>

                    <div className="experience-timeline relative">
                        {/* Vertical Line */}
                        <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-600/50 via-blue-200 to-transparent transform -translate-x-1/2 hidden md:block"></div>

                        <div className="space-y-24">
                            {/* Item 1 */}
                            <div className="experience-item relative flex flex-col md:flex-row items-center gap-12">
                                <div className="experience-date md:w-1/2 md:text-right">
                                    <span className="text-7xl font-black text-gray-100 absolute -top-10 -left-4 md:static md:block md:opacity-100">2025</span>
                                    <div className="text-blue-600 font-bold text-lg mt-2">NO.01 / SPRING</div>
                                </div>
                                <div className="experience-dot absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg z-10 hidden md:block"></div>
                                <div className="experience-card md:w-1/2 bg-black/20 backdrop-blur-md p-10 rounded-3xl shadow-xl border border-white/10 hover:border-[#39FF14] transition-all group">
                                    <div className="flex items-start gap-6">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#39FF14] group-hover:bg-[#39FF14] group-hover:text-black transition-colors duration-500">
                                            <Trophy size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-[#39FF14]/20 text-[#39FF14] text-xs font-bold rounded-full">学业规划</span>
                                                <span className="text-white/40 text-sm">分享人：路鹏</span>
                                            </div>
                                            <h4 className="text-xl font-bold mb-3 text-white">《大学规划经验分享会》</h4>
                                            <p className="text-white/60 text-sm leading-relaxed">核心内容：从专业课学习再到夏令营的参加选择，面试心得以及心态的调整。帮助大一、大二同学明确奋斗目标。</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Item 2 */}
                            <div className="experience-item relative flex flex-col md:flex-row-reverse items-center gap-12">
                                <div className="experience-date md:w-1/2 text-left">
                                    <span className="text-7xl font-black text-gray-100 absolute -top-10 -left-4 md:static md:block md:opacity-100">2025</span>
                                    <div className="text-blue-600 font-bold text-lg mt-2">NO.02 / SUMMER</div>
                                </div>
                                <div className="experience-dot absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg z-10 hidden md:block"></div>
                                <div className="experience-card md:w-1/2 bg-black/20 backdrop-blur-md p-10 rounded-3xl shadow-xl border border-white/10 hover:border-[#39FF14] transition-all group">
                                    <div className="flex items-start gap-6">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#39FF14] group-hover:bg-[#39FF14] group-hover:text-black transition-colors duration-500">
                                            <Laptop size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">技能提升</span>
                                                <span className="text-white/40 text-sm">分享人：徐榕浩</span>
                                            </div>
                                            <h4 className="text-xl font-bold mb-3 text-white">《数学建模与Matlab应用》</h4>
                                            <p className="text-white/60 text-sm leading-relaxed">核心内容：结合案例讲解如何养成竞赛心态以及各种专业软件介绍。手把手教你如何从零开始构建数学模型。</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Item 3 */}
                            <div className="experience-item relative flex flex-col md:flex-row items-center gap-12">
                                <div className="experience-date md:w-1/2 md:text-right">
                                    <span className="text-7xl font-black text-gray-100 absolute -top-10 -left-4 md:static md:block md:opacity-100">2024</span>
                                    <div className="text-blue-600 font-bold text-lg mt-2">NO.03 / WINTER</div>
                                </div>
                                <div className="experience-dot absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg z-10 hidden md:block"></div>
                                <div className="experience-card md:w-1/2 bg-black/20 backdrop-blur-md p-10 rounded-3xl shadow-xl border border-white/10 hover:border-[#39FF14] transition-all group">
                                    <div className="flex items-start gap-6">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#39FF14] group-hover:bg-[#39FF14] group-hover:text-black transition-colors duration-500">
                                            <MessageCircle size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">团队建设</span>
                                                <span className="text-white/40 text-sm">分享人：贺诗雨</span>
                                            </div>
                                            <h4 className="text-xl font-bold mb-3 text-white">《高效团队协作与沟通》</h4>
                                            <p className="text-white/60 text-sm leading-relaxed">核心内容：如何利用飞书等工具进行跨部门协作，以及在压力环境下保持高效沟通的艺术。</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Hall of Fame (1:1 Lando Norris Inspired) */}
            <section 
                id="achievements" 
                ref={hallOfFameRef} 
                className="hall-of-fame-lando relative min-h-screen w-full"
            >
                <div className="topo-bg opacity-10"></div>
                
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-40">
                    <div className="w-[60vw] max-w-[1000px] h-auto">
                        <svg 
                            ref={scribbleRef} 
                            viewBox="0 0 5708 2100" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="w-full h-auto"
                        >
                                <path
                                    id="xinghe-signature"
                                    className="scribble-animate"
                                    stroke="#39FF14" 
                                    strokeWidth="80"
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    style={{ filter: 'drop-shadow(0 0 15px rgba(57, 255, 20, 0.3))' }}
                                    d="M0.060791 734.599C1929.23 498.432 5771.36 50.799 5706.56 149.599C5625.56 273.099 4670.06 559.099 3619.06 630.099C2568.06 701.099 1897.56 844.099 1460.06 706.099C1003.56 525.099 1051.06 710.099 984.561 320.599C918.061 -68.9009 1729.59 -8.52636 1897.56 26.0992C2011.56 49.5991 2159.06 149.599 2021.06 425.599C1874.69 718.341 1241.06 1176.6 1312.56 1248.1C1388.56 1270.9 1677.91 1205.1 1793.06 872.599C1849.11 710.765 1835.56 1048.1 1621.56 1276.6C1621.56 1337.4 1637.56 1377.93 1645.56 1390.6C1664.76 1276.2 1850.23 1266.93 1940.56 1276.6L1793.06 1771.1C1946.89 1324.1 2257.36 445.299 2268.56 506.099C2282.56 582.099 2420.56 720.599 2392.06 872.599C2363.56 1024.6 2486.56 406.099 2824.56 320.599C3162.56 235.099 3352.56 154.599 3362.06 278.099C3371.56 401.599 3390.06 649.099 3076.56 810.599C2763.06 972.099 2658.56 976.599 2644.06 924.599C2629.56 872.599 2972.56 520.599 3024.56 539.599C3157.56 458.599 3402.86 368.599 3457.06 368.599C3547.56 368.599 3609.56 292.599 3666.56 368.599C3704.56 398.432 3774.86 482.899 3752.06 582.099C3723.56 706.099 3681.06 957.599 3619.06 1038.6C3569.46 1103.4 3024.39 1772.6 2758.06 2099.1" 
                                />
                        </svg>
                    </div>
                </div>
                
                {/* Bottom Marquee Overlay */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden border-t border-black/5 py-6 z-20 pointer-events-none">
                    <div className="editorial-marquee-content flex whitespace-nowrap">
                        <span className="editorial-marquee-text text-black/20">STARRY RIVER INNOVATION</span>
                        <span className="editorial-marquee-text text-black/20">STARRY RIVER INNOVATION</span>
                        <span className="editorial-marquee-text text-black/20">STARRY RIVER INNOVATION</span>
                        <span className="editorial-marquee-text text-black/20">STARRY RIVER INNOVATION</span>
                        <span className="editorial-marquee-text text-black/20">STARRY RIVER INNOVATION</span>
                        <span className="editorial-marquee-text text-black/20">STARRY RIVER INNOVATION</span>
                    </div>
                </div>
                
                {/* Watermark Header */}
                <div className="lando-header">
                    <div className="lando-logo">
                        XINGHE<br/>AWARDS
                    </div>
                </div>

                <div ref={horizontalScrollRef} className="horizontal-scroll-wrapper">
                    
                    {/* Block 1: Big Text */}
                    <div className="flex-shrink-0 mr-10 parallax-layer" data-speed="0.1">
                        <h2 className="lando-big-text" dangerouslySetInnerHTML={{ __html: t[lang].style_big_text }}></h2>
                    </div>

                    {/* Block 2: Image 1 (Qatar) */}
                    <div className="lando-item lando-item-up parallax-layer" data-speed="0.3">
                        <span className="lando-label">NATIONAL AWARD, 2024</span>
                        <div className="lando-img-container w-[600px] aspect-video">
                            <img src="https://s41.ax1x.com/2026/03/12/peAptG4.jpg" alt="Award 1" referrerPolicy="no-referrer" />
                        </div>
                    </div>

                    {/* Block 3: Quote 1 */}
                    <div className="lando-quote-block lando-item-down parallax-layer" data-speed="0.05">
                        <p className="lando-quote-text">
                            {t[lang].style_quote}
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-[1px] bg-[#39FF14]"></div>
                            <span className="lando-sig">Xinghe Team</span>
                        </div>
                    </div>

                    {/* Block 4: Image 2 (Miami) */}
                    <div className="lando-item lando-item-center parallax-layer" data-speed="-0.15">
                        <span className="lando-label">PROVINCIAL FIRST PRIZE, 2024</span>
                        <div className="lando-img-container w-[720px] aspect-video">
                            <img src="https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=1200" alt="Award 2" referrerPolicy="no-referrer" />
                        </div>
                    </div>

                    {/* Block 5: Image 3 (Monaco) */}
                    <div className="lando-item lando-item-up parallax-layer" data-speed="0.5">
                        <span className="lando-label">INNOVATION EXCELLENCE, 2024</span>
                        <div className="lando-img-container w-[500px] aspect-[16/9]">
                            <img src="https://s41.ax1x.com/2026/03/12/peApuxs.jpg" alt="Award 3" referrerPolicy="no-referrer" />
                        </div>
                    </div>

                    {/* Block 6: Image 4 (Britain) */}
                    <div className="lando-item lando-item-down parallax-layer" data-speed="0.2">
                        <span className="lando-label">OUTSTANDING TEAM, 2025</span>
                        <div className="lando-img-container w-[650px] aspect-video">
                            <img src="https://s41.ax1x.com/2026/03/12/peApMMn.jpg" alt="Award 4" referrerPolicy="no-referrer" />
                        </div>
                    </div>

                    {/* Block 7: Innovation Typography */}
                    <div className="flex-shrink-0 ml-40 mr-20 flex flex-col justify-center parallax-layer" data-speed="0.15">
                        <div className="relative group">
                            <h2 className="text-[15vw] font-black leading-[0.8] tracking-tighter opacity-[0.03] absolute -top-32 -left-20 select-none text-black group-hover:opacity-[0.05] transition-opacity duration-1000">
                                INNOVATION
                            </h2>
                            <div className="flex flex-col gap-2 relative z-10">
                                <div className="flex items-baseline gap-6">
                                    <span className="text-[8vw] font-black leading-none italic text-blue-600 drop-shadow-sm">IN</span>
                                    <span className="text-[8vw] font-black leading-none text-black tracking-tighter">LAB</span>
                                </div>
                                <div className="flex items-center gap-4 ml-12">
                                    <div className="h-[2px] w-24 bg-blue-600/20"></div>
                                    <span className="text-xs font-bold tracking-[0.3em] text-blue-600/40 uppercase">Research & Development</span>
                                </div>
                                <div className="flex items-baseline gap-6 ml-24">
                                    <span className="text-[8vw] font-black leading-none italic text-blue-600 drop-shadow-sm">OUT</span>
                                    <span className="text-[8vw] font-black leading-none text-black tracking-tighter">LAB</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Block 8: Honors & Certificates Hall of Fame Grid (2 Rows) */}
                    <div className="flex-shrink-0 ml-40 mr-40 flex flex-col justify-center">
                        <div className="mb-16 flex justify-between items-end border-b border-black/5 pb-8">
                            <div>
                                <h3 className="text-[11px] font-black tracking-[0.4em] uppercase opacity-30 mb-3 text-black">XINGHE ARCHIVE / VOL. 01</h3>
                                <h2 className="text-6xl font-black tracking-tighter text-black leading-none">HONORS & <span className="text-blue-600">AWARDS</span></h2>
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Collection No.</p>
                                <p className="text-2xl font-mono font-bold text-black/80">#2023-2026</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-rows-2 grid-flow-col gap-8 h-[650px] relative">
                            {/* Museum Marquee Background */}
                            <div className="absolute inset-0 flex flex-col justify-around pointer-events-none opacity-[0.02] select-none overflow-hidden">
                                <div className="text-[20vw] font-black whitespace-nowrap animate-marquee-slow">XINGHE ARCHIVE XINGHE ARCHIVE XINGHE ARCHIVE</div>
                                <div className="text-[20vw] font-black whitespace-nowrap animate-marquee-slow-reverse self-end">HONOR & GLORY HONOR & GLORY HONOR & GLORY</div>
                            </div>
                            
                            {[
                                { id: 1, name: "国家级奖项", img: "https://s41.ax1x.com/2026/03/12/peAptG4.jpg", year: "2024", category: "National", project: "矿山智能巡检机器人", desc: "该项目在挑战杯全国大学生课外学术科技作品竞赛中荣获国家级奖项。", tech: ["AI视觉", "自主导航", "5G通信"] },
                                { id: 2, name: "省级一等奖", img: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=600", year: "2024", category: "Provincial", project: "智慧安全云平台", desc: "基于大数据与云计算的安全监测平台，获得辽宁省科创竞赛一等奖。", tech: ["大数据", "云计算", "实时监测"] },
                                { id: 3, name: "创新杯金奖", img: "https://s41.ax1x.com/2026/03/12/peApuxs.jpg", year: "2024", category: "Excellence", project: "多功能安全传感器", desc: "自主研发的新型传感器，解决了极端环境下的数据采集难题。", tech: ["硬件开发", "传感器技术", "低功耗设计"] },
                                { id: 4, name: "优秀团队奖", img: "https://s41.ax1x.com/2026/03/12/peApMMn.jpg", year: "2025", category: "Team", project: "星河科创团队", desc: "协会团队因在年度科技创新活动中的卓越表现，被评为校级优秀团队。", tech: ["团队协作", "项目管理", "创新思维"] },
                                { id: 5, name: "技术突破奖", img: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600", year: "2024", category: "Tech", project: "动力环技术优化", desc: "在动力环核心算法上取得重大突破，大幅提升了系统响应速度。", tech: ["算法优化", "控制理论", "仿真模拟"] },
                                { id: 6, name: "专利授权证书", img: "https://s41.ax1x.com/2026/03/12/peAptG4.jpg", year: "2025", category: "Patent", project: "一种智能预警装置", desc: "该发明专利已获得国家知识产权局正式授权，具有极高的实用价值。", tech: ["专利申请", "机械设计", "电子电路"] },
                                { id: 7, name: "社会实践奖", img: "https://s41.ax1x.com/2026/03/12/peApuxs.jpg", year: "2024", category: "Social", project: "安全科普进社区", desc: "团队深入社区开展安全知识普及活动，获得社会各界一致好评。", tech: ["社会实践", "公益科普", "沟通表达"] },
                                { id: 8, name: "学术论文奖", img: "https://s41.ax1x.com/2026/03/12/peApMMn.jpg", year: "2025", category: "Academic", project: "安全工程前沿研究", desc: "团队成员在核心期刊发表高水平学术论文，展现了深厚的科研功底。", tech: ["学术研究", "论文写作", "数据分析"] }
                            ].map((award, idx) => (
                                <div 
                                    key={award.id} 
                                    className="w-[450px] bg-white rounded-[32px] p-8 border border-black/5 hover:border-blue-600/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 group cursor-pointer relative overflow-hidden"
                                    onClick={() => setSelectedAward(award)}
                                >
                                    <div className="absolute top-8 right-8 text-[40px] font-black text-black/5 group-hover:text-blue-600/10 transition-colors">
                                        0{idx + 1}
                                    </div>
                                    <div className="aspect-video mb-6 overflow-hidden rounded-2xl bg-black/5">
                                        <img src={award.img} alt={award.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-blue-600/10 text-blue-600 text-[9px] font-bold rounded uppercase tracking-wider">{award.category}</span>
                                                <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">{award.year}</span>
                                            </div>
                                            <h4 className="text-xl font-black tracking-tight text-black group-hover:text-blue-600 transition-colors">{award.name}</h4>
                                        </div>
                                        <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-500 text-black">
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-12 flex items-center gap-8">
                            <p className="text-sm opacity-60 max-w-md text-black">
                                每一份荣誉都是团队汗水的结晶，记录着我们在科技创新道路上的每一个坚实足迹。
                            </p>
                            <button className="px-10 py-5 bg-black text-white font-black text-[11px] tracking-[0.2em] uppercase rounded-full hover:bg-blue-600 hover:scale-105 transition-all duration-300 shadow-xl shadow-black/10">
                                {lang === 'zh' ? '查看更多成果' : 'VIEW ALL ARCHIVES'}
                            </button>
                        </div>
                    </div>

                    {/* Block 9: Final Big Text */}
                    <div className="flex-shrink-0 ml-40 mr-60 lando-item-center parallax-layer flex flex-col items-center" data-speed="0.1">
                        <h2 className="lando-big-text text-black text-center" dangerouslySetInnerHTML={{ __html: t[lang].style_final_text }}></h2>
                        <div className="mt-12 flex flex-col items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-[1px] bg-blue-600"></div>
                                <span className="lando-sig text-blue-600">Xinghe Team</span>
                            </div>
                            <div className="mt-20 animate-bounce flex flex-col items-center gap-2 opacity-30">
                                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-black">Keep Scrolling</span>
                                <ArrowUp className="rotate-180" size={20} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* UI Elements - Progress Bar */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 text-black font-mono text-xs font-bold tracking-widest">
                        <span className="opacity-30">01</span>
                        <div className="w-40 h-[2px] bg-black/5 relative overflow-hidden">
                            <div 
                                className="lando-progress-fill absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                                style={{ width: '0%' }}
                            ></div>
                        </div>
                        <span className="opacity-30">08</span>
                    </div>
                    <div className="lando-counter hidden"><span>1</span></div>
                </div>
            </section>


                {/* Award Detail Modal (Idea 4) */}
                {selectedAward && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedAward(null)}>
                        <div className="award-detail-panel" onClick={e => e.stopPropagation()}>
                            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors" onClick={() => setSelectedAward(null)}>
                                <X size={32} />
                            </button>
                            
                            <div className="flex flex-col lg:flex-row h-full gap-10 overflow-y-auto lg:overflow-hidden p-6 lg:p-12">
                                {/* Left: Award Image */}
                                <div className="lg:w-1/2 flex flex-col justify-center">
                                    <div className="relative group">
                                <img src={selectedAward.img} className="w-full rounded-2xl shadow-2xl border border-white/10" alt={selectedAward.name} />
                                        <div className="absolute -bottom-6 -right-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-xl">
                                            CERTIFIED
                                        </div>
                                    </div>
                                    <div className="mt-12 grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                            <p className="text-blue-400 text-xs uppercase tracking-wider mb-1">获奖时间</p>
                                            <p className="font-bold">{selectedAward.year}年</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                            <p className="text-blue-400 text-xs uppercase tracking-wider mb-1">奖项类别</p>
                                            <p className="font-bold">{selectedAward.category}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Project Details */}
                                <div className="lg:w-1/2 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-3xl font-bold">{selectedAward.name}</h3>
                                        <button 
                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium"
                                            onClick={(e) => handleShareAward(e, selectedAward)}
                                        >
                                            <Share2 size={16} /> 分享
                                        </button>
                                    </div>
                                    <p className="text-blue-500 font-medium mb-8">项目名称：{selectedAward.project}</p>
                                    
                                    <div className="space-y-8">
                                        <div>
                                            <h5 className="text-sm uppercase tracking-widest text-white/40 mb-3">项目简介</h5>
                                            <p className="text-lg text-white/80 leading-relaxed">{selectedAward.desc}</p>
                                        </div>

                                        <div>
                                            <h5 className="text-sm uppercase tracking-widest text-white/40 mb-3">核心技术</h5>
                                            <div className="flex flex-wrap gap-3">
                                                {selectedAward.tech && selectedAward.tech.map((t: string, i: number) => (
                                                    <span key={i} className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/10">
                                            <p className="text-white/40 text-sm italic">“ 创新是引领发展的第一动力，星河人永远在路上。”</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            
            {/* Spacer to account for pinned Achievements section when pinSpacing is false */}

            <div className="subsequent-content-wrapper relative bg-black">
                {/* 7.5 News & Events */}
                <section id="news" className="relative overflow-hidden min-h-screen text-white">
                    <div className="topo-bg opacity-20"></div>
                    <div className="container relative z-10">
                    <div className="section-header">
                        <h2 className="text-white">动态资讯</h2>
                        <div className="line"></div>
                        <p className="text-white/50 mt-4">实时掌握协会最新动态，不错过任何精彩瞬间。</p>
                    </div>
                    
                    <div className="flex flex-col gap-32 py-20">
                        <div className="news-card flex flex-col md:flex-row items-center gap-12 reveal" style={{ transform: 'rotate(1deg)' }}>
                            <div className="md:w-1/2">
                                <span className="lando-label">LATEST NEWS / 2026.03.15</span>
                                <div className="lando-img-container aspect-video">
                                    <img loading="lazy" src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800" alt="招新活动现场" />
                                </div>
                            </div>
                            <div className="md:w-1/2">
                                <h4 className="text-4xl font-black tracking-tighter mb-4">星河科技创新协会2026春季招新正式启动</h4>
                                <p className="text-white/60 leading-relaxed mb-6">新学期，新起点！星河科创协会面向全校招募热爱科技、勇于创新的你。加入我们，共同探索安全科技的星辰大海。</p>
                                <a href="https://mp.weixin.qq.com/s/hyQJXvFv8imqWwcZDaGPHw" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#39FF14] font-bold uppercase tracking-widest text-xs">阅读更多 <ChevronRight size={16} /></a>
                            </div>
                        </div>

                        <div className="news-card flex flex-col md:flex-row-reverse items-center gap-12 reveal" style={{ transform: 'rotate(-1.5deg)' }}>
                            <div className="md:w-1/2">
                                <span className="lando-label">ACHIEVEMENT / 2026.03.10</span>
                                <div className="lando-img-container aspect-video">
                                    <img loading="lazy" src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800" alt="挑战杯获奖合影" />
                                </div>
                            </div>
                            <div className="md:w-1/2 text-right">
                                <h4 className="text-4xl font-black tracking-tighter mb-4">我院学生在“挑战杯”省级选拔赛中斩获佳绩</h4>
                                <p className="text-white/60 leading-relaxed mb-6">由星河协会成员组成的参赛团队凭借“智能矿山预警系统”在省级选拔赛中脱颖而出，成功晋级国赛。</p>
                                <a href="https://mp.weixin.qq.com/s/YOUR_ARTICLE_ID_2" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 justify-end text-[#39FF14] font-bold uppercase tracking-widest text-xs">阅读更多 <ChevronRight size={16} /></a>
                            </div>
                        </div>

                        <div className="news-card flex flex-col md:flex-row items-center gap-12 reveal" style={{ transform: 'rotate(0.5deg)' }}>
                            <div className="md:w-1/2">
                                <span className="lando-label">TECH SALON / 2026.03.05</span>
                                <div className="lando-img-container aspect-video">
                                    <img loading="lazy" src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800" alt="AI+安全技术沙龙" />
                                </div>
                            </div>
                            <div className="md:w-1/2">
                                <h4 className="text-4xl font-black tracking-tighter mb-4">协会成功举办“AI+安全”专题技术沙龙</h4>
                                <p className="text-white/60 leading-relaxed mb-6">本次沙龙邀请了多位行业专家，共同探讨人工智能技术在现代安全生产中的深度应用与未来趋势。</p>
                                <a href="https://mp.weixin.qq.com/s/YOUR_ARTICLE_ID_3" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#39FF14] font-bold uppercase tracking-widest text-xs">阅读更多 <ChevronRight size={16} /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. Members */}
            <section id="members" className="page-section">
                <div className="container reveal">
                    <div className="section-header"><h2 className="text-white">{t[lang].nav_members}</h2><div className="line"></div></div>
                    
                    <div className="member-search-container mb-12 max-w-md mx-auto relative">
                        <input 
                            type="text"
                            placeholder={lang === 'zh' ? "搜索成员..." : "Search members..."}
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                            className="w-full px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                        />
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>

                    <div className="space-y-20">
                        {/* Core Members */}
                        <div>
                            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                                <span className="w-8 h-1 bg-[#39FF14]"></span>
                                {t[lang].members_core}
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {Object.values(memberData)
                                    .filter(m => !['qijiayi', 'wanganquan', 'lichuangxin', 'zhaozhinen', 'sunshijian', 'zhouyanjiu', 'wulilun', 'zhengshijian', 'qianchuangxin', 'wangzhinen'].includes(m.id))
                                    .filter(m => m.category !== 'service')
                                    .filter(m => m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) || m.className.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                                    .map((member) => (
                                        <ProfileCard 
                                            key={member.id}
                                            name={member.name}
                                            title={member.className}
                                            handle={member.id}
                                            avatarUrl={member.avatar}
                                            variant="light"
                                            onContactClick={() => showMemberModal(member.id)}
                                            className="reveal"
                                        />
                                    ))}
                            </div>
                        </div>

                        {/* Service Personnel */}
                        <div>
                            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                                <span className="w-8 h-1 bg-[#39FF14]"></span>
                                {t[lang].members_service}
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {Object.values(memberData)
                                    .filter(m => m.category === 'service')
                                    .filter(m => m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) || m.className.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                                    .map((member) => (
                                        <ProfileCard 
                                            key={member.id}
                                            name={member.name}
                                            title={member.className}
                                            handle={member.id}
                                            avatarUrl={member.avatar}
                                            variant="light"
                                            onContactClick={() => showMemberModal(member.id)}
                                            className="reveal"
                                        />
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. Join Us */}
            <section id="join" className="page-section overflow-hidden relative">
                <div className="topo-bg opacity-20"></div>
                <div className="container mx-auto reveal flex flex-col items-center text-center relative z-10">
                    <GlitchText
                        speed={1}
                        enableShadows
                        enableOnHover={false}
                        className="text-4xl md:text-5xl font-black mb-8 tracking-tight"
                    >
                        准备好开启你的科技之旅了吗？
                    </GlitchText>
                    <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed opacity-80">
                        无论你是编程大神，还是对科技充满好奇的新手，星河协会都欢迎你的加入。在这里，你将获得最前沿的技术指导和最志同道合的伙伴。
                    </p>
                    <button 
                        onClick={() => setShowJoinModal(true)}
                        className="px-12 py-5 bg-white border-2 border-black text-black font-black rounded-2xl text-xl shadow-xl hover:bg-black/5 hover:scale-105 active:scale-95 transition-all"
                    >
                        <ShinyText
                            text="立即申请加入"
                            speed={3}
                            color="#000000"
                            shineColor="#888888"
                            direction="right"
                        />
                    </button>
                </div>
            </section>

            {/* 10. Contact */}
            <section id="contact" className="page-section bg-gray">
                <div className="container reveal">
                    <div className="section-header"><h2>{t[lang].nav_contact}</h2><div className="line"></div></div>
                    
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Contact Info */}
                        <div className="space-y-10">
                            <p className="text-xl text-gray-600 leading-relaxed">
                                对我们的项目感兴趣？或者想与我们开展技术合作？欢迎通过以下方式联系我们，我们将竭诚为您服务。
                            </p>
                            
                            <div className="space-y-6">
                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-1">联系电话</h4>
                                        <p className="text-xl font-black tracking-tight">158 6535 5237</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-1">电子邮箱</h4>
                                        <p className="text-xl font-black tracking-tight">aqxytwxsh@163.com</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-1">办公地址</h4>
                                        <p className="text-xl font-black tracking-tight">静远楼 405 室</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white p-12 md:p-16 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100">
                            {!contactSubmitted ? (
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setIsContactSubmitting(true);
                                    
                                    try {
                                        const formData = new FormData(e.currentTarget);
                                        const data = {
                                            name: String(formData.get('name') || ''),
                                            email: String(formData.get('email') || ''),
                                            subject: String(formData.get('subject') || ''),
                                            content: String(formData.get('content') || ''),
                                        };
                                        
                                        await addDocument('messages', data);
                                        
                                        const controller = new AbortController();
                                        const timeoutId = setTimeout(() => controller.abort(), 15000);
                                        
                                        try {
                                            await fetch('/api/notify', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ type: 'message', data }),
                                                signal: controller.signal
                                            });
                                            clearTimeout(timeoutId);
                                        } catch (fetchError) {
                                            clearTimeout(timeoutId);
                                        }
                                        
                                        setContactSubmitted(true);
                                    } catch (error: any) {
                                        alert(`发送失败: ${error.message || '未知错误'}`);
                                    } finally {
                                        setIsContactSubmitting(false);
                                    }
                                }} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 block tracking-wider uppercase text-center">您的姓名</label>
                                            <input required name="name" type="text" className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-lg text-center" placeholder="王小明" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 block tracking-wider uppercase text-center">电子邮箱</label>
                                            <input required name="email" type="email" className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-lg text-center" placeholder="example@mail.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 block tracking-wider uppercase text-center">主题</label>
                                        <input required name="subject" type="text" className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-lg text-center" placeholder="关于技术合作..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 block tracking-wider uppercase text-center">留言内容</label>
                                        <textarea required name="content" className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none h-32 resize-none text-lg text-center" placeholder="请写下您的需求或建议..."></textarea>
                                    </div>
                                    <button 
                                        disabled={isContactSubmitting}
                                        className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-4 text-lg"
                                    >
                                        {isContactSubmitting ? (
                                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>发送消息 <MessageCircle size={24} /></>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <MessageCircle size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">感谢您的留言！</h3>
                                    <p className="text-gray-500 mb-8">我们已收到您的消息，会尽快给您回复。</p>
                                    <button 
                                        className="text-blue-600 font-bold hover:underline"
                                        onClick={() => setContactSubmitted(false)}
                                    >
                                        再次发送消息
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="footer">
                <div className="footer-container">
                    {/* Follow Us Section */}
                    <div className="footer-follow">
                        <h3>{t[lang].footer_follow}</h3>
                        <div className="social-icons">
                            {/* WeChat */}
                            <div className="social-icon-wrapper">
                                <a href="#"><i className="fab fa-weixin"></i></a>
                                <div className="qrcode-popup">
                                    <img src="/wechat-qr.png" alt="WeChat" referrerPolicy="no-referrer" />
                                    <p>{t[lang].footer_wechat}</p>
                                </div>
                            </div>
                            {/* QQ */}
                            <div className="social-icon-wrapper">
                                <a href="#"><i className="fab fa-qq"></i></a>
                                <div className="qrcode-popup">
                                    <img src="https://s41.ax1x.com/2026/03/12/peAi2AP.png" alt="QQ" referrerPolicy="no-referrer" />
                                    <p>{t[lang].footer_qq}</p>
                                </div>
                            </div>
                            {/* TikTok */}
                            <div className="social-icon-wrapper">
                                <a href="#"><i className="fab fa-tiktok"></i></a>
                                <div className="qrcode-popup">
                                    <img src="https://picsum.photos/120/120?douyin" alt="TikTok" referrerPolicy="no-referrer" />
                                    <p>{t[lang].footer_douyin}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nav Section */}
                    <div className="footer-nav">
                        <div className="footer-nav-columns">
                            {/* About Us */}
                            <div className="footer-nav-column">
                                <h4>{t[lang].footer_about}</h4>
                                <ul>
                                    <li><a href="#intro">{t[lang].nav_intro}</a></li>
                                    <li><a href="#history">{t[lang].nav_history}</a></li>
                                    <li><a href="#">{t[lang].footer_structure}</a></li>
                                </ul>
                            </div>
                            {/* Achievements */}
                            <div className="footer-nav-column">
                                <h4>{t[lang].nav_achieve}</h4>
                                <ul>
                                    <li><a href="#">{t[lang].footer_awards}</a></li>
                                    <li><a href="#">{t[lang].footer_projects}</a></li>
                                    <li><a href="#">{t[lang].footer_patents}</a></li>
                                </ul>
                            </div>
                            {/* Recruitment */}
                            <div className="footer-nav-column">
                                <h4>{t[lang].footer_recruit}</h4>
                                <ul>
                                    <li><a href="#">{t[lang].footer_requirements}</a></li>
                                    <li><a href="#">{t[lang].footer_apply}</a></li>
                                    <li><a href="#">{t[lang].footer_questions}</a></li>
                                </ul>
                            </div>
                        </div>

                        {/* Large Logo Image */}
                        <div className="footer-logo">
                            <img 
                                src="/wechat-qr.png" 
                                alt="XH科技创新协会" 
                                className="footer-logo-img"
                                referrerPolicy="no-referrer" 
                            />
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="footer-copyright">
                        <p>{t[lang].footer_copyright}</p>
                    </div>
                </div>
            </footer>
        </div>

        {/* Back to Top */}
            <div className={`back-to-top ${showBackToTop ? 'show' : ''}`} onClick={scrollToTop}>
                <svg className="scroll-progress-ring" viewBox="0 0 64 64">
                    <circle 
                        ref={progressCircleRef}
                        cx="32" cy="32" r="30" 
                        id="progress-circle" 
                        strokeDasharray="188.5"
                        strokeDashoffset="188.5"
                    />
                </svg>
                <ArrowUp size={20} />
            </div>

            {/* Member Modal */}
            {selectedMember && (
                <div className="modal-overlay flex" onClick={closeMemberModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <span className="close-modal" onClick={closeMemberModal}>&times;</span>
                                <img src={selectedMember.avatar} className="w-32 h-32 rounded-full mx-auto mb-4" alt={selectedMember.name} />
                        <h3 className="text-xl font-bold">{selectedMember.name}</h3>
                        <p className="text-gray-500">{selectedMember.className}</p>
                        <p className="mt-5 text-left text-gray-700">{selectedMember.intro}</p>
                        <h4 className="mt-4 text-left font-bold">{t[lang].modal_awards}</h4>
                        <ul className="text-left text-sm text-gray-500 list-disc pl-5">
                            {selectedMember.awards.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                    </div>
                </div>
            )}
            {/* Join Modal */}
            {showJoinModal && (
                <div className="modal-overlay flex items-center justify-center p-4 md:p-6 z-[150]" onClick={() => {
                    setShowJoinModal(false);
                    setJoinStep(1);
                    setJoinSubmitted(false);
                }}>
                    <div className="relative bg-[#0d1117] text-white w-full max-w-6xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.25)] border border-white/10 animate-modal-in flex flex-col md:flex-row h-[85vh] min-h-[650px]" onClick={e => e.stopPropagation()}>
                        {/* Left Column: Form */}
                        <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center">
                            <button className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-20 md:hidden" onClick={() => {
                                setShowJoinModal(false);
                                setJoinStep(1);
                                setJoinSubmitted(false);
                            }}>
                                <X size={28} />
                            </button>

                            {!joinSubmitted ? (
                                <div className="max-w-md mx-auto w-full">
                                    <div className="mb-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="px-2.5 py-0.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                                Step 0{joinStep}
                                            </div>
                                            <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-700 ease-out" 
                                                    style={{ width: `${(joinStep / 4) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tight mb-1">
                                            {joinStep === 1 && "你的姓名是？"}
                                            {joinStep === 2 && "你的学号是？"}
                                            {joinStep === 3 && "联系方式"}
                                            {joinStep === 4 && "最后一步"}
                                        </h3>
                                        <p className="text-sm text-white/40">
                                            {joinStep === 1 && "请输入您的真实姓名以完成登记"}
                                            {joinStep === 2 && "学号将用于协会成员身份验证"}
                                            {joinStep === 3 && "我们需要您的联系方式以便后续通知"}
                                            {joinStep === 4 && "简单介绍一下你自己，让我们更了解你"}
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {joinStep === 1 && (
                                            <div className="space-y-4 animate-fade-in">
                                                <div className="relative group">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                                    <input 
                                                        autoFocus
                                                        value={joinData.name}
                                                        onChange={(e) => setJoinData({ ...joinData, name: e.target.value })}
                                                        type="text" 
                                                        className="relative w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:bg-white/[0.07] transition-all outline-none text-white text-lg placeholder:text-white/10" 
                                                        placeholder="例如：张三" 
                                                    />
                                                </div>
                                                <button 
                                                    disabled={!joinData.name}
                                                    onClick={() => setJoinStep(2)}
                                                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                                                >
                                                    下一步 <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        )}

                                        {joinStep === 2 && (
                                            <div className="space-y-4 animate-fade-in">
                                                <div className="relative group">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                                    <input 
                                                        autoFocus
                                                        value={joinData.studentId}
                                                        onChange={(e) => setJoinData({ ...joinData, studentId: e.target.value })}
                                                        type="text" 
                                                        className="relative w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:bg-white/[0.07] transition-all outline-none text-white text-lg placeholder:text-white/10" 
                                                        placeholder="2023xxxxxx" 
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button onClick={() => setJoinStep(1)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-sm">返回</button>
                                                    <button 
                                                        disabled={!joinData.studentId}
                                                        onClick={() => setJoinStep(3)}
                                                        className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 group"
                                                    >
                                                        下一步 <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {joinStep === 3 && (
                                            <div className="space-y-4 animate-fade-in">
                                                <div className="space-y-4">
                                                    <div className="relative group">
                                                        <input 
                                                            autoFocus
                                                            value={joinData.majorClass}
                                                            onChange={(e) => setJoinData({ ...joinData, majorClass: e.target.value })}
                                                            type="text" 
                                                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:bg-white/[0.07] transition-all outline-none text-white text-lg placeholder:text-white/10" 
                                                            placeholder="专业班级 (如：安全23-1)" 
                                                        />
                                                    </div>
                                                    <div className="relative group">
                                                        <input 
                                                            value={joinData.phone}
                                                            onChange={(e) => setJoinData({ ...joinData, phone: e.target.value })}
                                                            type="tel" 
                                                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:bg-white/[0.07] transition-all outline-none text-white text-lg placeholder:text-white/10" 
                                                            placeholder="联系电话" 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button onClick={() => setJoinStep(2)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-sm">返回</button>
                                                    <button 
                                                        disabled={!joinData.majorClass || !joinData.phone}
                                                        onClick={() => setJoinStep(4)}
                                                        className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 group"
                                                    >
                                                        下一步 <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {joinStep === 4 && (
                                            <div className="space-y-4 animate-fade-in">
                                                <textarea 
                                                    autoFocus
                                                    value={joinData.intro}
                                                    onChange={(e) => setJoinData({ ...joinData, intro: e.target.value })}
                                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:bg-white/[0.07] transition-all outline-none h-32 resize-none text-white text-lg placeholder:text-white/10" 
                                                    placeholder="简单介绍一下你的技术背景或兴趣方向..."
                                                ></textarea>
                                                <div className="flex gap-3">
                                                    <button onClick={() => setJoinStep(3)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-sm">返回</button>
                                                    <button 
                                                        disabled={!joinData.intro}
                                                        onClick={() => setJoinStep(5)}
                                                        className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 group"
                                                    >
                                                        下一步 <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {joinStep === 5 && (
                                            <div className="absolute inset-0 z-[100] bg-[#0d1117] flex flex-col overflow-hidden rounded-[2.5rem]">
                                                <div className="absolute top-8 left-8 z-[110]">
                                                    <button 
                                                        onClick={() => setJoinStep(4)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all text-white/60 hover:text-white"
                                                    >
                                                        <ChevronLeft size={14} /> 返回修改资料
                                                    </button>
                                                </div>
                                                <div className="flex-1 overflow-hidden relative">
                                                    <AgreementOverlay 
                                                        isSubmitting={isJoinSubmitting}
                                                        onAccept={(signature) => {
                                                            setSignatureData(signature);
                                                            setHasAcceptedAgreement(true);
                                                            // Auto-trigger submission after agreement
                                                            const finalData = { ...joinData, signature };
                                                            (async () => {
                                                                setIsJoinSubmitting(true);
                                                                try {
                                                                    await addDocument('recruitment', finalData);
                                                                    setJoinSubmitted(true);
                                                                } catch (error: any) {
                                                                    alert(`提交失败: ${error.message || '未知错误'}`);
                                                                    setHasAcceptedAgreement(false);
                                                                } finally {
                                                                    setIsJoinSubmitting(false);
                                                                }
                                                            })();
                                                        }} 
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 animate-fade-in max-w-sm mx-auto">
                                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                                        <ChevronRight size={40} className="rotate-[-45deg]" />
                                    </div>
                                    <h3 className="text-3xl font-black mb-3 tracking-tight">提交成功！</h3>
                                    <p className="text-white/40 mb-8 leading-relaxed">你的申请已收到，我们将尽快通过电话与你联系。期待你的加入！</p>
                                    <button 
                                        className="w-full py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95 text-lg"
                                        onClick={() => {
                                            setShowJoinModal(false);
                                            setJoinStep(1);
                                            setJoinSubmitted(false);
                                            setJoinData({ name: '', studentId: '', majorClass: '', phone: '', intro: '' });
                                        }}
                                    >
                                        返回首页
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Image */}
                        <div className="hidden md:block w-[40%] relative overflow-hidden">
                            <div className="absolute inset-0 transition-all duration-700 ease-in-out">
                                <img 
                                    key={joinStep}
                                    src={
                                        joinSubmitted ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" :
                                        joinStep === 1 ? "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" :
                                        joinStep === 2 ? "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800" :
                                        joinStep === 3 ? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800" :
                                        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"
                                    } 
                                    className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                                    alt="Recruitment Step"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0d1117] via-transparent to-transparent"></div>
                            <div className="absolute bottom-12 left-12 right-12">
                                <div className="p-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl">
                                    <p className="text-lg font-medium italic text-white/80 leading-relaxed">
                                        {joinSubmitted ? "欢迎加入星河协会，让我们一起创造未来！" :
                                         joinStep === 1 ? "每一个伟大的旅程，都始于一个名字。" :
                                         joinStep === 2 ? "学号是你在校园的通行证，也是你成长的印记。" :
                                         joinStep === 3 ? "保持联系，是团队协作的第一步。" :
                                         "在这里，我们不仅研究安全，更在定义未来。"}
                                    </p>
                                    <div className="mt-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">XH</div>
                                        <div>
                                            <div className="font-bold">星河安全协会</div>
                                            <div className="text-xs text-white/40 uppercase tracking-widest">Xinghe Security</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors z-20" onClick={() => {
                                setShowJoinModal(false);
                                setJoinStep(1);
                                setJoinSubmitted(false);
                            }}>
                                <X size={32} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const GalaxyParticles = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: any[] = [];
        let animationFrameId: number;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class Particle {
            x: number; y: number; size: number; speedX: number; speedY: number; opacity: number;
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random();
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            draw() {
                if (!ctx) return;
                ctx.fillStyle = `rgba(100, 150, 255, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            particles = [];
            const isMobile = window.innerWidth < 768;
            const count = isMobile ? 50 : 150;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        init();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />;
};

export default function AppWrapper() {
    return (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
}
