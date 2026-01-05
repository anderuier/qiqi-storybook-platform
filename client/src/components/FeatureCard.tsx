/**
 * FeatureCard 组件 - 功能特色卡片
 * 设计风格：梦幻童话风格
 */

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "coral" | "mint" | "sunny";
  image: string;
  index: number;
}

export default function FeatureCard({ icon: Icon, title, description, color, image, index }: FeatureCardProps) {
  const colorClasses = {
    coral: {
      bg: "bg-coral/10",
      text: "text-coral",
      border: "border-coral/20",
      shadow: "shadow-coral/10"
    },
    mint: {
      bg: "bg-mint/10",
      text: "text-mint",
      border: "border-mint/20",
      shadow: "shadow-mint/10"
    },
    sunny: {
      bg: "bg-sunny/10",
      text: "text-sunny",
      border: "border-sunny/20",
      shadow: "shadow-sunny/10"
    }
  };
  
  const colors = colorClasses[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group relative bg-white rounded-3xl overflow-hidden border ${colors.border} card-shadow-hover`}
    >
      {/* 图片区域 */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
        
        {/* 图标 */}
        <div className={`absolute bottom-4 left-4 w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
