/**
 * DemoSection 组件 - 可爱文字优化版
 * 1. 将绘本右侧的文字修改为可爱的渐变色风格
 * 2. 增加了字体权重和轻微的投影，使渐变文字更突出
 * 3. 保持所有动画逻辑、图片数据和控制功能不变
 */

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
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

export default function DemoSection() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);

  const pages = [
    { text: "从前，在一片神奇的森林里，住着一只勇敢的小兔子，它的名字叫小白。", image: "/images/demo-page-1.png" },
    { text: "小白有一双明亮的眼睛和一颗善良的心。它最喜欢在森林里探险，寻找新朋友。", image: "/images/demo-page-2.png" },
    { text: "一天，小白听说森林深处有一朵神奇的七色花，能实现一个愿望。它决定去寻找这朵花。", image: "/images/demo-page-3.png" },
    { text: "在路上，小白遇到了迷路的小松鼠。'别担心，我带你回家！'小白说。", image: "/images/demo-page-4.png" },
    { text: "送完小松鼠后，小白继续前进。它穿过了彩虹桥，来到了花的所在地。", image: "/images/demo-page-5.png" },
    { text: "七色花真的在那里！小白许下了愿望：'希望森林里的小动物们都能快乐！'", image: "/images/demo-page-6.png" },
    { text: "从此以后，森林里充满了欢声笑语。小白成为了大家心中的小英雄。", image: "/images/demo-page-7.png" },
  ];

  const handleNext = () => {
    if (isFlipping || currentPage >= pages.length - 1) return;
    setDirection("next");
    setIsFlipping(true);
  };

  const handlePrev = () => {
    if (isFlipping || currentPage <= 0) return;
    setDirection("prev");
    setIsFlipping(true);
  };

  const onFlipComplete = () => {
    if (direction === "next") setCurrentPage(prev => prev + 1);
    if (direction === "prev") setCurrentPage(prev => prev - 1);
    setIsFlipping(false);
    setDirection(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, isFlipping]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      if (currentPage < pages.length - 1) handleNext();
      else setIsPlaying(false);
    }, 4000);
    return () => clearInterval(timer);
  }, [currentPage, isPlaying, isFlipping]);

  // 定义可爱的渐变文字样式类名
  const cuteTextStyle = "text-xl leading-relaxed text-center font-bold bg-gradient-to-br from-coral via-orange-400 to-amber-400 bg-clip-text text-transparent drop-shadow-sm tracking-wide";

  return (
    <section id="demo" className="py-20 bg-[#FDFBF7]">
      <div className="container mx-auto px-4">
        {/* 标题区域 */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 mb-4 border border-orange-200/50">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Online Demo</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-stone-800">
            体验 <span className="text-coral">AI 绘本</span> 的魔力
          </h2>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {/* 阅读器主容器 */}
          <div className="relative flex flex-col gap-6">
            
            {/* 3D 绘本主体 */}
            <div 
              className="relative bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-stone-200" 
              style={{ perspective: "2500px" }}
            >
              <div className="flex w-full" style={{ aspectRatio: "2 / 1" }}>
                {/* 底层左侧 (图片) */}
                <div className="w-1/2 bg-gradient-to-br from-[#FFF9F0] to-[#FFF3E0] relative border-r border-stone-200/60">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <img
                      src={direction === 'prev' ? pages[currentPage - 1]?.image : pages[currentPage]?.image}
                      alt="Left Page"
                      className="w-full h-full object-contain rounded-xl shadow-sm"
                    />
                  </div>
                </div>

                {/* 底层右侧 (文字) - 已应用可爱渐变样式 */}
                <div className="w-1/2 bg-white relative">
                  <div className="absolute inset-0 flex items-center justify-center p-10">
                    <div className="bg-[#F8F9FA]/80 backdrop-blur-sm rounded-[1.5rem] p-8 w-full border border-stone-100/50 shadow-sm">
                      <p className={cuteTextStyle}>
                        {direction === 'next' ? pages[currentPage + 1]?.text : pages[currentPage]?.text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 翻页动画叠加层 */}
              <AnimatePresence initial={false}>
                {isFlipping && (
                  <motion.div
                    key={`flip-${currentPage}-${direction}`}
                    className="absolute inset-0 z-50 flex pointer-events-none"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {direction === "next" ? (
                      // 向后翻页动画
                      <motion.div
                        className="absolute right-0 w-1/2 h-full"
                        style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: -180 }}
                        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                        onAnimationComplete={onFlipComplete}
                      >
                        {/* 翻转面正面 (当前文字) - 已应用可爱渐变样式 */}
                        <div className="absolute inset-0 bg-white border-l border-stone-200 flex items-center justify-center p-10"
                             style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                          <div className="bg-[#F8F9FA]/80 backdrop-blur-sm rounded-[1.5rem] p-8 w-full border border-stone-100/50 shadow-sm">
                            <p className={cuteTextStyle}>{pages[currentPage].text}</p>
                          </div>
                        </div>
                        {/* 翻转面背面 (下一张图片) */}
                        <div className="absolute inset-0 bg-[#FFF9F0] flex items-center justify-center p-8"
                             style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                          <img src={pages[currentPage + 1]?.image} className="w-full h-full object-contain rounded-xl shadow-sm" alt="" />
                        </div>
                      </motion.div>
                    ) : (
                      // 向前翻页动画
                      <motion.div
                        className="absolute left-0 w-1/2 h-full"
                        style={{ transformOrigin: "right center", transformStyle: "preserve-3d" }}
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: 180 }}
                        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                        onAnimationComplete={onFlipComplete}
                      >
                        {/* 翻转面正面 (当前图片) */}
                        <div className="absolute inset-0 bg-[#FFF9F0] flex items-center justify-center p-8 border-r border-stone-200"
                             style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                          <img src={pages[currentPage].image} className="w-full h-full object-contain rounded-xl shadow-sm" alt="" />
                        </div>
                        {/* 翻转面背面 (上一页文字) - 已应用可爱渐变样式 */}
                        <div className="absolute inset-0 bg-white flex items-center justify-center p-10"
                             style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(-180deg)" }}>
                          <div className="bg-[#F8F9FA]/80 backdrop-blur-sm rounded-[1.5rem] p-8 w-full border border-stone-100/50 shadow-sm">
                            <p className={cuteTextStyle}>{pages[currentPage - 1]?.text}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 书脊中心线 */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-stone-200 z-[60]" />
            </div>

            {/* 控制栏布局 */}
            <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-[1.5rem] shadow-xl border border-stone-100">
              {/* 左侧：翻页导航 */}
              <div className="flex items-center gap-4">
                <div className="flex bg-stone-50 rounded-full p-1 border border-stone-200/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-white hover:shadow-sm"
                    disabled={currentPage === 0 || isFlipping}
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="w-5 h-5 text-stone-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-white hover:shadow-sm"
                    disabled={currentPage === pages.length - 1 || isFlipping}
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-5 h-5 text-stone-600" />
                  </Button>
                </div>
                <div className="text-sm font-bold text-stone-400 tabular-nums">
                  <span className="text-stone-800">{currentPage + 1}</span> / {pages.length}
                </div>
              </div>

              {/* 中间：播放与语音 */}
              <div className="flex items-center gap-3">
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

              {/* 右侧：创作按钮 */}
              <Link href="/create">
                <Button className="bg-mint hover:bg-mint/90 text-white rounded-full px-6 font-semibold shadow-lg shadow-mint/20">
                  <Sparkles className="w-4 h-4 mr-2" />
                  立即创作
                </Button>
              </Link>
            </div>

            <p className="text-center text-xs font-medium text-stone-400 tracking-wide">
              提示：使用键盘 <kbd className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200">←</kbd> <kbd className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200">→</kbd> 方向键翻页
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}