import { memo } from "react";

/**
 * 偏好设置状态
 */
export interface PreferencesState {
  defaultStyle: string;
  defaultVoice: string;
  autoSave: boolean;
}

/**
 * 偏好设置标签组件
 */
interface PreferencesTabProps {
  preferences: PreferencesState;
  setPreferences: (state: PreferencesState | ((prev: PreferencesState) => PreferencesState)) => void;
}

export const PreferencesTab = memo(function PreferencesTab({ preferences, setPreferences }: PreferencesTabProps) {
  return (
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
  );
});
