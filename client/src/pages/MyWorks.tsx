/**
 * 我的作品页面
 * 设计风格：梦幻童话风格
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  BookOpen,
  Plus,
  Search,
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Share2,
  Download,
  Clock,
  Eye,
  Heart,
  FolderOpen
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// 模拟用户作品数据
const myWorks = [
  {
    id: 1,
    title: "小兔子的森林冒险",
    cover: "/images/demo-book.png",
    createdAt: "2026-01-05",
    updatedAt: "2026-01-06",
    pages: 8,
    views: 128,
    likes: 32,
    status: "published"
  },
  {
    id: 2,
    title: "静夜思 - 月亮的故事",
    cover: "/images/demo-book.png",
    createdAt: "2026-01-04",
    updatedAt: "2026-01-04",
    pages: 6,
    views: 89,
    likes: 21,
    status: "published"
  },
  {
    id: 3,
    title: "勇敢的小消防员",
    cover: "/images/demo-book.png",
    createdAt: "2026-01-03",
    updatedAt: "2026-01-03",
    pages: 10,
    views: 0,
    likes: 0,
    status: "draft"
  },
  {
    id: 4,
    title: "海底世界探险记",
    cover: "/images/demo-book.png",
    createdAt: "2026-01-02",
    updatedAt: "2026-01-02",
    pages: 8,
    views: 156,
    likes: 45,
    status: "published"
  },
];

// 筛选选项
const filterOptions = [
  { id: "all", label: "全部" },
  { id: "published", label: "已发布" },
  { id: "draft", label: "草稿" },
];

export default function MyWorks() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState<number | null>(null);

  const filteredWorks = myWorks.filter(work => {
    const matchFilter = activeFilter === "all" || work.status === activeFilter;
    const matchSearch = searchQuery === "" || work.title.includes(searchQuery);
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          {/* 页面标题 */}
          <motion.div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral mb-4">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium">我的作品</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                我的<span className="text-mint">绘本作品</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                共 {myWorks.length} 本绘本
              </p>
            </div>

            <Link href="/create">
              <Button className="bg-coral hover:bg-coral/90 text-white rounded-full px-6">
                <Plus className="w-5 h-5 mr-2" />
                创作新绘本
              </Button>
            </Link>
          </motion.div>

          {/* 搜索和筛选 */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 mb-8"
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
                placeholder="搜索作品..."
                className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-border focus:border-coral focus:outline-none"
              />
            </div>

            {/* 筛选选项 */}
            <div className="flex gap-2">
              {filterOptions.map((option) => {
                const isActive = activeFilter === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setActiveFilter(option.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-mint text-white shadow-md shadow-mint/25"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* 作品列表 */}
          {filteredWorks.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWorks.map((work, index) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  index={index}
                  showMenu={showMenu === work.id}
                  onToggleMenu={() => setShowMenu(showMenu === work.id ? null : work.id)}
                  onCloseMenu={() => setShowMenu(null)}
                />
              ))}
            </div>
          ) : (
            /* 空状态 */
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">还没有作品</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "没有找到匹配的作品" : "开始创作您的第一本绘本吧！"}
              </p>
              {!searchQuery && (
                <Link href="/create">
                  <Button className="bg-coral hover:bg-coral/90 text-white rounded-full px-8">
                    <Plus className="w-5 h-5 mr-2" />
                    创作新绘本
                  </Button>
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface WorkCardProps {
  work: typeof myWorks[0];
  index: number;
  showMenu: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}

function WorkCard({ work, index, showMenu, onToggleMenu, onCloseMenu }: WorkCardProps) {
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

        {/* 状态标签 */}
        <div className="absolute top-3 left-3">
          {work.status === "draft" ? (
            <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-full">
              草稿
            </span>
          ) : (
            <span className="bg-mint text-white text-xs font-medium px-2 py-1 rounded-full">
              已发布
            </span>
          )}
        </div>

        {/* 更多菜单按钮 */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu();
            }}
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* 下拉菜单 */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={onCloseMenu}
              />
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-border/50 py-2 min-w-[140px] z-20">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  编辑
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  分享
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  下载
                </button>
                <div className="border-t border-border my-1" />
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500">
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4">
        {/* 标题 */}
        <h3 className="font-bold mb-2 group-hover:text-coral transition-colors line-clamp-1">
          {work.title}
        </h3>

        {/* 信息 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {work.updatedAt}
          </span>
          <span>{work.pages} 页</span>
        </div>

        {/* 统计数据 */}
        {work.status === "published" && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {work.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-coral" />
              {work.likes}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
