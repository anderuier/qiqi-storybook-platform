import { memo } from "react";
import { BookOpen } from "lucide-react";
import { createModes, storyStyles } from "./constants";

/**
 * 步骤1：输入创作信息
 */
export interface InputStepProps {
  childName: string;
  setChildName: (value: string) => void;
  childAge: number;
  setChildAge: (value: number) => void;
  selectedMode: string | null;
  setSelectedMode: (value: string) => void;
  storyInput: string;
  setStoryInput: (value: string) => void;
  selectedStoryStyle: string;
  setSelectedStoryStyle: (value: string) => void;
  storyLength: "short" | "medium" | "long";
  setStoryLength: (value: "short" | "medium" | "long") => void;
}

export const InputStep = memo(function InputStep({
  childName,
  setChildName,
  childAge,
  setChildAge,
  selectedMode,
  setSelectedMode,
  storyInput,
  setStoryInput,
  selectedStoryStyle,
  setSelectedStoryStyle,
  storyLength,
  setStoryLength,
}: InputStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-coral" />
        创作信息
      </h2>

      {/* 孩子信息 */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">孩子的名字</label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="输入孩子的名字"
            className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">孩子的年龄</label>
          <select
            value={childAge}
            onChange={(e) => setChildAge(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none"
          >
            {[3, 4, 5, 6].map((age) => (
              <option key={age} value={age}>{age}岁</option>
            ))}
          </select>
        </div>
      </div>

      {/* 创作模式 */}
      <div>
        <label className="block text-sm font-medium mb-3">选择创作模式</label>
        <div className="grid md:grid-cols-3 gap-4">
          {createModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-coral bg-coral/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${isSelected ? "text-coral" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-sm">{mode.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 故事主题/内容 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {selectedMode === "custom" ? "故事内容" : "故事主题"}
        </label>
        <textarea
          value={storyInput}
          onChange={(e) => setStoryInput(e.target.value)}
          placeholder={
            selectedMode === "theme"
              ? "请输入故事主题，例如：小兔子的森林冒险..."
              : selectedMode === "poem"
              ? "请输入古诗词标题，例如：静夜思..."
              : "请输入您的故事内容..."
          }
          className="w-full h-32 p-4 rounded-2xl border-2 border-border focus:border-coral focus:outline-none resize-none"
        />
      </div>

      {/* 故事风格和长度 */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">故事风格</label>
          <select
            value={selectedStoryStyle}
            onChange={(e) => setSelectedStoryStyle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none"
          >
            {storyStyles.map((style) => (
              <option key={style.id} value={style.id}>{style.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">故事长度</label>
          <select
            value={storyLength}
            onChange={(e) => setStoryLength(e.target.value as any)}
            className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none"
          >
            <option value="short">短篇 (4-6页)</option>
            <option value="medium">中篇 (6-10页)</option>
            <option value="long">长篇 (10-15页)</option>
          </select>
        </div>
      </div>
    </div>
  );
});
