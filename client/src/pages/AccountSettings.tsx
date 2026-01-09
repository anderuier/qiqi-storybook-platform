/**
 * 账户设置页面
 * 设计风格：梦幻童话风格
 * 已对接后端 API
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Camera,
  Save,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

// 设置分类
const settingsTabs = [
  { id: "profile", label: "个人资料", icon: User },
  { id: "security", label: "账户安全", icon: Lock },
  { id: "notifications", label: "通知设置", icon: Bell },
  { id: "preferences", label: "偏好设置", icon: Palette },
];

export default function AccountSettings() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, updateProfile, changePassword, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 个人资料表单
  const [nickname, setNickname] = useState("");

  // 密码表单
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 通知设置
  const [notifications, setNotifications] = useState({
    newFeatures: true,
    weeklyDigest: true,
    comments: true,
    likes: false
  });

  // 偏好设置
  const [preferences, setPreferences] = useState({
    defaultStyle: "watercolor",
    defaultVoice: "female",
    autoSave: true
  });

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || "");
    }
  }, [user]);

  // 保存个人资料
  const handleSaveProfile = async () => {
    if (!nickname.trim()) {
      setError("昵称不能为空");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await updateProfile({ nickname: nickname.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!passwordForm.oldPassword) {
      setPasswordError("请输入当前密码");
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError("请输入新密码");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("新密码至少需要6位");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("两次输入的密码不一致");
      return;
    }

    setIsSaving(true);

    try {
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || "密码修改失败");
    } finally {
      setIsSaving(false);
    }
  };

  // 退出登录
  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  // 加载中显示
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          {/* 页面标题 */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 text-mint mb-4">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">账户设置</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              管理您的<span className="text-coral">账户</span>
            </h1>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* 侧边栏 */}
            <motion.div
              className="md:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="bg-white rounded-2xl border border-border/50 p-2">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-coral/10 text-coral"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}

                {/* 退出登录按钮 */}
                <div className="border-t border-border mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 内容区域 */}
            <motion.div
              className="md:col-span-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl border border-border/50 p-6">
                {/* 个人资料 */}
                {activeTab === "profile" && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">个人资料</h2>

                    {/* 错误/成功提示 */}
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                      </div>
                    )}
                    {saveSuccess && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        保存成功
                      </div>
                    )}

                    {/* 头像 */}
                    <div className="flex items-center gap-6 mb-8">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-coral to-mint overflow-hidden">
                          <img
                            src={user?.avatar || "/images/default-avatar.png"}
                            alt="头像"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center shadow-lg hover:bg-coral/90 transition-colors">
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <h3 className="font-semibold">{user?.nickname || "用户"}</h3>
                        <p className="text-sm text-muted-foreground">
                          点击相机图标更换头像
                        </p>
                      </div>
                    </div>

                    {/* 表单 */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium mb-2">昵称</label>
                        <input
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">邮箱</label>
                        <input
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-muted text-muted-foreground"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          邮箱暂不支持修改
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">注册时间</label>
                        <input
                          type="text"
                          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : ""}
                          disabled
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-muted text-muted-foreground"
                        />
                      </div>
                    </div>

                    {/* 保存按钮 */}
                    <div className="mt-8 pt-6 border-t border-border flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-coral hover:bg-coral/90 text-white rounded-full px-8"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            保存中...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            保存设置
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* 账户安全 */}
                {activeTab === "security" && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">账户安全</h2>

                    <div className="space-y-6">
                      {/* 修改密码 */}
                      <div className="p-5 rounded-xl border border-border/50 bg-muted/30">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-coral" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">登录密码</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              定期更换密码可以提高账户安全性
                            </p>

                            {/* 密码错误/成功提示 */}
                            {passwordError && (
                              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {passwordError}
                              </div>
                            )}
                            {passwordSuccess && (
                              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                密码修改成功
                              </div>
                            )}

                            <div className="space-y-3">
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="当前密码"
                                  value={passwordForm.oldPassword}
                                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                  className="w-full px-4 py-2 rounded-lg border border-border focus:border-coral focus:outline-none pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="新密码（至少6位）"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-border focus:border-coral focus:outline-none"
                              />
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="确认新密码"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-border focus:border-coral focus:outline-none"
                              />
                              <Button
                                onClick={handleChangePassword}
                                disabled={isSaving}
                                size="sm"
                                className="bg-coral hover:bg-coral/90 text-white rounded-full"
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    修改中...
                                  </>
                                ) : (
                                  "修改密码"
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 两步验证 */}
                      <div className="p-5 rounded-xl border border-border/50 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center">
                              <Shield className="w-5 h-5 text-mint" />
                            </div>
                            <div>
                              <h3 className="font-semibold mb-1">两步验证</h3>
                              <p className="text-sm text-muted-foreground">
                                开启后登录时需要输入手机验证码
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="rounded-full" disabled>
                            即将上线
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 通知设置 */}
                {activeTab === "notifications" && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">通知设置</h2>

                    <div className="space-y-4">
                      {[
                        { key: "newFeatures", label: "新功能通知", desc: "当有新功能上线时通知我" },
                        { key: "weeklyDigest", label: "每周精选", desc: "每周发送精选绘本作品" },
                        { key: "comments", label: "评论通知", desc: "当有人评论我的作品时通知我" },
                        { key: "likes", label: "点赞通知", desc: "当有人点赞我的作品时通知我" },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-4 rounded-xl border border-border/50"
                        >
                          <div>
                            <h3 className="font-medium">{item.label}</h3>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                          <button
                            onClick={() =>
                              setNotifications({
                                ...notifications,
                                [item.key]: !notifications[item.key as keyof typeof notifications]
                              })
                            }
                            className={`w-12 h-6 rounded-full transition-colors ${
                              notifications[item.key as keyof typeof notifications]
                                ? "bg-mint"
                                : "bg-muted"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                notifications[item.key as keyof typeof notifications]
                                  ? "translate-x-6"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground mt-4">
                      通知功能即将上线，敬请期待
                    </p>
                  </div>
                )}

                {/* 偏好设置 */}
                {activeTab === "preferences" && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">偏好设置</h2>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium mb-2">默认艺术风格</label>
                        <select
                          value={preferences.defaultStyle}
                          onChange={(e) => setPreferences({ ...preferences, defaultStyle: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none bg-white"
                        >
                          <option value="watercolor">水彩手绘</option>
                          <option value="cartoon">卡通动漫</option>
                          <option value="crayon">蜡笔涂鸦</option>
                          <option value="3d">3D渲染</option>
                          <option value="flat">扁平插画</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">默认朗读语音</label>
                        <select
                          value={preferences.defaultVoice}
                          onChange={(e) => setPreferences({ ...preferences, defaultVoice: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none bg-white"
                        >
                          <option value="female">温柔女声</option>
                          <option value="male">温暖男声</option>
                          <option value="child">童声朗读</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                        <div>
                          <h3 className="font-medium">自动保存草稿</h3>
                          <p className="text-sm text-muted-foreground">创作过程中自动保存</p>
                        </div>
                        <button
                          onClick={() => setPreferences({ ...preferences, autoSave: !preferences.autoSave })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            preferences.autoSave ? "bg-mint" : "bg-muted"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                              preferences.autoSave ? "translate-x-6" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mt-4">
                      偏好设置功能即将上线，敬请期待
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
