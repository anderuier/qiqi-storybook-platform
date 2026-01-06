/**
 * 作品广场完整页面
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
  Search,
  Play
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// 排序选项
const sortOptions = [
  { id: "hot", label: "最热", icon: Flame },
  { id: "new", label: "最新", icon: Clock },
  { id: "featured", label: "精选", icon: Crown },
];

// 更多作品数据
const allWorks = [
  { id: 1, title: "小熊的生日派对", author: "琪琪妈妈", avatar: "/images/avatar-1.png", cover: "/images/work-1.png", likes: 328, views: 1256, comments: 42, featured: true, isNew: false },
  { id: 2, title: "月亮上的小兔子", author: "星星爸爸", avatar: "/images/avatar-2.png", cover: "/images/work-2.png", likes: 256, views: 892, comments: 28, featured: false, isNew: true },
  { id: 3, title: "勇敢的小消防员", author: "阳光家庭", avatar: "/images/avatar-3.png", cover: "/images/work-3.png", likes: 412, views: 1580, comments: 56, featured: true, isNew: false },
  { id: 4, title: "彩虹桥的秘密", author: "梦想工坊", avatar: "/images/avatar-4.png", cover: "/images/work-4.png", likes: 189, views: 723, comments: 19, featured: false, isNew: true },
  { id: 5, title: "小鱼的海底冒险", author: "蓝色海洋", avatar: "/images/avatar-5.png", cover: "/images/work-5.png", likes: 367, views: 1342, comments: 45, featured: true, isNew: false },
  { id: 6, title: "森林音乐会", author: "快乐童年", avatar: "/images/avatar-6.png", cover: "/images/work-6.png", likes: 298, views: 1089, comments: 33, featured: false, isNew: false },
  { id: 7, title: "小蝴蝶找妈妈", author: "花��家庭", avatar: "/images/avatar-1.png", cover: "/images/demo-book.png", likes: 234, views: 876, comments: 21, featured: false, isNew: true },
  { id: 8, title: "恐龙宝宝的一天", author: "探险家", avatar: "/images/avatar-2.png", cover: "/images/demo-book.png", likes: 456, views: 1678, comments: 67, featured: true, isNew: false },
  { id: 9, title: "小星星的愿望", author: "夜空妈妈", avatar: "/images/avatar-3.png", cover: "/images/demo-book.png", likes: 312, views: 1123, comments: 38, featured: false, isNew: false },
  { id: 10, title: "农场里的朋友们", author: "田园爸爸", avatar: "/images/avatar-4.png", cover: "/images/demo-book.png", likes: 278, views: 945, comments: 29, featured: false, isNew: true },
  { id: 11, title: "魔法森林历险记", author: "童话世界", avatar: "/images/avatar-5.png", cover: "/images/demo-book.png", likes: 523, views: 1890, comments: 78, featured: true, isNew: false },
  { id: 12, title: "小企鹅学游泳", author: "冰雪家庭", avatar: "/images/avatar-6.png", cover: "/images/demo-book.png", likes: 198, views: 756, comments: 24, featured: false, isNew: false },
];

export default function Gallery() {
  const [activeSort, setActiveSort] = useState("hot");
  const [searchQuery, setSearchQuery] = useState("");

  // 排序和筛选
  const filteredWorks = allWorks
    .filter(w => searchQuery === "" || w.title.includes(searchQuery) || w.author.includes(searchQuery))
    .sort((a, b) => {
      if (activeSort === "hot") return b.likes - a.likes;
      if (activeSort === "new") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      if (activeSort === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0;
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索作品或作者..."
                className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-border focus:border-coral focus:outline-none"
              />
            </div>

            {/* 排序选项 */}
            <div className="flex gap-2">
              {sortOptions.map((option) => {
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
            </div>
          </motion.div>

          {/* 作品数量 */}
          <div className="mb-6 text-sm text-muted-foreground">
            共 <span className="font-semibold text-foreground">{filteredWorks.length}</span> 个作品
          </div>

          {/* 作品网格 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWorks.map((work, index) => (
              <WorkCard key={work.id} work={work} index={index} />
            ))}
          </div>

          {/* 空状态 */}
          {filteredWorks.length === 0 && (
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
  work: typeof allWorks[0];
  index: number;
}

function WorkCard({ work, index }: WorkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
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
      <div className="p-4">
        {/* 作者信息 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-mint overflow-hidden">
            <img src={work.avatar} alt={work.author} className="w-full h-full object-cover" />
          </div>
          <span className="text-sm text-muted-foreground">{work.author}</span>
        </div>

        {/* 标题 */}
        <h3 className="font-bold mb-3 group-hover:text-coral transition-colors line-clamp-1">
          {work.title}
        </h3>

        {/* 互动数据 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
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
}
