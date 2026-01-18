/**
 * 联系我们页面
 * 设计风格：梦幻童话风格
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  Clock,
  Heart
} from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// 联系方式
const contactInfo = [
  {
    icon: Mail,
    title: "邮箱",
    content: "hello@storybook.ai",
    description: "工作日24小时内回复",
    color: "coral"
  },
  {
    icon: Phone,
    title: "电话",
    content: "400-888-8888",
    description: "周一至周五 9:00-18:00",
    color: "mint"
  },
  {
    icon: MapPin,
    title: "地址",
    content: "北京市海淀区中关村科技园",
    description: "欢迎来访交流",
    color: "sunny"
  }
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: 实现表单提交逻辑
    setTimeout(() => {
      alert("感谢您的留言！我们会尽快回复您。");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          {/* 页面标题 */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral mb-4">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">联系我们</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              我们很乐意<span className="text-mint">听到您的声音</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              有任何问题、建议或合作意向，都欢迎与我们联系
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* 联系方式卡片 */}
            <motion.div
              className="lg:col-span-1 space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                const colorClasses = {
                  coral: "bg-coral/10 text-coral",
                  mint: "bg-mint/10 text-mint",
                  sunny: "bg-sunny/10 text-sunny"
                };
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 border border-border/50 card-shadow-hover"
                  >
                    <div className={`w-12 h-12 rounded-xl ${colorClasses[info.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold mb-1">{info.title}</h3>
                    <p className="text-foreground mb-1">{info.content}</p>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </div>
                );
              })}

              {/* 工作时间 */}
              <div className="bg-gradient-to-br from-coral/10 to-mint/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-coral" />
                  <h3 className="font-semibold">工作时间</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">周一至周五</span>
                    <span>9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">周六</span>
                    <span>10:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">周日</span>
                    <span className="text-muted-foreground">休息</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 联系表单 */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white rounded-3xl p-8 border border-border/50 shadow-lg">
                <h2 className="text-xl font-bold mb-6">发送消息</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* 姓名 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        您的姓名 <span className="text-coral">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="请输入姓名"
                        className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors"
                      />
                    </div>

                    {/* 邮箱 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        邮箱地址 <span className="text-coral">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="请输入邮箱"
                        className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* 主题 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      主题 <span className="text-coral">*</span>
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors bg-white"
                    >
                      <option value="">请选择主题</option>
                      <option value="general">一般咨询</option>
                      <option value="technical">技术支持</option>
                      <option value="business">商务合作</option>
                      <option value="feedback">意见反馈</option>
                      <option value="other">其他</option>
                    </select>
                  </div>

                  {/* 消息内容 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      消息内容 <span className="text-coral">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="请详细描述您的问题或建议..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* 提交按钮 */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-coral hover:bg-coral/90 text-white rounded-xl py-6 text-base"
                  >
                    {isSubmitting ? (
                      "发送中..."
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        发送消息
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* 底部提示 */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <Heart className="w-4 h-4 text-coral" />
              <span>我们通常会在24小时内回复您的消息</span>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
