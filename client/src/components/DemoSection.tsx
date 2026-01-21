/**
 * DemoSection 组件 - 在线演示区域
 * 设计风格：梦幻童话风格
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Volume2,
  Sparkles,
  BookOpen
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function DemoSection() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const pages = [
    {
      text: "从前，在一片神奇的森林里，住着一只勇敢的小兔子，它的名字叫小白。",
      image: "/images/demo-page-1.png"
    },
    {
      text: "小白有一双明亮的眼睛和一颗善良的心。它最喜欢在森林里探险，寻找新朋友。",
      image: "/images/demo-page-2.png"
    },
    {
      text: "一天，小白听说森林深处有一朵神奇的七色花，能实现一个愿望。它决定去寻找这朵花。",
      image: "/images/demo-page-3.png"
    },
    {
      text: "在路上，小白遇到了迷路的小松鼠。'别担心，我带你回家！'小白说。",
      image: "/images/demo-page-4.png"
    },
    {
      text: "送完小松鼠后，小白继续前进。它穿过了彩虹桥，来到了花的所在地。",
      image: "/images/demo-page-5.png"
    },
    {
      text: "七色花真的在那里！小白许下了愿望：'希望森林里的小动物们都能快乐！'",
      image: "/images/demo-page-6.png"
    },
    {
      text: "从此以后，森林里充满了欢声笑语。小白成为了大家心中的小英雄。",
      image: "/images/demo-page-7.png"
    }
  ];
  
  return (
    <section id="demo" className="py-20 bg-sunny/5">
      <div className="container">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sunny/10 text-sunny mb-4">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">在线演示</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            体验<span className="text-coral">AI绘本</span>的魔力
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            这是一个由AI生成的绘本示例，您可以创作任意主题的绘本，并使用自己的声音朗读。
          </p>
        </motion.div>
        
        {/* 绘本预览器 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-coral/10 overflow-hidden border border-border/50">
            {/* 绘本内容 */}
            <div className="relative aspect-[16/10] bg-gradient-to-br from-cream to-mint/10">
              <img 
                src={pages[currentPage].image}
                alt="绘本页面"
                className="w-full h-full object-cover"
              />
              
              {/* 文字覆盖层 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 md:p-8">
                <p className="text-white text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                  {pages[currentPage].text}
                </p>
              </div>
              
              {/* 页码 */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                第 {currentPage + 1} 页 / 共 {pages.length} 页
              </div>
            </div>
            
            {/* 控制栏 */}
            <div className="p-4 md:p-6 bg-white border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* 翻页控制 */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                    {currentPage + 1} / {pages.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    disabled={currentPage === pages.length - 1}
                    onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* 播放控制 */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>
                  <Button
                    className="bg-coral hover:bg-coral/90 text-white rounded-full px-4 sm:px-6"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 sm:mr-2" />
                        <span className="hidden sm:inline">暂停朗读</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 sm:mr-2" />
                        <span className="hidden sm:inline">开始朗读</span>
                      </>
                    )}
                  </Button>
                  <Link href="/create">
                    <Button className="bg-mint hover:bg-mint/90 text-white rounded-full px-4 sm:px-6">
                      <Sparkles className="w-5 h-5 sm:mr-2" />
                      <span className="hidden sm:inline">创作类似绘本</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
        </motion.div>
      </div>
    </section>
  );
}
