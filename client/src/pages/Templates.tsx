/**
 * 模板库完整页面
 * 设计风格：梦幻童话风格
 * 已对接后端 API
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Layers,
  Sparkles,
  Search,
  Heart,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { templatesApi, Template } from "@/lib/api";

// 分类图标映射
const categoryIcons: Record<string, string> = {
  nature: "🌲",
  fairy: "🏰",
  adventure: "🚀",
  animals: "🐦",
  education: "📚",
};

export default function Templates() {
  // 模板列表状态
  const [templates, setTemplates] = useState<Template[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 分类状态
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string; count: number }>>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 加载分类
  const loadCategories = useCallback(async () => {
    try {
      const response = await templatesApi.getCategories();
      setCategories([
        { id: "all", name: "全部", icon: "📋", count: 0 },
        ...response.categories,
      ]);
    } catch (err) {
      // 分类加载失败不影响主流程
    }
  }, []);

  // 加载模板列表
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await templatesApi.getTemplates({
        category: activeCategory === "all" ? undefined : activeCategory,
        search: searchQuery || undefined,
      });
      setTemplates(response.templates);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || "加载模板失败");
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery]);

  // 初始加载
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // 加载模板
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // 搜索处理
  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

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

          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
            >
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 underline hover:no-underline"
              >
                关闭
              </button>
            </motion.div>
          )}

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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜索模板..."
                className="w-full pl-12 pr-20 py-3 rounded-full border-2 border-border focus:border-mint focus:outline-none"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-mint text-white text-sm rounded-full hover:bg-mint/90"
              >
                搜索
              </button>
            </div>

            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2 items-center">
              {categories.map((cat) => {
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
                    <span>{cat.icon || categoryIcons[cat.id] || "📁"}</span>
                    {cat.name}
                  </button>
                );
              })}

              <Button
                variant="outline"
                onClick={loadTemplates}
                disabled={isLoading}
                className="rounded-full"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </motion.div>

          {/* 模板数量 */}
          <div className="mb-6 text-sm text-muted-foreground">
            共找到 <span className="font-semibold text-foreground">{total}</span> 个模板
          </div>

          {/* 加载中 */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-mint mb-4" />
              <p className="text-muted-foreground">加载模板中...</p>
            </div>
          ) : templates.length > 0 ? (
            /* 模板网格 */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates.map((template, index) => (
                <TemplateCard key={template.templateId} template={template} index={index} />
              ))}
            </div>
          ) : (
            /* 空状态 */
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
  template: Template;
  index: number;
}

function TemplateCard({ template, index }: TemplateCardProps) {
  // 根据分类选择颜色
  const getColorClass = (category: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      nature: { bg: "bg-mint/10", text: "text-mint", border: "hover:border-mint/30" },
      fairy: { bg: "bg-coral/10", text: "text-coral", border: "hover:border-coral/30" },
      adventure: { bg: "bg-sunny/10", text: "text-sunny", border: "hover:border-sunny/30" },
      animals: { bg: "bg-mint/10", text: "text-mint", border: "hover:border-mint/30" },
      education: { bg: "bg-coral/10", text: "text-coral", border: "hover:border-coral/30" },
    };
    return colorMap[category] || { bg: "bg-muted", text: "text-muted-foreground", border: "hover:border-border" };
  };

  const colors = getColorClass(template.category);

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
          src={template.coverUrl || "/images/demo-book.png"}
          alt={template.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
          <Heart className="w-3 h-3 text-coral fill-coral" />
          {template.usageCount}
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4">
        <h3 className="font-bold mb-2 group-hover:text-coral transition-colors line-clamp-1">
          {template.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {template.description}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
              {tag}
            </span>
          ))}
        </div>

        {/* 使用按钮 */}
        <Link href={`/create?template=${template.templateId}`}>
          <Button className="w-full bg-coral hover:bg-coral/90 text-white rounded-full" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            使用此模板
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
