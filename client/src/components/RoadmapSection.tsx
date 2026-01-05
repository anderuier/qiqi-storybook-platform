/**
 * RoadmapSection 组件 - 发展路线图
 * 设计风格：梦幻童话风格
 */

import { motion } from "framer-motion";
import { 
  Rocket, 
  Target,
  Zap,
  Users,
  Globe,
  Smartphone,
  GraduationCap,
  Check,
  Clock
} from "lucide-react";

export default function RoadmapSection() {
  const phases = [
    {
      phase: "第一阶段",
      title: "MVP上线",
      duration: "3-4周",
      status: "current",
      color: "coral",
      items: [
        "核心创作向导UI",
        "付费API集成",
        "主题故事生成",
        "单一风格图片生成",
        "标准音色库朗读"
      ]
    },
    {
      phase: "第二阶段",
      title: "核心功能增强",
      duration: "4-6周",
      status: "upcoming",
      color: "mint",
      items: [
        "语音克隆功能",
        "多样化艺术风格",
        "用户注册登录",
        "作品保存管理"
      ]
    },
    {
      phase: "第三阶段",
      title: "高级功能",
      duration: "4-6周",
      status: "upcoming",
      color: "sunny",
      items: [
        "角色一致性优化",
        "开源方案迁移",
        "社区分享功能",
        "成本优化"
      ]
    },
    {
      phase: "第四阶段",
      title: "长期发展",
      duration: "持续迭代",
      status: "future",
      color: "coral",
      items: [
        "多语言支持",
        "移动端App",
        "教育机构合作",
        "打印服务集成"
      ]
    }
  ];
  
  return (
    <section id="roadmap" className="py-20 bg-coral/5">
      <div className="container">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral mb-4">
            <Rocket className="w-4 h-4" />
            <span className="text-sm font-medium">发展规划</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            产品<span className="text-mint">发展路线图</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            分阶段实施，快速验证核心价值，逐步完善产品功能
          </p>
        </motion.div>
        
        {/* 时间线 */}
        <div className="relative">
          {/* 连接线 */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-border" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((phase, index) => {
              const colorClasses = {
                coral: {
                  bg: "bg-coral",
                  light: "bg-coral/10",
                  text: "text-coral",
                  border: "border-coral/20"
                },
                mint: {
                  bg: "bg-mint",
                  light: "bg-mint/10",
                  text: "text-mint",
                  border: "border-mint/20"
                },
                sunny: {
                  bg: "bg-sunny",
                  light: "bg-sunny/10",
                  text: "text-sunny",
                  border: "border-sunny/20"
                }
              };
              
              const colors = colorClasses[phase.color as keyof typeof colorClasses];
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* 时间线节点 */}
                  <div className="hidden lg:flex justify-center mb-6">
                    <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center z-10 relative`}>
                      {phase.status === "current" ? (
                        <Zap className="w-6 h-6 text-white" />
                      ) : phase.status === "upcoming" ? (
                        <Target className="w-6 h-6 text-white" />
                      ) : (
                        <Clock className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                  
                  {/* 卡片 */}
                  <div className={`bg-white rounded-2xl p-6 border ${colors.border} card-shadow-hover h-full`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-sm font-medium ${colors.text}`}>{phase.phase}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {phase.duration}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold mb-4">{phase.title}</h3>
                    
                    <ul className="space-y-2">
                      {phase.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className={`w-4 h-4 ${colors.text} mt-0.5 flex-shrink-0`} />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {phase.status === "current" && (
                      <div className={`mt-4 ${colors.light} rounded-lg p-2 text-center`}>
                        <span className={`text-xs font-medium ${colors.text}`}>当前阶段</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* 长期愿景 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-gradient-to-r from-coral/10 via-mint/10 to-sunny/10 rounded-3xl p-8 md:p-12"
        >
          <h3 className="text-2xl font-bold mb-6 text-center">长期愿景</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-coral/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-coral" />
              </div>
              <h4 className="font-semibold mb-2">全球化</h4>
              <p className="text-sm text-muted-foreground">
                支持多语言内容生成，让全球家庭都能使用
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-mint/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-mint" />
              </div>
              <h4 className="font-semibold mb-2">全平台</h4>
              <p className="text-sm text-muted-foreground">
                开发iOS和Android原生应用，随时随地创作
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-sunny/10 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-sunny" />
              </div>
              <h4 className="font-semibold mb-2">教育生态</h4>
              <p className="text-sm text-muted-foreground">
                与幼儿园、早教机构合作，打造教育内容生态
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
