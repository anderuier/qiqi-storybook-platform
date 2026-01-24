/**
 * 我的作品页面
 * 设计风格：梦幻童话风格
 * 已对接后端 API
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
  FolderOpen,
  Loader2,
  RefreshCw,
  Globe,
  Lock
} from "lucide-react";
import { useState, useEffect, useCallback, memo } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { worksApi, Work } from "@/lib/api";

// 筛选选项
const filterOptions = [
  { id: "all", label: "全部" },
  { id: "published", label: "已发布" },
  { id: "draft", label: "草稿" },
];

export default function MyWorks() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // 作品列表状态
  const [works, setWorks] = useState<Work[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选和搜索状态
  const [activeFilter, setActiveFilter] = useState<"all" | "published" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // 删除确认状态
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // 加载作品列表
  const loadWorks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await worksApi.getMyWorks({
        status: activeFilter,
        sort: "newest",
      });
      setWorks(response.works);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || "加载作品失败");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    if (isAuthenticated) {
      loadWorks();
    }
  }, [isAuthenticated, loadWorks]);

  // 删除作品
  const handleDelete = async (workId: string) => {
    setIsDeleting(true);
    try {
      await worksApi.deleteWork(workId);
      setWorks(works.filter(w => w.workId !== workId));
      setTotal(total - 1);
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || "删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  // 发布/取消发布作品
  const handleTogglePublish = async (work: Work) => {
    try {
      if (work.status === "draft") {
        await worksApi.publishWork(work.workId, {
          visibility: "public",
          allowComments: true,
        });
      } else {
        await worksApi.unpublishWork(work.workId);
      }
      // 重新加载列表
      loadWorks();
    } catch (err: any) {
      setError(err.message || "操作失败");
    }
    setShowMenu(null);
  };

  // 本地搜索过滤
  const filteredWorks = works.filter(work => {
    return searchQuery === "" || work.title.includes(searchQuery);
  });

  // 加载中显示
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

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
                共 {total} 本绘本
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={loadWorks}
                disabled={isLoading}
                className="rounded-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                刷新
              </Button>
              <Link href="/create">
                <Button className="bg-coral hover:bg-coral/90 text-white rounded-full px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  创作新绘本
                </Button>
              </Link>
            </div>
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
                    onClick={() => setActiveFilter(option.id as "all" | "published" | "draft")}
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

          {/* 加载中 */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-coral mb-4" />
              <p className="text-muted-foreground">加载作品中...</p>
            </div>
          ) : filteredWorks.length > 0 ? (
            /* 作品列表 */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWorks.map((work, index) => (
                <WorkCard
                  key={work.workId}
                  work={work}
                  index={index}
                  showMenu={showMenu === work.workId}
                  onToggleMenu={() => setShowMenu(showMenu === work.workId ? null : work.workId)}
                  onCloseMenu={() => setShowMenu(null)}
                  onDelete={() => setDeleteConfirm(work.workId)}
                  onTogglePublish={() => handleTogglePublish(work)}
                  onEdit={() => {
                    setShowMenu(null);
                    window.location.href = `/create?draft=${work.workId}`;
                  }}
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

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm mx-4"
          >
            <h3 className="text-lg font-bold mb-2">确认删除</h3>
            <p className="text-muted-foreground mb-6">
              删除后将无法恢复，确定要删除这本绘本吗？
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-full"
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    删除中...
                  </>
                ) : (
                  "确认删除"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

interface WorkCardProps {
  work: Work;
  index: number;
  showMenu: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onEdit: () => void;
}

// 格式化日期函数 - 移到组件外部，只创建一次
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 使用 React.memo 避免不必要的重渲染
const WorkCard = memo(function WorkCard({ work, index, showMenu, onToggleMenu, onCloseMenu, onDelete, onTogglePublish, onEdit }: WorkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group bg-white rounded-2xl border border-border/50 hover:border-coral/30 transition-all card-shadow-hover relative"
    >
      {/* 封面图区域 */}
      <div className="relative aspect-[4/3] rounded-t-2xl overflow-hidden">
        {/* 占位背景图 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/placeholder-bg.webp)' }}
        />
        {/* 实际图片 */}
        <img
          src={work.firstImageUrl || work.coverUrl || "/images/draft-default.webp"}
          alt={work.title}
          loading="lazy"
          className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* 播放按钮 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 z-20">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-coral fill-coral ml-1" />
          </div>
        </div>

        {/* 状态标签 */}
        <div className="absolute top-3 left-3 z-10">
          {work.status === "draft" ? (
            <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" />
              草稿
            </span>
          ) : (
            <span className="bg-mint text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <Globe className="w-3 h-3" />
              已发布
            </span>
          )}
        </div>
      </div>

      {/* 更多菜单按钮和下拉菜单 - 移到封面图容器外部 */}
      <div className="absolute top-3 right-3 z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* 下拉菜单 */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={onCloseMenu}
            />
            <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-border/50 py-2 min-w-[140px] z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePublish();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                {work.status === "draft" ? (
                  <>
                    <Globe className="w-4 h-4" />
                    发布
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    取消发布
                  </>
                )}
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </>
        )}
      </div>

      {/* 内容 */}
      <div className="p-4 rounded-b-2xl">
        {/* 标题 */}
        <h3 className="font-bold mb-2 group-hover:text-coral transition-colors line-clamp-1">
          {work.title}
        </h3>

        {/* 信息 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(work.updatedAt)}
          </span>
          <span>{work.pageCount} 页</span>
        </div>

        {/* 统计数据 */}
        {work.status === "published" && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {work.stats.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-coral" />
              {work.stats.likes}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
});
