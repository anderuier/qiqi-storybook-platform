/**
 * 柒柒の魔法绘本屋 - 首页
 * 设计风格：梦幻童话风格 (Whimsical Storybook)
 * 色彩：珊瑚粉、薄荷绿、阳光黄、奶油白
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Palette, 
  Mic2, 
  Sparkles, 
  Play,
  ChevronRight,
  Star,
  Heart,
  Zap,
  Users,
  Clock,
  Shield
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WaveDivider from "@/components/WaveDivider";
import FeatureCard from "@/components/FeatureCard";
import StepCard from "@/components/StepCard";
import DemoSection from "@/components/DemoSection";
import TemplateSection from "@/components/TemplateSection";
import GallerySection from "@/components/GallerySection";
import AboutSection from "@/components/AboutSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Wave Divider */}
      <WaveDivider color="mint" />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Wave Divider */}
      <WaveDivider color="coral" flip />
      
      {/* How It Works */}
      <HowItWorksSection />
      
      {/* Wave Divider */}
      <WaveDivider color="sunny" />
      
      {/* Demo Section */}
      <DemoSection />

      {/* Wave Divider */}
      <WaveDivider color="cream" flip />

      {/* Template Section */}
      <TemplateSection />

      {/* Wave Divider */}
      <WaveDivider color="coral" />

      {/* Gallery Section */}
      <GallerySection />

      {/* Wave Divider */}
      <WaveDivider color="mint" flip />

      {/* About Section */}
      <AboutSection />

      {/* CTA Section */}
      <CTASection />
      
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-16 h-16 text-coral opacity-20"
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Star className="w-full h-full fill-current" />
        </motion.div>
        <motion.div 
          className="absolute top-40 right-20 w-12 h-12 text-mint opacity-30"
          animate={{ y: [0, 10, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <Heart className="w-full h-full fill-current" />
        </motion.div>
        <motion.div 
          className="absolute bottom-40 left-1/4 w-10 h-10 text-sunny opacity-40"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
      </div>
      
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 左侧文字内容 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI驱动的个性化绘本创作</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              用<span className="text-coral">爱</span>与<span className="text-mint">AI</span>
              <br />
              为孩子创作
              <br />
              <span className="text-sunny">独一无二</span>的绘本
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
              为3-6岁学龄前儿童打造专属故事绘本，支持古诗词、寓言改编，
              还能用<strong className="text-coral">爸爸妈妈的声音</strong>讲述每一个温暖的故事。
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/create">
                <Button size="lg" className="bg-coral hover:bg-coral/90 text-white rounded-full px-8 shadow-lg shadow-coral/25">
                  <Play className="w-5 h-5 mr-2" />
                  开始创作
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full px-8 border-2 border-mint text-mint hover:bg-mint/10">
                了解更多
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
            
            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-4 sm:flex sm:gap-8 mt-12">
              <div className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-coral">10,000+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">绘本已创作</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-mint">20+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">艺术风格</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-sunny">99%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">家长好评</div>
              </div>
            </div>
          </motion.div>
          
          {/* 右侧插图 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-coral/20">
              <img
                src="/images/hero-illustration.webp"
                alt="亲子阅读绘本的温馨场景"
                className="w-full h-auto"
              />
              {/* 悬浮的装饰卡片 */}
              <motion.div 
                className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-lg"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center">
                    <Mic2 className="w-5 h-5 text-mint" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">语音克隆</div>
                    <div className="text-xs text-muted-foreground">用您的声音讲故事</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-lg"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sunny/20 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-sunny" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">多种风格</div>
                    <div className="text-xs text-muted-foreground">水彩、卡通、3D...</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: BookOpen,
      title: "智能故事创作",
      description: "输入主题或古诗词，AI自动生成适合3-6岁儿童的精彩故事，支持自定义编辑和润色。",
      color: "coral" as const,
      image: "/images/feature-story.webp"
    },
    {
      icon: Palette,
      title: "多样艺术风格",
      description: "卡通动漫、水彩手绘、蜡笔涂鸦、3D渲染...20+种风格任您选择，每一页都是艺术品。",
      color: "mint" as const,
      image: "/images/feature-art.webp"
    },
    {
      icon: Mic2,
      title: "声音克隆朗读",
      description: "只需30秒录音，AI即可克隆您的声音，用爸爸妈妈的声音为孩子讲述每一个故事。",
      color: "sunny" as const,
      image: "/images/feature-voice.webp"
    }
  ];
  
  return (
    <section id="features" className="py-20 bg-mint/5">
      <div className="container">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 text-mint mb-4">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">核心功能</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            三大核心功能，打造<span className="text-coral">完美绘本</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            从故事创作到艺术风格，再到个性化语音，我们为您提供一站式绘本创作体验
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "选择创作模式",
      description: "主题故事、古诗词改编或自定义文本，三种模式满足不同需求",
      color: "coral" as const
    },
    {
      number: 2,
      title: "输入创意内容",
      description: "输入故事主题、诗词标题或您自己的故事文本",
      color: "mint" as const
    },
    {
      number: 3,
      title: "选择艺术风格",
      description: "从20+种精美艺术风格中选择最适合的绘本风格",
      color: "sunny" as const
    },
    {
      number: 4,
      title: "AI生成绘本",
      description: "AI自动生成故事文本和精美插图，支持单页重新生成",
      color: "coral" as const
    },
    {
      number: 5,
      title: "添加个性声音",
      description: "克隆您的声音或选择预置音色，为绘本添加温暖朗读",
      color: "mint" as const
    },
    {
      number: 6,
      title: "分享与下载",
      description: "生成分享链接、下载视频或保存到个人作品集",
      color: "sunny" as const
    }
  ];
  
  return (
    <section id="how-it-works" className="py-20 bg-coral/5">
      <div className="container">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral mb-4">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">创作流程</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-mint">6步</span>轻松创作专属绘本
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            简单直观的创作向导，让每一位家长都能轻松上手
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <StepCard key={index} {...step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-coral/10 via-mint/5 to-sunny/10">
      <div className="container">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            准备好为孩子创作
            <br />
            <span className="text-coral">独一无二</span>的绘本了吗？
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            加入我们，用AI和爱为孩子打造专属的童话世界
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/create">
              <Button size="lg" className="bg-coral hover:bg-coral/90 text-white rounded-full px-10 shadow-lg shadow-coral/25">
                <Sparkles className="w-5 h-5 mr-2" />
                立即开始创作
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="rounded-full px-10 border-2">
                联系我们
              </Button>
            </Link>
          </div>
          
          <div className="flex justify-center items-center gap-8 mt-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-mint" />
              <span className="text-sm">安全可靠</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5 text-coral" />
              <span className="text-sm">10,000+家庭信赖</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="w-5 h-5 text-sunny" />
              <span className="text-sm">99%好评率</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
