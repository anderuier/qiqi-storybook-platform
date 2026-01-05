/**
 * TechSection 组件 - 技术架构展示
 * 设计风格：梦幻童话风格
 */

import { motion } from "framer-motion";
import { 
  Server, 
  Database, 
  Cpu, 
  Cloud,
  Code,
  Layers,
  Zap,
  Shield
} from "lucide-react";

export default function TechSection() {
  const techStack = {
    frontend: [
      { name: "React 19", desc: "UI框架" },
      { name: "Next.js 15", desc: "应用框架" },
      { name: "TypeScript", desc: "类型安全" },
      { name: "Tailwind CSS", desc: "样式方案" }
    ],
    backend: [
      { name: "Node.js", desc: "运行时" },
      { name: "NestJS", desc: "业务框架" },
      { name: "FastAPI", desc: "AI服务" },
      { name: "Celery", desc: "任务队列" }
    ],
    ai: [
      { name: "GPT-4 / Llama", desc: "文本生成" },
      { name: "DALL-E / SD3", desc: "图像生成" },
      { name: "ElevenLabs", desc: "语音克隆" },
      { name: "OpenVoice", desc: "开源TTS" }
    ],
    infra: [
      { name: "PostgreSQL", desc: "数据库" },
      { name: "AWS S3", desc: "对象存储" },
      { name: "Kubernetes", desc: "容器编排" },
      { name: "GPU Cloud", desc: "AI算力" }
    ]
  };
  
  const architectureNodes = [
    { id: "user", label: "用户浏览器", icon: Code, x: 10, y: 50, color: "coral" },
    { id: "frontend", label: "前端应用", icon: Layers, x: 30, y: 50, color: "mint" },
    { id: "gateway", label: "API网关", icon: Shield, x: 50, y: 30, color: "sunny" },
    { id: "business", label: "业务服务", icon: Server, x: 50, y: 70, color: "sunny" },
    { id: "ai", label: "AI服务", icon: Cpu, x: 70, y: 50, color: "coral" },
    { id: "storage", label: "数据存储", icon: Database, x: 90, y: 50, color: "mint" }
  ];
  
  return (
    <section id="tech" className="py-20 bg-background">
      <div className="container">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral mb-4">
            <Cpu className="w-4 h-4" />
            <span className="text-sm font-medium">技术架构</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-mint">现代化</span>技术栈驱动
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            采用业界领先的技术方案，确保产品的稳定性、可扩展性和用户体验
          </p>
        </motion.div>
        
        {/* 架构图 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-border/50">
            <h3 className="text-xl font-bold mb-6 text-center">系统架构图</h3>
            
            {/* 简化的架构图 */}
            <div className="relative h-64 md:h-80">
              {/* 连接线 */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                  </marker>
                </defs>
                {/* 用户 -> 前端 */}
                <line x1="18%" y1="50%" x2="28%" y2="50%" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                {/* 前端 -> 网关 */}
                <line x1="38%" y1="45%" x2="48%" y2="35%" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                {/* 前端 -> 业务 */}
                <line x1="38%" y1="55%" x2="48%" y2="65%" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                {/* 网关 -> AI */}
                <line x1="58%" y1="30%" x2="68%" y2="45%" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                {/* 业务 -> AI */}
                <line x1="58%" y1="70%" x2="68%" y2="55%" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                {/* AI -> 存储 */}
                <line x1="78%" y1="50%" x2="88%" y2="50%" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
              </svg>
              
              {/* 节点 */}
              {architectureNodes.map((node, index) => {
                const Icon = node.icon;
                const colorClasses = {
                  coral: "bg-coral/10 border-coral/30 text-coral",
                  mint: "bg-mint/10 border-mint/30 text-mint",
                  sunny: "bg-sunny/10 border-sunny/30 text-sunny"
                };
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${colorClasses[node.color as keyof typeof colorClasses]} border-2 rounded-2xl p-3 md:p-4 text-center`}
                    style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: 1 }}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-xs md:text-sm font-medium whitespace-nowrap">{node.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
        
        {/* 技术栈详情 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TechCard 
            title="前端技术" 
            icon={Code} 
            items={techStack.frontend} 
            color="coral"
            index={0}
          />
          <TechCard 
            title="后端技术" 
            icon={Server} 
            items={techStack.backend} 
            color="mint"
            index={1}
          />
          <TechCard 
            title="AI服务" 
            icon={Cpu} 
            items={techStack.ai} 
            color="sunny"
            index={2}
          />
          <TechCard 
            title="基础设施" 
            icon={Cloud} 
            items={techStack.infra} 
            color="coral"
            index={3}
          />
        </div>
      </div>
    </section>
  );
}

interface TechCardProps {
  title: string;
  icon: React.ElementType;
  items: { name: string; desc: string }[];
  color: "coral" | "mint" | "sunny";
  index: number;
}

function TechCard({ title, icon: Icon, items, color, index }: TechCardProps) {
  const colorClasses = {
    coral: {
      bg: "bg-coral/10",
      text: "text-coral",
      border: "border-coral/20"
    },
    mint: {
      bg: "bg-mint/10",
      text: "text-mint",
      border: "border-mint/20"
    },
    sunny: {
      bg: "bg-sunny/10",
      text: "text-sunny",
      border: "border-sunny/20"
    }
  };
  
  const colors = colorClasses[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`bg-white rounded-2xl p-6 border ${colors.border} card-shadow-hover`}
    >
      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 ${colors.text}`} />
      </div>
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">{item.desc}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
