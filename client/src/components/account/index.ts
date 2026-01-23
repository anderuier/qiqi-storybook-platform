/**
 * 账户设置页面子组件
 * 将 AccountSettings.tsx 拆分为更小的组件，提升可维护性
 */

export { SettingsSidebar, settingsTabs } from "./SettingsSidebar";
export type { SettingsTabId } from "./SettingsSidebar";

export { ProfileTab } from "./ProfileTab";

export { SecurityTab } from "./SecurityTab";
export type { PasswordForm } from "./SecurityTab";

export { NotificationsTab } from "./NotificationsTab";
export type { NotificationsState } from "./NotificationsTab";

export { PreferencesTab } from "./PreferencesTab";
export type { PreferencesState } from "./PreferencesTab";
