/**
 * 账户设置页面
 * 设计风格：梦幻童话风格
 * 已对接后端 API
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Settings,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
// 账户设置子组件
import {
  SettingsSidebar,
  SettingsTabId,
  ProfileTab,
  SecurityTab,
  NotificationsTab,
  PreferencesTab,
  PasswordForm,
} from "@/components/account";

export default function AccountSettings() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, updateProfile, changePassword, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 个人资料表单
  const [nickname, setNickname] = useState("");

  // 密码表单
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
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
              <SettingsSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
              />
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
                  <ProfileTab
                    nickname={nickname}
                    setNickname={setNickname}
                    user={user}
                    isSaving={isSaving}
                    error={error}
                    saveSuccess={saveSuccess}
                    onSave={handleSaveProfile}
                  />
                )}

                {/* 账户安全 */}
                {activeTab === "security" && (
                  <SecurityTab
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    passwordForm={passwordForm}
                    setPasswordForm={setPasswordForm}
                    isSaving={isSaving}
                    passwordError={passwordError}
                    passwordSuccess={passwordSuccess}
                    onChangePassword={handleChangePassword}
                  />
                )}

                {/* 通知设置 */}
                {activeTab === "notifications" && (
                  <NotificationsTab
                    notifications={notifications}
                    setNotifications={setNotifications}
                  />
                )}

                {/* 偏好设置 */}
                {activeTab === "preferences" && (
                  <PreferencesTab
                    preferences={preferences}
                    setPreferences={setPreferences}
                  />
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
