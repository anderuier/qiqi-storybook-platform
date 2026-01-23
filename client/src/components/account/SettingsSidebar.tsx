import { memo } from "react";
import { User, Lock, Bell, Palette, LogOut } from "lucide-react";

/**
 * 设置标签配置
 */
export const settingsTabs = [
  { id: "profile", label: "个人资料", icon: User },
  { id: "security", label: "账户安全", icon: Lock },
  { id: "notifications", label: "通知设置", icon: Bell },
  { id: "preferences", label: "偏好设置", icon: Palette },
] as const;

export type SettingsTabId = typeof settingsTabs[number]["id"];

/**
 * 侧边栏导航组件
 */
interface SettingsSidebarProps {
  activeTab: SettingsTabId;
  onTabChange: (tabId: SettingsTabId) => void;
  onLogout: () => void;
}

export const SettingsSidebar = memo(function SettingsSidebar({ activeTab, onTabChange, onLogout }: SettingsSidebarProps) {
  return (
    <div className="bg-white rounded-2xl border border-border/50 p-2">
      {settingsTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </div>
  );
});
