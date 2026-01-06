/**
 * 模板库完整页面
 * 设计风格：梦幻童话风格
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Layers,
  Sparkles,
  TreePine,
  Castle,
  Rocket,
  Bird,
  Search,
  Heart,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// 模板分类
const categories = [
  { id: "all", label: "全部", icon: Layers },
  { id: "nature", label: "自然探索", icon: TreePine },
  { id: "fairy", label: "童话城堡", icon: Castle },
  { id: "adventure", label: "冒险旅程", icon: Rocket },
  { id: "animals", label: "动物世界", icon: Bird },
];

// 更多模板数据
const allTemplates = [
  { id: 1, title: "森林小精灵", category: "nature", description: "探索神秘森林，遇见可爱的小精灵", image: "/images/template-forest.png", color: "mint", tags: ["自然", "精灵", "探险"], popularity: 1280 },
  { id: 2, title: "海底奇遇记", category: "adventure", description: "潜入深蓝大海，发现海底的秘密", image: "/images/template-ocean.png", color: "coral", tags: ["海洋", "冒险", "友谊"], popularity: 956 },
  { id: 3, title: "星空梦想家", category: "adventure", description: "乘坐火箭飞向星空，探索宇宙奥秘", image: "/images/template-space.png", color: "sunny", tags: ["太空", "梦想", "科幻"], popularity: 1102 },
  { id: 4, title: "公主与小龙", category: "fairy", description: "勇敢的公主和善良的小龙成为好朋友", image: "/images/template-princess.png", color: "coral", tags: ["童话", "友谊", "勇气"], popularity: 1543 },
  { id: 5, title: "农场的一天", category: "animals", description: "和农场小动物们度过快乐的一天", image: "/images/template-farm.png", color: "sunny", tags: ["动物", "农场", "日常"], popularity: 876 },
  { id: 6, title: "四季变换", category: "nature", description: "感受春夏秋冬的美丽变化", image: "/images/template-seasons.png", color: "mint", tags: ["自然", "四季", "教育"], popularity: 1021 },
  { id: 7, title: "小熊学数数", category: "animals", description: "跟着小熊一起学习数字1到10", image: "/images/demo-book.png", color: "coral", tags: ["教育", "数学", "动物"], popularity: 789 },
  { id: 8, title: "彩虹桥的传说", category: "fairy", description: "寻找传说中的彩虹桥，实现美好愿望", image: "/images/demo-book.png", color: "sunny", tags: ["童话", "冒险", "愿望"], popularity: 1234 },
  { id: 9, title: "小蜜蜂采蜜", category: "nature", description: "跟随小蜜蜂了解花朵和蜂蜜的故事", image: "/images/demo-book.png", color: "mint", tags: ["自然", "昆虫", "教育"], popularity: 654 },
  { id: 10, title: "恐龙大冒险", category: "adventure", description: "穿越时空，与恐龙成为朋友", image: "/images/demo-book.png", color: "coral", tags: ["恐龙", "冒险", "科幻"], popularity: 1456 },
  { id: 11, title: "魔法学校", category: "fairy", description: "进入魔法学校，学习神奇的魔法", image: "/images/demo-book.png", color: "sunny", tags: ["魔法", "学校", "冒险"], popularity: 1678 },
  { id: 12, title: "小猫咪的一天", category: "animals", description: "跟着小猫咪体验有趣的日常生活", image: "/images/demo-book.png", color: "mint", tags: ["动物", "日常", "温馨"], popularity: 923 },
];

export default function Templates() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = allTemplates.filter(t => {
    const matchCategory = activeCategory === "all" || t.category === activeCategory;
    const matchSearch = t.title.includes(searchQuery) || t.tags.some(tag => tag.includes(searchQuery));
    return matchCategory && (searchQuery === "" || matchSearch);
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          {/* 页面标题 */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 text-mint mb-4">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">模板库</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              精选<span className="text-coral">故事模板</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              从丰富的模板中选择，快速开始您的绘本创作之旅
            </p>
          </motion.div>

          {/* 搜索和筛选 */}
          <motion.div
            className="flex flex-col md:flex-row gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模板..."
                className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-border focus:border-mint focus:outline-none"
              />
            </div>

            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-coral text-white shadow-md shadow-coral/25"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* 模板数量 */}
          <div className="mb-6 text-sm text-muted-foreground">
            共找到 <span className="font-semibold text-foreground">{filteredTemplates.length}</span> 个模板
          </div>

          {/* 模板网格 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template, index) => (
              <TemplateCard key={template.id} template={template} index={index} />
            ))}
          </div>

          {/* 空状态 */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">没有找到相关模板</h3>
              <p className="text-muted-foreground">试试其他关键词或分类</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface TemplateCardProps {
  template: typeof allTemplates[0];
  index: number;
}

function TemplateCard({ template, index }: TemplateCardProps) {
  const colorClasses = {
    coral: { bg: "bg-coral/10", text: "text-coral", border: "hover:border-coral/30" },
    mint: { bg: "bg-mint/10", text: "text-mint", border: "hover:border-mint/30" },
    sunny: { bg: "bg-sunny/10", text: "text-sunny", border: "hover:border-sunny/30" }
  };
  const colors = colorClasses[template.color as keyof typeof colorClasses];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={`group bg-white rounded-2xl overflow-hidden border border-border/50 ${colors.border} transition-all card-shadow-hover cursor-pointer`}
    >
      {/* 封面图 */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-cream to-mint/10 overflow-hidden">
        <img
          src={template.image}
          alt={template.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
          <Heart className="w-3 h-3 text-coral fill-coral" />
          {template.popularity}
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4">
        <h3 className="font-bold mb-2 group-hover:text-coral transition-colors line-clamp-1">
          {template.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {template.description}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.map((tag, i) => (
            <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
              {tag}
            </span>
          ))}
        </div>

        {/* 使用按钮 */}
        <Link href="/create">
          <Button className="w-full bg-coral hover:bg-coral/90 text-white rounded-full" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            使用此模板
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
