/**
 * AboutSection 组件 - 关于我们
 * 设计风格：梦幻童话风格
 */

import { motion } from "framer-motion";
import {
  Heart,
  Target,
  Users,
  Sparkles,
  BookOpen,
  Star,
  Shield,
  Award
} from "lucide-react";

// 团队价值观
const values = [
  {
    icon: Heart,
    title: "用爱创作",
    description: "每一个绘本都承载着父母对孩子的爱，我们用心打造每一个功能",
    color: "coral"
  },
  {
    icon: Shield,
    title: "安全可靠",
    description: "严格的内容审核机制，确保生成的故事适合儿童阅读",
    color: "mint"
  },
  {
    icon: Sparkles,
    title: "创意无限",
    description: "AI技术赋能创作，让每个家庭都能创作出独一无二的故事",
    color: "sunny"
  },
  {
    icon: Users,
    title: "家庭陪伴",
    description: "促进亲子互动，让绘本成为家庭温馨时光的美好载体",
    color: "coral"
  }
];

// 里程碑数据
const milestones = [
  { number: "5,000+", label: "绘本已创作", icon: BookOpen },
  { number: "1,000+", label: "幸福家庭", icon: Users },
  { number: "20+", label: "艺术风格", icon: Star },
  { number: "99%", label: "好评率", icon: Award }
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-gradient-to-b from-mint/5 to-background">
      <div className="container">
        {/* 标题区域 */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sunny/10 text-sunny mb-4">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">关于我们</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            用<span className="text-coral">AI和爱</span>，为孩子创造美好童年
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            柒柒の魔法绘本屋致力于帮助父母创作专属自己宝贝的绘本故事，让您的亲子时光更加温馨美好
          </p>
        </motion.div>

        {/* 品牌故事 */}
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* 左侧图片 */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-coral/20 to-mint/20">
              <img
                src="/images/about-story.png"
                alt="亲子阅读场景"
                className="w-full h-full object-cover"
              />
            </div>
            {/* 装饰元素 */}
            <motion.div
              className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-lg border border-border/50"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-coral fill-coral" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-coral">99%</div>
                  <div className="text-xs text-muted-foreground">家长满意度</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 右侧文字 */}
          <div>
            <h3 className="text-2xl font-bold mb-6">我们的故事</h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                柒柒の魔法绘本屋诞生于一个简单的愿望：让每个孩子都能拥有属于自己的童话故事。
              </p>
              <p>
                我们相信，最好的故事来自于爱。当AI技术与父母的爱相结合，就能创造出独一无二的绘本作品。
                无论是将古诗词改编成有趣的故事，还是用爸爸妈妈的声音讲述睡前故事，
                我们都希望能让这份爱以最美好的方式传递给孩子。
              </p>
              <p>
                我们的使命是让绘本创作变得简单有趣，让每个家庭都能享受创作的乐趣，
                让每个孩子都能在专属的故事中感受到父母的爱与陪伴。
              </p>
            </div>

            {/* 使命愿景 */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-coral/5 rounded-2xl p-4">
                <Target className="w-8 h-8 text-coral mb-2" />
                <h4 className="font-semibold mb-1">我们的使命</h4>
                <p className="text-sm text-muted-foreground">
                  让每个家庭都能创作专属绘本
                </p>
              </div>
              <div className="bg-mint/5 rounded-2xl p-4">
                <Sparkles className="w-8 h-8 text-mint mb-2" />
                <h4 className="font-semibold mb-1">我们的愿景</h4>
                <p className="text-sm text-muted-foreground">
                  成为家庭创意内容的首选平台
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 核心价值观 */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-center mb-10">我们的价值观</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
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
              const colors = colorClasses[value.color as keyof typeof colorClasses];

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`bg-white rounded-2xl p-6 border ${colors.border} card-shadow-hover text-center`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <h4 className="font-bold mb-2">{value.title}</h4>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 数据里程碑 */}
        <motion.div
          className="bg-gradient-to-r from-coral/10 via-mint/10 to-sunny/10 rounded-3xl p-8 md:p-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-center mb-10">我们的成长</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {milestones.map((item, index) => {
              const Icon = item.icon;
              const colors = ["text-coral", "text-mint", "text-sunny", "text-coral"];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="text-center"
                >
                  <Icon className={`w-8 h-8 ${colors[index]} mx-auto mb-3`} />
                  <div className={`text-3xl md:text-4xl font-bold ${colors[index]} mb-1`}>
                    {item.number}
                  </div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
