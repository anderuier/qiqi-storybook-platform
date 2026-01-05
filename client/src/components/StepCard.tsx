/**
 * StepCard 组件 - 步骤卡片
 * 设计风格：梦幻童话风格
 */

import { motion } from "framer-motion";

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  color: "coral" | "mint" | "sunny";
  index: number;
}

export default function StepCard({ number, title, description, color, index }: StepCardProps) {
  const colorClasses = {
    coral: {
      bg: "bg-coral",
      light: "bg-coral/10",
      text: "text-coral"
    },
    mint: {
      bg: "bg-mint",
      light: "bg-mint/10",
      text: "text-mint"
    },
    sunny: {
      bg: "bg-sunny",
      light: "bg-sunny/10",
      text: "text-sunny"
    }
  };
  
  const colors = colorClasses[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group relative bg-white rounded-2xl p-6 border border-border/50 card-shadow-hover"
    >
      {/* 步骤编号 */}
      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
        <span className="text-white font-bold">{number}</span>
      </div>
      
      {/* 内容 */}
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      
      {/* 装饰性连接线 */}
      {index < 5 && (
        <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-border" />
      )}
    </motion.div>
  );
}
