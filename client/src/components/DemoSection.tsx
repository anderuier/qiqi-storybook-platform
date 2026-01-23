import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Sparkles,
  BookOpen,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "wouter";

export default function DemoSection() {
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

  const pages = useMemo(() => [
    { text: "从前,在一片神奇的森林里,住着一只勇敢的小兔子,它的名字叫小白。", image: "/images/demo-page-1.webp" },
    { text: "小白有一双明亮的眼睛和一颗善良的心。它最喜欢在森林里探险,寻找新朋友。", image: "/images/demo-page-2.webp" },
    { text: "一天,小白听说森林深处有一朵神奇的七色花,能实现一个愿望。它决定去寻找这朵花。", image: "/images/demo-page-3.webp" },
    { text: "在路上,小白遇到了迷路的小松鼠。'别担心,我带你回家!'小白说。", image: "/images/demo-page-4.webp" },
    { text: "送完小松鼠后,小白继续前进。它穿过了彩虹桥,来到了花的所在地。", image: "/images/demo-page-5.webp" },
    { text: "七色花真的在那里!小白许下了愿望:'希望森林里的小动物们都能快乐!'", image: "/images/demo-page-6.webp" },
    { text: "从此以后,森林里充满了欢声笑语。小白成为了大家心中的小英雄。", image: "/images/demo-page-7.webp" },
  ], []);

  const handleNext = useCallback(() => {
    if (isFlipping || currentPage >= pages.length - 1) return;
    setDirection("next");
    setIsFlipping(true);

    // 移动端竖屏模式：直接切换页面，不需要等待动画
    if (!isLandscape) {
      setCurrentPage(prev => prev + 1);
      setTimeout(() => {
        setIsFlipping(false);
        setDirection(null);
      }, 300);
    }
  }, [isFlipping, currentPage, pages.length, isLandscape]);

  const handlePrev = useCallback(() => {
    if (isFlipping || currentPage <= 0) return;
    setDirection("prev");
    setIsFlipping(true);

    // 移动端竖屏模式：直接切换页面，不需要等待动画
    if (!isLandscape) {
      setCurrentPage(prev => prev - 1);
      setTimeout(() => {
        setIsFlipping(false);
        setDirection(null);
      }, 300);
    }
  }, [isFlipping, currentPage, isLandscape]);

  const onFlipComplete = () => {
    // 仅在横屏/桌面模式下通过动画回调更新页面
    if (direction === "next") setCurrentPage(prev => prev + 1);
    if (direction === "prev") setCurrentPage(prev => prev - 1);
    setIsFlipping(false);
    setDirection(null);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") handlePrev();
    if (e.key === "ArrowRight" || e.key === "ArrowDown") handleNext();
  }, [handlePrev, handleNext]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      if (currentPage < pages.length - 1) handleNext();
      else setIsPlaying(false);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, handleNext, currentPage, pages.length]);

  const cuteTextStyle = "text-base md:text-xl leading-relaxed text-center font-bold bg-gradient-to-br from-coral via-orange-400 to-amber-400 bg-clip-text text-transparent drop-shadow-sm tracking-wide";

  return (
    <section id="demo" className="py-12 md:py-20 bg-[#FDFBF7]">
      <div className="container mx-auto px-4">
        {/* 标题区域 */}
        <motion.div 
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 text-mint mb-4">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">在线演示</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-stone-800">
            体验 <span className="text-coral">AI 绘本</span> 的魔力
          </h2>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="relative flex flex-col gap-4 md:gap-6">
            
            {/* 绘本主体 - 响应式布局 */}
            <div 
              className="relative bg-white rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-stone-200" 
              style={isLandscape ? { perspective: "2500px" } : {}}
            >
              {/* 横屏/桌面：双页模式 (2:1) */}
              {isLandscape ? (
                <div className="flex w-full" style={{ aspectRatio: "2 / 1" }}>
                  {/* 左侧图片 */}
                  <div className="w-1/2 bg-gradient-to-br from-[#FFF9F0] to-[#FFF3E0] relative border-r border-stone-200/60">
                    <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
                      <img
                        src={direction === 'prev' ? pages[currentPage - 1]?.image : pages[currentPage]?.image}
                        alt="Left Page"
                        className="w-full h-full object-contain rounded-xl shadow-sm"
                      />
                    </div>
                  </div>

                  {/* 右侧文字 */}
                  <div className="w-1/2 bg-white relative">
                    <div className="absolute inset-0 flex items-center justify-center p-4 md:p-10">
                      <div className="bg-[#F8F9FA]/80 backdrop-blur-sm rounded-xl md:rounded-[1.5rem] p-4 md:p-8 w-full border border-stone-100/50 shadow-sm">
                        <p className={cuteTextStyle}>
                          {direction === 'next' ? pages[currentPage + 1]?.text : pages[currentPage]?.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 竖屏移动端：上下堆叠模式 (4:5) */
                <div className="flex flex-col w-full" style={{ aspectRatio: "4 / 5" }}>
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
                          src={pages[currentPage]?.image}
                          alt="Story illustration"
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
                          <p className={cuteTextStyle}>
                            {pages[currentPage]?.text}
                          </p>
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
                            style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
                            initial={{ rotateY: 0 }}
                            animate={{ rotateY: -180 }}
                            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                            onAnimationComplete={onFlipComplete}
                          >
                            <div className="absolute inset-0 bg-white border-l border-stone-200 flex items-center justify-center p-4 md:p-10"
                                 style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                              <div className="bg-[#F8F9FA]/80 backdrop-blur-sm rounded-xl md:rounded-[1.5rem] p-4 md:p-8 w-full border border-stone-100/50 shadow-sm">
                                <p className={cuteTextStyle}>{pages[currentPage].text}</p>
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-[#FFF9F0] flex items-center justify-center p-4 md:p-8"
                                 style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                              <img src={pages[currentPage + 1]?.image} className="w-full h-full object-contain rounded-xl shadow-sm" alt="" />
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            className="absolute left-0 w-1/2 h-full"
                            style={{ transformOrigin: "right center", transformStyle: "preserve-3d" }}
                            initial={{ rotateY: 0 }}
                            animate={{ rotateY: 180 }}
                            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                            onAnimationComplete={onFlipComplete}
                          >
                            <div className="absolute inset-0 bg-[#FFF9F0] flex items-center justify-center p-4 md:p-8 border-r border-stone-200"
                                 style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                              <img src={pages[currentPage].image} className="w-full h-full object-contain rounded-xl shadow-sm" alt="" />
                            </div>
                            <div className="absolute inset-0 bg-white flex items-center justify-center p-4 md:p-10"
                                 style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(-180deg)" }}>
                              <div className="bg-[#F8F9FA]/80 backdrop-blur-sm rounded-xl md:rounded-[1.5rem] p-4 md:p-8 w-full border border-stone-100/50 shadow-sm">
                                <p className={cuteTextStyle}>{pages[currentPage - 1]?.text}</p>
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
            <div className="flex flex-col md:flex-row gap-3 md:gap-0 items-stretch md:items-center justify-between bg-white px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] shadow-xl border border-stone-100">
              {/* 左侧：翻页导航和页码 */}
              <div className="flex items-center justify-between md:justify-start gap-4">
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
                  <span className="text-stone-800">{currentPage + 1}</span> / {pages.length}
                </div>
              </div>

              {/* 中间：播放与语音控制（桌面端） */}
              <div className="hidden md:flex items-center gap-3">
                <Button variant="outline" size="icon" className="rounded-full border-stone-200 text-stone-500 hover:text-stone-800">
                  <Volume2 className="w-4 h-4" />
                </Button>
                <Button
                  className="bg-coral hover:bg-coral/90 text-white rounded-full px-8 font-semibold shadow-lg shadow-coral/20 transition-all active:scale-95"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={isFlipping}
                >
                  {isPlaying ? (
                    <><Pause className="w-4 h-4 mr-2 fill-current" /> 暂停展示</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2 fill-current" /> 自动播放</>
                  )}
                </Button>
              </div>

              {/* 移动端：播放和创作按钮 */}
              <div className="flex md:hidden items-center gap-2">
                <Button variant="outline" size="icon" className="rounded-full border-stone-200 text-stone-500 hover:text-stone-800 h-10 w-10">
                  <Volume2 className="w-4 h-4" />
                </Button>
                <Button
                  className="bg-coral hover:bg-coral/90 text-white rounded-full px-6 font-semibold shadow-lg shadow-coral/20 transition-all active:scale-95 flex-1"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={isFlipping}
                >
                  {isPlaying ? (
                    <><Pause className="w-4 h-4 mr-2 fill-current" /> 暂停</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2 fill-current" /> 播放</>
                  )}
                </Button>
                <Link href="/create" className="flex-1">
                  <Button className="bg-mint hover:bg-mint/90 text-white rounded-full px-6 font-semibold shadow-lg shadow-mint/20 w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    创作
                  </Button>
                </Link>
              </div>

              {/* 右侧：创作按钮（桌面端） */}
              <Link href="/create" className="hidden md:block">
                <Button className="bg-mint hover:bg-mint/90 text-white rounded-full px-6 font-semibold shadow-lg shadow-mint/20">
                  <Sparkles className="w-4 h-4 mr-2" />
                  立即创作
                </Button>
              </Link>
            </div>

            {/* 键盘提示 - 仅桌面显示 */}
            <p className="hidden md:block text-center text-xs font-medium text-stone-400 tracking-wide">
              提示：使用键盘 <kbd className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200">←</kbd> <kbd className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200">→</kbd> 方向键翻页
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}