import { memo } from "react";
import { BookOpen, User } from "lucide-react";
import { createModes, storyStyles } from "./constants";

/**
 * 步骤1：输入创作信息
 */
export interface InputStepProps {
  childName: string;
  setChildName: (value: string) => void;
  childAge: number;
  setChildAge: (value: number) => void;
  childGender: "male" | "female";
  setChildGender: (value: "male" | "female") => void;
  selectedMode: string | null;
  setSelectedMode: (value: string) => void;
  storyInput: string;
  setStoryInput: (value: string) => void;
  selectedStoryStyle: string;
  setSelectedStoryStyle: (value: string) => void;
}

export const InputStep = memo(function InputStep({
  childName,
  setChildName,
  childAge,
  setChildAge,
  childGender,
  setChildGender,
  selectedMode,
  setSelectedMode,
  storyInput,
  setStoryInput,
  selectedStoryStyle,
  setSelectedStoryStyle,
}: InputStepProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-coral" />
        创作信息
      </h2>

      {/* 宝贝信息 */}
      <div className="bg-gradient-to-r from-coral/5 to-mint/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-coral" />
          <h3 className="font-semibold">宝贝信息</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {/* 名字 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">名字</label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="宝贝的名字"
              className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors"
            />
          </div>
          {/* 年龄 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">年龄</label>
            <select
              value={childAge}
              onChange={(e) => setChildAge(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-coral focus:outline-none transition-colors bg-white"
            >
              {[3, 4, 5, 6].map((age) => (
                <option key={age} value={age}>{age}岁</option>
              ))}
            </select>
          </div>
          {/* 性别 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">性别</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChildGender("male")}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  childGender === "male"
                    ? "border-blue-400 bg-blue-50 text-blue-600"
                    : "border-border hover:border-blue-200 text-muted-foreground"
                }`}
              >
                👦 男孩
              </button>
              <button
                type="button"
                onClick={() => setChildGender("female")}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  childGender === "female"
                    ? "border-pink-400 bg-pink-50 text-pink-600"
                    : "border-border hover:border-pink-200 text-muted-foreground"
                }`}
              >
                👧 女孩
              </button>
            </div>
          </div>
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
              ? "请输入故事主题，例如：小兔子的森林冒险、勇敢的小火车..."
              : selectedMode === "poem"
              ? "请输入古诗词标题，例如：静夜思、咏鹅..."
              : "请输入您想要的故事内容..."
          }
          className="w-full h-32 p-4 rounded-2xl border-2 border-border focus:border-coral focus:outline-none resize-none transition-colors"
        />
      </div>

      {/* 故事风格 */}
      <div>
        <label className="block text-sm font-medium mb-2">故事风格</label>
        <div className="grid md:grid-cols-3 gap-3">
          {storyStyles.map((style) => {
            const isSelected = selectedStoryStyle === style.id;

            // 根据选中状态和风格颜色返回对应的类名
            const getSelectedClass = () => {
              switch (style.id) {
                case "warm":
                  return "border-coral bg-coral/10 text-coral";
                case "adventure":
                  return "border-sunny bg-sunny/10 text-sunny";
                case "funny":
                  return "border-mint bg-mint/10 text-mint";
                case "educational":
                  return "border-blue bg-blue/10 text-blue";
                case "fantasy":
                  return "border-purple bg-purple/10 text-purple";
                case "friendship":
                  return "border-pink bg-pink/10 text-pink";
                default:
                  return "";
              }
            };

            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStoryStyle(style.id)}
                className={`p-3 rounded-xl border-2 font-medium transition-all text-sm ${
                  isSelected
                    ? getSelectedClass()
                    : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {style.icon} {style.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
