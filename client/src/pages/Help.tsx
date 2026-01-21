/**
 * 帮助中心页面
 * 设计风格：梦幻童话风格
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Search,
  BookOpen,
  Palette,
  Mic2,
  CreditCard,
  Settings,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// 帮助分类
const helpCategories = [
  { id: "getting-started", label: "快速入门", icon: BookOpen, color: "coral" },
  { id: "creation", label: "绘本创作", icon: Palette, color: "mint" },
  { id: "voice", label: "语音功能", icon: Mic2, color: "sunny" },
  { id: "account", label: "账户管理", icon: Settings, color: "coral" },
  { id: "payment", label: "付费相关", icon: CreditCard, color: "mint" },
];

// FAQ数据
const faqs = [
  {
    category: "getting-started",
    question: "如何开始创作我的第一本绘本？",
    answer: "点击首页的「开始创作」按钮，选择创作模式（主题故事、古诗词改编或自定义文本），输入内容，选择艺术风格和语音，AI就会为您生成专属绘本。整个过程只需几分钟！"
  },
  {
    category: "getting-started",
    question: "绘本适合什么年龄段的孩子？",
    answer: "我们的绘本主要面向3-6岁学龄前儿童设计，故事内容简单易懂，配图色彩丰富，非常适合亲子共读。"
  },
  {
    category: "creation",
    question: "可以选择哪些艺术风格？",
    answer: "目前提供20+种艺术风格，包括水彩手绘、卡通动漫、蜡笔涂鸦、3D渲染、扁平插画、剪纸风格等，您可以根据喜好自由选择。"
  },
  {
    category: "creation",
    question: "生成的绘本可以修改吗？",
    answer: "可以！您可以对生成的故事文本进行编辑，也可以重新生成某一页的插图，直到满意为止。"
  },
  {
    category: "creation",
    question: "一本绘本有多少页？",
    answer: "默认生成8-12页的绘本，您也可以在创作时自定义页数。每页包含精美插图和故事文字。"
  },
  {
    category: "voice",
    question: "如何克隆我的声音？",
    answer: "在创作流程的语音选择步骤，选择「克隆我的声音」，上传一段30秒左右的清晰录音，AI就能学习您的声音特征，用您的声音朗读绘本。"
  },
  {
    category: "voice",
    question: "录音有什么要求？",
    answer: "建议在安静环境下录制，使用手机或电脑麦克风即可。录音内容可以是任意文字，保持自然语速，时长30秒左右效果最佳。"
  },
  {
    category: "account",
    question: "如何保存我的作品？",
    answer: "登录账号后，您创作的所有绘本都会自动保存到「我的作品」中，可以随时查看、编辑或分享。"
  },
  {
    category: "account",
    question: "可以分享给家人朋友吗？",
    answer: "当然可以！每本绘本都可以生成分享链接，家人朋友通过链接就能观看。您也可以下载视频或PDF格式保存。"
  },
  {
    category: "payment",
    question: "有免费试用吗？",
    answer: "新用户注册即可免费创作3本绘本，体验全部功能。之后可以选择购买创作次数或订阅会员。"
  },
  {
    category: "payment",
    question: "会员有什么权益？",
    answer: "会员可享受无限创作次数、优先使用新功能、专属艺术风格、高清导出等权益。具体请查看定价页面。"
  },
];

export default function Help() {
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(faq => {
    const matchCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchSearch = searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          {/* 页面标题 */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sunny/10 text-sunny mb-4">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-medium">帮助中心</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              有问题？我们来<span className="text-coral">帮助您</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              查找常见问题的答案，或联系我们获取更多帮助
            </p>
          </motion.div>

          {/* 搜索框 */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索问题..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border focus:border-coral focus:outline-none text-lg"
              />
            </div>
          </motion.div>

          {/* 分类标签 */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {helpCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const colorClasses = {
                coral: "bg-coral text-white shadow-coral/25",
                mint: "bg-mint text-white shadow-mint/25",
                sunny: "bg-sunny text-white shadow-sunny/25"
              };
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? `${colorClasses[cat.color as keyof typeof colorClasses]} shadow-md`
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </motion.div>

          {/* FAQ列表 */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-border/50 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="font-semibold pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-5 pb-5 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          {/* 空状态 */}
          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">没有找到相关问题</h3>
              <p className="text-muted-foreground text-sm">试试其他关键词，或联系我们</p>
            </div>
          )}

          {/* 联系我们 */}
          <motion.div
            className="mt-16 bg-gradient-to-r from-coral/10 via-mint/10 to-sunny/10 rounded-3xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <MessageCircle className="w-12 h-12 text-coral mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">还有其他问题？</h3>
            <p className="text-muted-foreground mb-6">
              我们的客服团队随时为您提供帮助
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <Button className="bg-coral hover:bg-coral/90 text-white rounded-full px-6">
                  <Mail className="w-4 h-4 mr-2" />
                  联系我们
                </Button>
              </Link>
              <Button variant="outline" className="rounded-full px-6">
                <Phone className="w-4 h-4 mr-2" />
                400-888-8888
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
