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

export default function DemoSection() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const pages = [
    {
      text: "从前，在一片神奇的森林里，住着一只勇敢的小兔子，它的名字叫小勇。",
      image: "/images/demo-book.png"
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
            这是一个由AI生成的绘本示例，展示了我们平台的创作能力
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
              <div className="flex items-center justify-between">
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
                    className="bg-coral hover:bg-coral/90 text-white rounded-full px-6"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        暂停朗读
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        开始朗读
                      </>
                    )}
                  </Button>
                </div>
                
                {/* 创作按钮 */}
                <Button className="bg-mint hover:bg-mint/90 text-white rounded-full px-6 hidden md:flex">
                  <Sparkles className="w-5 h-5 mr-2" />
                  创作类似绘本
                </Button>
              </div>
            </div>
          </div>
          
          {/* 提示文字 */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            这是一个演示示例。实际产品中，您可以创作任意主题的绘本，并使用自己的声音朗读。
          </p>
        </motion.div>
      </div>
    </section>
  );
}
