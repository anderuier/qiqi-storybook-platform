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
  Sparkles,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, register, isLoading, error, clearError } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: ""
  });
  const [formError, setFormError] = useState<string | null>(null);

  // 切换登录/注册模式
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormError(null);
    clearError();
  };

  // 表单验证
  const validateForm = (): boolean => {
    setFormError(null);

    if (!formData.email) {
      setFormError("请输入邮箱地址");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError("邮箱格式不正确");
      return false;
    }

    if (!formData.password) {
      setFormError("请输入密码");
      return false;
    }

    if (formData.password.length < 6) {
      setFormError("密码至少需要6位");
      return false;
    }

    if (!isLogin) {
      if (!formData.nickname) {
        setFormError("请输入昵称");
        return false;
      }

      if (formData.nickname.length < 2 || formData.nickname.length > 20) {
        setFormError("昵称需要2-20个字符");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setFormError("两次输入的密码不一致");
        return false;
      }
    }

    return true;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
        });
      }
      // 登录/注册成功，跳转到首页或创作页
      setLocation("/create");
    } catch (err) {
      // 错误已在 AuthContext 中处理
    }
  };

  // 显示的错误信息
  const displayError = formError || error;

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

            {/* 错误提示 */}
            {displayError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                {displayError}
              </motion.div>
            )}

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
                      disabled={isLoading}
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
                    disabled={isLoading}
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
                    placeholder="请输入密码（至少6位）"
                    className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors"
                    disabled={isLoading}
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
                      disabled={isLoading}
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isLogin ? "登录中..." : "注册中..."}
                  </>
                ) : (
                  isLogin ? "登录" : "注册"
                )}
              </Button>
            </form>

            {/* 切换登录/注册 */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "还没有账号？" : "已有账号？"}
              </span>
              <button
                onClick={toggleMode}
                className="text-coral font-medium hover:underline ml-1"
                disabled={isLoading}
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
                <Button variant="outline" className="rounded-xl py-5" disabled>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
                  Google
                </Button>
                <Button variant="outline" className="rounded-xl py-5" disabled>
                  <img src="https://www.svgrepo.com/show/448234/wechat.svg" alt="微信" className="w-5 h-5 mr-2" />
                  微信
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">
                第三方登录即将上线
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
