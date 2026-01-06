/**
 * 登录/注册页面
 * 设计风格：梦幻童话风格
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  BookOpen,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 实现登录/注册逻辑
    alert(isLogin ? "登录功能即将上线！" : "注册功能即将上线！");
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-coral/10 via-mint/5 to-sunny/10">
      {/* 左侧装饰区域 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-coral/20 to-mint/20" />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-8">
              <BookOpen className="w-10 h-10 text-coral" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              童话绘本工坊
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              用AI和爱为3-6岁学龄前儿童创作独一无二的个性化绘本
            </p>
          </motion.div>

          {/* 装饰图片 */}
          <motion.div
            className="mt-12 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img
              src="/images/hero-illustration.png"
              alt="绘本插图"
              className="w-80 h-auto rounded-3xl shadow-2xl"
            />
            <motion.div
              className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sunny" />
                <span className="font-semibold">10,000+ 绘本已创作</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* 右侧表单区域 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 返回首页 */}
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>

          {/* Logo (移动端显示) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-coral/80 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">童话绘本工坊</span>
          </div>

          {/* 表单卡片 */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-border/50">
            <h2 className="text-2xl font-bold mb-2">
              {isLogin ? "欢迎回来" : "创建账号"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isLogin ? "登录您的账号，继续创作之旅" : "注册账号，开始您的创作之旅"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 昵称 (仅注册) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2">昵称</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="给自己取个名字吧"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* 邮箱 */}
              <div>
                <label className="block text-sm font-medium mb-2">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="请输入邮箱地址"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 密码 */}
              <div>
                <label className="block text-sm font-medium mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="请输入密码"
                    className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* 确认密码 (仅注册) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2">确认密码</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="请再次输入密码"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* 忘记密码 (仅登录) */}
              {isLogin && (
                <div className="text-right">
                  <a href="#" className="text-sm text-coral hover:underline">
                    忘记密码？
                  </a>
                </div>
              )}

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full bg-coral hover:bg-coral/90 text-white rounded-xl py-6 text-base"
              >
                {isLogin ? "登录" : "注册"}
              </Button>
            </form>

            {/* 切换登录/注册 */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "还没有账号？" : "已有账号？"}
              </span>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-coral font-medium hover:underline ml-1"
              >
                {isLogin ? "立即注册" : "立即登录"}
              </button>
            </div>

            {/* 第三方登录 */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-muted-foreground">或</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <Button variant="outline" className="rounded-xl py-5">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
                  Google
                </Button>
                <Button variant="outline" className="rounded-xl py-5">
                  <img src="https://www.svgrepo.com/show/448234/wechat.svg" alt="微信" className="w-5 h-5 mr-2" />
                  微信
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
