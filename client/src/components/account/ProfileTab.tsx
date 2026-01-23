import { Camera, Save, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 个人资料标签组件
 */
interface ProfileTabProps {
  nickname: string;
  setNickname: (value: string) => void;
  user: {
    nickname?: string;
    email?: string;
    avatar?: string;
    createdAt?: string;
  } | null;
  isSaving: boolean;
  error: string | null;
  saveSuccess: boolean;
  onSave: () => void;
}

export function ProfileTab({
  nickname,
  setNickname,
  user,
  isSaving,
  error,
  saveSuccess,
  onSave,
}: ProfileTabProps) {
  return (
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
              src={user?.avatar || "/images/avatar-default.png"}
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
          onClick={onSave}
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
  );
}
