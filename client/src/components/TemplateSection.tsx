/**
 * TemplateSection 组件 - 模板库展示
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
  Fish,
  Bird,
  Sun,
  Moon,
  Heart,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

import { Link } from "wouter";

// 模板分类
const categories = [
  { id: "all", label: "全部", icon: Layers },
  { id: "nature", label: "自然探索", icon: TreePine },
  { id: "fairy", label: "童话城堡", icon: Castle },
  { id: "adventure", label: "冒险旅程", icon: Rocket },
  { id: "animals", label: "动物世界", icon: Bird },
];

// 模板数据
const templates = [
  {
    id: 1,
    title: "森林小精灵",
    category: "nature",
    description: "探索神秘森林，遇见可爱的小精灵",
    image: "/images/template-forest.webp",
    color: "mint",
    tags: ["自然", "精灵", "探险"],
    popularity: 1280
  },
  {
    id: 2,
    title: "海底奇遇记",
    category: "adventure",
    description: "潜入深蓝大海，发现海底的秘密",
    image: "/images/template-ocean.webp",
    color: "coral",
    tags: ["海洋", "冒险", "友谊"],
    popularity: 956
  },
  {
    id: 3,
    title: "星空梦想家",
    category: "adventure",
    description: "乘坐火箭飞向星空，探索宇宙奥秘",
    image: "/images/template-space.webp",
    color: "sunny",
    tags: ["太空", "梦想", "科幻"],
    popularity: 1102
  },
  {
    id: 4,
    title: "公主与小龙",
    category: "fairy",
    description: "勇敢的公主和善良的小龙成为好朋友",
    image: "/images/template-princess.webp",
    color: "coral",
    tags: ["童话", "友谊", "勇气"],
    popularity: 1543
  },
  {
    id: 5,
    title: "农场的一天",
    category: "animals",
    description: "和农场小动物们度过快乐的一天",
    image: "/images/template-farm.webp",
    color: "sunny",
    tags: ["动物", "农场", "日常"],
    popularity: 876
  },
  {
    id: 6,
    title: "四季变换",
    category: "nature",
    description: "感受春夏秋冬的美丽变化",
    image: "/images/template-seasons.webp",
    color: "mint",
    tags: ["自然", "四季", "教育"],
    popularity: 1021
  }
];

export default function TemplateSection() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredTemplates = activeCategory === "all"
    ? templates
    : templates.filter(t => t.category === activeCategory);

  return (
    <section id="templates" className="py-20 bg-background">
      <div className="container">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 text-mint mb-4">
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">模板库</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            精选<span className="text-coral">故事模板</span>，激发创作灵感
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            从丰富的模板中选择，快速开始您的绘本创作之旅
          </p>
        </motion.div>

        {/* 分类筛选 */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
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
        </motion.div>

        {/* 模板网格 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <TemplateCard key={template.id} template={template} index={index} />
          ))}
        </div>

        {/* 查看更多 */}
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/templates">
            <Button
              variant="outline"
              className="rounded-full px-8 border-2 border-mint text-mint hover:bg-mint/10"
            >
              查看全部模板
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

interface TemplateCardProps {
  template: typeof templates[0];
  index: number;
}

function TemplateCard({ template, index }: TemplateCardProps) {
  const colorClasses = {
    coral: {
      bg: "bg-coral/10",
      text: "text-coral",
      border: "hover:border-coral/30"
    },
    mint: {
      bg: "bg-mint/10",
      text: "text-mint",
      border: "hover:border-mint/30"
    },
    sunny: {
      bg: "bg-sunny/10",
      text: "text-sunny",
      border: "hover:border-sunny/30"
    }
  };

  const colors = colorClasses[template.color as keyof typeof colorClasses];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group bg-white rounded-2xl overflow-hidden border border-border/50 ${colors.border} transition-all card-shadow-hover cursor-pointer`}
    >
      {/* 封面图 */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-cream to-mint/10 overflow-hidden">
        <img
          src={template.image}
          alt={template.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* 热度标签 */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
          <Heart className="w-3 h-3 text-coral fill-coral" />
          {template.popularity}
        </div>
      </div>

      {/* 内容 */}
      <div className="p-5">
        <h3 className="text-lg font-bold mb-2 group-hover:text-coral transition-colors">
          {template.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {template.description}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap gap-2">
          {template.tags.map((tag, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 使用按钮 */}
        <Link href="/create">
          <Button
            className="w-full mt-4 bg-coral hover:bg-coral/90 text-white rounded-full"
            size="sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            使用此模板
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
