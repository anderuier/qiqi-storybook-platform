/**
 * GallerySection 组件 - 作品广场展示
 * 设计风格：梦幻童话风格
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ImageIcon,
  Heart,
  Eye,
  MessageCircle,
  Share2,
  Crown,
  Flame,
  Clock,
  ChevronRight,
  Play
} from "lucide-react";
import { useState, useMemo, memo } from "react";
import { Link } from "wouter";

// 作品数据类型
interface Work {
  id: number;
  title: string;
  author: string;
  avatar: string;
  cover: string;
  likes: number;
  views: number;
  comments: number;
  featured: boolean;
  isNew: boolean;
}

// 排序选项 - 使用 Readonly 防止意外修改
const SORT_OPTIONS: ReadonlyArray<{
  id: string;
  label: string;
  icon: typeof Flame;
}> = [
  { id: "hot", label: "最热", icon: Flame },
  { id: "new", label: "最新", icon: Clock },
  { id: "featured", label: "精选", icon: Crown },
] as const;

// 作品数据 - 移到组件外部，只创建一次
const WORKS: Readonly<Work[]> = [
  {
    id: 1,
    title: "小熊的生日派对",
    author: "琪琪妈妈",
    avatar: "/images/avatar-1.webp",
    cover: "/images/work-1.webp",
    likes: 328,
    views: 1256,
    comments: 42,
    featured: true,
    isNew: false
  },
  {
    id: 2,
    title: "月亮上的小兔子",
    author: "星星爸爸",
    avatar: "/images/avatar-2.webp",
    cover: "/images/work-2.webp",
    likes: 256,
    views: 892,
    comments: 28,
    featured: false,
    isNew: true
  },
  {
    id: 3,
    title: "勇敢的小消防员",
    author: "阳光家庭",
    avatar: "/images/avatar-3.webp",
    cover: "/images/work-3.webp",
    likes: 412,
    views: 1580,
    comments: 56,
    featured: true,
    isNew: false
  },
  {
    id: 4,
    title: "彩虹桥的秘密",
    author: "梦想工坊",
    avatar: "/images/avatar-4.webp",
    cover: "/images/work-4.webp",
    likes: 189,
    views: 723,
    comments: 19,
    featured: false,
    isNew: true
  },
  {
    id: 5,
    title: "小鱼的海底冒险",
    author: "蓝色海洋",
    avatar: "/images/avatar-5.webp",
    cover: "/images/work-5.webp",
    likes: 367,
    views: 1342,
    comments: 45,
    featured: true,
    isNew: false
  },
  {
    id: 6,
    title: "森林音乐会",
    author: "快乐童年",
    avatar: "/images/avatar-6.webp",
    cover: "/images/work-6.webp",
    likes: 298,
    views: 1089,
    comments: 33,
    featured: false,
    isNew: false
  }
] as const;

export default function GallerySection() {
  const [activeSort, setActiveSort] = useState("hot");

  // 使用 useMemo 缓存排序后的作品列表
  const sortedWorks = useMemo(() => {
    return [...WORKS].sort((a, b) => {
      if (activeSort === "hot") return b.likes - a.likes;
      if (activeSort === "new") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      if (activeSort === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0;
    });
  }, [activeSort]);

  return (
    <section id="gallery" className="py-20 bg-coral/5">
      <div className="container">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral mb-4">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm font-medium">作品广场</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            发现<span className="text-mint">精彩作品</span>，分享创作喜悦
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            浏览其他家长的创意作品，获取灵感，也可以分享您的绘本故事
          </p>
        </motion.div>

        {/* 排序选项 */}
        <motion.div
          className="flex justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = activeSort === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setActiveSort(option.id)}
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
        </motion.div>

        {/* 作品网格 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedWorks.map((work, index) => (
            <WorkCard key={work.id} work={work} index={index} />
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
          <Link href="/gallery">
            <Button
              variant="outline"
              className="rounded-full px-8 border-2 border-coral text-coral hover:bg-coral/10"
            >
              浏览更多作品
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

interface WorkCardProps {
  work: Work;
  index: number;
}

// 使用 React.memo 避免不必要的重渲染
const WorkCard = memo(function WorkCard({ work, index }: WorkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-white rounded-2xl overflow-hidden border border-border/50 hover:border-coral/30 transition-all card-shadow-hover"
    >
      {/* 封面图 */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-cream to-coral/10 overflow-hidden">
        <img
          src={work.cover}
          alt={work.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* 播放按钮 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-coral fill-coral ml-1" />
          </div>
        </div>

        {/* 标签 */}
        <div className="absolute top-3 left-3 flex gap-2">
          {work.featured && (
            <span className="bg-sunny text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" />
              精选
            </span>
          )}
          {work.isNew && (
            <span className="bg-mint text-white text-xs font-medium px-2 py-1 rounded-full">
              新作
            </span>
          )}
        </div>
      </div>

      {/* 内容 */}
      <div className="p-5">
        {/* 作者信息 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-mint overflow-hidden">
            <img
              src={work.avatar}
              alt={work.author}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm text-muted-foreground">{work.author}</span>
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-bold mb-4 group-hover:text-coral transition-colors line-clamp-1">
          {work.title}
        </h3>

        {/* 互动数据 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-coral" />
              {work.likes}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {work.views}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {work.comments}
            </span>
          </div>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});
