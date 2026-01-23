/**
 * 作品广场完整页面
 * 设计风格：梦幻童话风格
 * 已对接后端 API
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ImageIcon,
  Heart,
  Eye,
  Share2,
  Crown,
  Flame,
  Clock,
  Search,
  Play,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { galleryApi, GalleryWork } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// 排序选项
const sortOptions = [
  { id: "hot", label: "最热", icon: Flame },
  { id: "newest", label: "最新", icon: Clock },
  { id: "featured", label: "精选", icon: Crown },
];

export default function Gallery() {
  const { isAuthenticated } = useAuth();

  // 作品列表状态
  const [works, setWorks] = useState<GalleryWork[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选状态
  const [activeSort, setActiveSort] = useState<"hot" | "newest" | "featured">("hot");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 加载作品列表
  const loadWorks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await galleryApi.getGallery({
        sort: activeSort,
        search: searchQuery || undefined,
      });
      setWorks(response.works);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || "加载作品失败");
    } finally {
      setIsLoading(false);
    }
  }, [activeSort, searchQuery]);

  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  // 搜索处理
  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  // 点赞处理
  const handleLike = async (workId: string, isLiked: boolean) => {
    if (!isAuthenticated) {
      // 未登录提示
      setError("请先登录后再点赞");
      return;
    }

    try {
      if (isLiked) {
        const result = await galleryApi.unlikeWork(workId);
        setWorks(works.map(w =>
          w.workId === workId
            ? { ...w, stats: { ...w.stats, likes: result.likes }, isLiked: false }
            : w
        ));
      } else {
        const result = await galleryApi.likeWork(workId);
        setWorks(works.map(w =>
          w.workId === workId
            ? { ...w, stats: { ...w.stats, likes: result.likes }, isLiked: true }
            : w
        ));
      }
    } catch (err: any) {
      setError(err.message || "操作失败");
    }
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral mb-4">
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm font-medium">作品广场</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              发现<span className="text-mint">精彩作品</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              浏览其他家长的创意作品，获取灵感，也可以分享您的绘本故事
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

          {/* 搜索和排序 */}
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
                placeholder="搜索作品或作者..."
                className="w-full pl-12 pr-20 py-3 rounded-full border-2 border-border focus:border-coral focus:outline-none"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-coral text-white text-sm rounded-full hover:bg-coral/90"
              >
                搜索
              </button>
            </div>

            {/* 排序选项 */}
            <div className="flex gap-2">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const isActive = activeSort === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setActiveSort(option.id as "hot" | "newest" | "featured")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-mint text-white shadow-md shadow-mint/25"
                        : "bg-white text-muted-foreground hover:bg-muted border border-border/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}

              <Button
                variant="outline"
                onClick={loadWorks}
                disabled={isLoading}
                className="rounded-full"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </motion.div>

          {/* 作品数量 */}
          <div className="mb-6 text-sm text-muted-foreground">
            共 <span className="font-semibold text-foreground">{total}</span> 个作品
          </div>

          {/* 加载中 */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-coral mb-4" />
              <p className="text-muted-foreground">加载作品中...</p>
            </div>
          ) : works.length > 0 ? (
            /* 作品网格 */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {works.map((work, index) => (
                <WorkCard
                  key={work.workId}
                  work={work}
                  index={index}
                  onLike={() => handleLike(work.workId, work.isLiked)}
                />
              ))}
            </div>
          ) : (
            /* 空状态 */
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">没有找到相关作品</h3>
              <p className="text-muted-foreground">试试其他关键词</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface WorkCardProps {
  work: GalleryWork;
  index: number;
  onLike: () => void;
}

function WorkCard({ work, index, onLike }: WorkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group bg-white rounded-2xl overflow-hidden border border-border/50 hover:border-coral/30 transition-all card-shadow-hover"
    >
      {/* 封面图 */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* 占位背景图 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/placeholder-bg.webp)' }}
        />
        {/* 实际图片 */}
        <img
          src={work.coverUrl || "/images/demo-book.webp"}
          alt={work.title}
          loading="lazy"
          className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* 播放按钮 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-coral fill-coral ml-1" />
          </div>
        </div>

        {/* 页数标签 */}
        <div className="absolute top-3 left-3">
          <span className="bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full">
            {work.pageCount} 页
          </span>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4">
        {/* 作者信息 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-mint overflow-hidden">
            <img
              src={work.author.avatar || "/images/default-avatar.webp"}
              alt={work.author.nickname}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm text-muted-foreground">{work.author.nickname}</span>
        </div>

        {/* 标题 */}
        <h3 className="font-bold mb-3 group-hover:text-coral transition-colors line-clamp-1">
          {work.title}
        </h3>

        {/* 互动数据 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={`flex items-center gap-1 transition-colors ${
                work.isLiked ? "text-coral" : "hover:text-coral"
              }`}
            >
              <Heart className={`w-4 h-4 ${work.isLiked ? "fill-coral" : ""}`} />
              {work.stats.likes}
            </button>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {work.stats.views}
            </span>
          </div>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
