/**
 * 绘本生成步骤组件
 * 展示绘本预览效果，复用 DemoSection 的翻页动画
 */

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  BookOpen,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

// 绘本页面数据类型
export interface BookPage {
  pageNumber: number;
  text: string;
  imageUrl: string;
}

// 组件 Props
export interface BookStepProps {
  // 分镜页面数据（包含文字和画面描述）
  storyboardPages: Array<{
    pageNumber: number;
    text: string;
    imagePrompt: string;
  }>;
  // 已生成的图片映射（页码 -> 图片URL）
  pageImages: Record<string, string>;
  // 占位图片（当图片未生成时显示）
  placeholderImage?: string;
}

// 默认占位图片（使用存在的图片）
const DEFAULT_PLACEHOLDER = "/images/draft-default.webp";

export const BookStep = memo(function BookStep({
  storyboardPages,
  pageImages,
  placeholderImage = DEFAULT_PLACEHOLDER,
}: BookStepProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);

  // 检测屏幕方向和尺寸
  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      setIsLandscape(!isMobile || width > height);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // 构建绘本页面数据（合并分镜文字和生成的图片）
  const pages = useMemo(() => {
    if (!storyboardPages || storyboardPages.length === 0) {
      console.warn('[BookStep] storyboardPages 为空');
      return [];
    }
    const result = storyboardPages.map((page) => ({
      pageNumber: page.pageNumber,
      text: page.text,
      imageUrl: pageImages[String(page.pageNumber)] || placeholderImage,
    }));
    console.log('[BookStep] 构建的 pages:', result);
    return result;
  }, [storyboardPages, pageImages, placeholderImage]);

  // 下一页
  const handleNext = useCallback(() => {
    if (isFlipping || currentPage >= pages.length - 1) return;
    setDirection("next");
    setIsFlipping(true);

    // 移动端竖屏模式：直接切换页面
    if (!isLandscape) {
      setCurrentPage((prev) => prev + 1);
      setTimeout(() => {
        setIsFlipping(false);
        setDirection(null);
      }, 300);
    }
  }, [isFlipping, currentPage, pages.length, isLandscape]);

  // 上一页
  const handlePrev = useCallback(() => {
    if (isFlipping || currentPage <= 0) return;
    setDirection("prev");
    setIsFlipping(true);

    // 移动端竖屏模式：直接切换页面
    if (!isLandscape) {
      setCurrentPage((prev) => prev - 1);
      setTimeout(() => {
        setIsFlipping(false);
        setDirection(null);
      }, 300);
    }
  }, [isFlipping, currentPage, isLandscape]);

  // 翻页动画完成回调
  const onFlipComplete = useCallback(() => {
    if (direction === "next") setCurrentPage((prev) => prev + 1);
    if (direction === "prev") setCurrentPage((prev) => prev - 1);
    setIsFlipping(false);
    setDirection(null);
  }, [direction]);

  // 键盘控制
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") handlePrev();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") handleNext();
    },
    [handlePrev, handleNext]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // 自动播放
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      if (currentPage < pages.length - 1) handleNext();
      else setIsPlaying(false);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, handleNext, currentPage, pages.length]);

  // 可爱文字样式
  const cuteTextStyle =
    "text-base md:text-xl leading-relaxed text-center font-bold bg-gradient-to-br from-coral via-orange-400 to-amber-400 bg-clip-text text-transparent drop-shadow-sm tracking-wide";

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">暂无绘本内容</p>
          <p className="text-xs text-muted-foreground">
            分镜页数: {storyboardPages?.length || 0} | 已生成图片: {Object.keys(pageImages || {}).length}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 标题区域 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 text-mint mb-4">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">绘本预览</span>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-stone-800">
          查看您的<span className="text-coral">专属绘本</span>
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          使用键盘方向键或点击按钮翻页，体验绘本的翻页动画效果
        </p>
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        {/* 绘本主体 - 响应式布局 */}
        <div
          className="relative bg-white rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-stone-200 mx-auto"
          style={{
            width: "100%",
            maxWidth: isLandscape ? "900px" : "500px",
            perspective: isLandscape ? "2500px" : undefined,
          }}
        >
          {/* 横屏/桌面：双页模式 (2:1) */}
          {isLandscape ? (
            <div className="flex w-full" style={{ aspectRatio: "2 / 1" }}>
              {/* 左侧图片 */}
              <div className="w-1/2 bg-gradient-to-br from-[#FFF9F0] to-[#FFF3E0] relative border-r border-stone-200/60">
                <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
                  <img
                    src={
                      direction === "prev"
                        ? pages[currentPage - 1]?.imageUrl
                        : pages[currentPage]?.imageUrl
                    }
                    alt={`第 ${currentPage + 1} 页`}
                    className="w-full h-full object-contain rounded-xl shadow-sm"
                  />
                </div>
              </div>

              {/* 右侧文字 */}
              <div className="w-1/2 bg-white relative">
                <div className="absolute inset-0 flex items-center justify-center p-4 md:p-10">
                  <div className="bg-[#F8F9FA]/80 backdrop-blur-sm rounded-xl md:rounded-[1.5rem] p-4 md:p-8 w-full border border-stone-100/50 shadow-sm">
                    <p className={cuteTextStyle}>
                      {direction === "next"
                        ? pages[currentPage + 1]?.text
                        : pages[currentPage]?.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 竖屏移动端：上下堆叠模式，使用固定高度 */
            <div className="flex flex-col w-full" style={{ height: "500px" }}>
              {/* 上部图片区域 (60%) */}
              <div className="h-[60%] bg-gradient-to-br from-[#FFF9F0] to-[#FFF3E0] relative border-b border-stone-200/60">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`mobile-img-${currentPage}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center p-6"
                  >
                    <img
                      src={pages[currentPage]?.imageUrl}
                      alt={`第 ${currentPage + 1} 页`}
                      className="w-full h-full object-contain rounded-xl shadow-sm"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 下部文字区域 (40%) */}
              <div className="h-[40%] bg-white relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`mobile-text-${currentPage}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center p-6"
                  >
                    <div className="bg-[#F8F9FA]/80 backdrop-blur-sm rounded-xl p-5 w-full border border-stone-100/50 shadow-sm">
                      <p className={cuteTextStyle}>{pages[currentPage]?.text}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* 翻页动画层 - 仅在横屏/桌面显示 */}
          {isLandscape && (
            <>
              <AnimatePresence initial={false}>
                {isFlipping && (
                  <motion.div
                    key={`flip-${currentPage}-${direction}`}
                    className="absolute inset-0 z-50 flex pointer-events-none"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {direction === "next" ? (
                      <motion.div
                        className="absolute right-0 w-1/2 h-full"
                        style={{
                          transformOrigin: "left center",
                          transformStyle: "preserve-3d",
                        }}
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: -180 }}
                        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                        onAnimationComplete={onFlipComplete}
                      >
                        <div
                          className="absolute inset-0 bg-white border-l border-stone-200 flex items-center justify-center p-4 md:p-10"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                          }}
                        >
                          <div className="bg-[#F8F9FA]/80 backdrop-blur-sm rounded-xl md:rounded-[1.5rem] p-4 md:p-8 w-full border border-stone-100/50 shadow-sm">
                            <p className={cuteTextStyle}>
                              {pages[currentPage].text}
                            </p>
                          </div>
                        </div>
                        <div
                          className="absolute inset-0 bg-[#FFF9F0] flex items-center justify-center p-4 md:p-8"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                          }}
                        >
                          <img
                            src={pages[currentPage + 1]?.imageUrl}
                            className="w-full h-full object-contain rounded-xl shadow-sm"
                            alt=""
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="absolute left-0 w-1/2 h-full"
                        style={{
                          transformOrigin: "right center",
                          transformStyle: "preserve-3d",
                        }}
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: 180 }}
                        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                        onAnimationComplete={onFlipComplete}
                      >
                        <div
                          className="absolute inset-0 bg-[#FFF9F0] flex items-center justify-center p-4 md:p-8 border-r border-stone-200"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                          }}
                        >
                          <img
                            src={pages[currentPage].imageUrl}
                            className="w-full h-full object-contain rounded-xl shadow-sm"
                            alt=""
                          />
                        </div>
                        <div
                          className="absolute inset-0 bg-white flex items-center justify-center p-4 md:p-10"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(-180deg)",
                          }}
                        >
                          <div className="bg-[#F8F9FA]/80 backdrop-blur-sm rounded-xl md:rounded-[1.5rem] p-4 md:p-8 w-full border border-stone-100/50 shadow-sm">
                            <p className={cuteTextStyle}>
                              {pages[currentPage - 1]?.text}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 书脊中心线 - 仅在横屏显示 */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-stone-200 z-[60]" />
            </>
          )}
        </div>

        {/* 控制栏 - 响应式布局 */}
        <div className="flex items-center justify-between bg-white px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] shadow-xl border border-stone-100">
          {/* 左侧：翻页导航和页码 */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* 翻页按钮 */}
            <div className="flex bg-stone-50 rounded-full p-1 border border-stone-200/50">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-white hover:shadow-sm h-8 w-8 md:h-10 md:w-10"
                disabled={currentPage === 0 || isFlipping}
                onClick={handlePrev}
              >
                {isLandscape ? (
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-stone-600" />
                ) : (
                  <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-stone-600" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-white hover:shadow-sm h-8 w-8 md:h-10 md:w-10"
                disabled={currentPage === pages.length - 1 || isFlipping}
                onClick={handleNext}
              >
                {isLandscape ? (
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-stone-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-stone-600" />
                )}
              </Button>
            </div>

            {/* 页码 */}
            <div className="text-sm font-bold text-stone-400 tabular-nums">
              <span className="text-stone-800">{currentPage + 1}</span> /{" "}
              {pages.length}
            </div>
          </div>

          {/* 右侧：播放控制 */}
          <div className="flex items-center gap-3">
            <Button
              className="bg-coral hover:bg-coral/90 text-white rounded-full px-4 md:px-8 font-semibold shadow-lg shadow-coral/20 transition-all active:scale-95"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isFlipping}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-1 md:mr-2 fill-current" />
                  <span className="hidden md:inline">暂停播放</span>
                  <span className="md:hidden">暂停</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1 md:mr-2 fill-current" />
                  <span className="hidden md:inline">自动播放</span>
                  <span className="md:hidden">播放</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 键盘提示 - 仅桌面显示 */}
        <p className="hidden md:block text-center text-xs font-medium text-stone-400 tracking-wide">
          提示：使用键盘 <kbd className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200">←</kbd>{" "}
          <kbd className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200">→</kbd> 方向键翻页
        </p>
      </div>
    </div>
  );
});
