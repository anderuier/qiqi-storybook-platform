/**
 * 创作页面 - 绘本创作向导
 * 设计风格：梦幻童话风格
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  BookOpen,
  Palette,
  Mic2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Wand2,
  FileText,
  ScrollText,
  Check,
  Upload,
  Play,
  Volume2
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// 创作模式
const createModes = [
  {
    id: "theme",
    icon: Wand2,
    title: "主题故事",
    description: "输入一个主题，AI为您生成完整的童话故事",
    example: "例如：小兔子的森林冒险、勇敢的小消防员",
    color: "coral"
  },
  {
    id: "poem",
    icon: ScrollText,
    title: "古诗词改编",
    description: "选择一首古诗词，AI将其改编成有趣的儿童故事",
    example: "例如：静夜思、春晓、咏鹅",
    color: "mint"
  },
  {
    id: "custom",
    icon: FileText,
    title: "自定义文本",
    description: "输入您自己的故事文本，AI为其生成精美插图",
    example: "适合已有故事内容的家长",
    color: "sunny"
  }
];

// 艺术风格
const artStyles = [
  { id: "watercolor", name: "水彩手绘", image: "/images/demo-book.png" },
  { id: "cartoon", name: "卡通动漫", image: "/images/demo-book.png" },
  { id: "crayon", name: "蜡笔涂鸦", image: "/images/demo-book.png" },
  { id: "3d", name: "3D渲染", image: "/images/demo-book.png" },
  { id: "flat", name: "扁平插画", image: "/images/demo-book.png" },
  { id: "paper", name: "剪纸风格", image: "/images/demo-book.png" },
];

// 语音选项
const voiceOptions = [
  { id: "clone", name: "克隆我的声音", description: "上传30秒录音，AI克隆您的声音", icon: Mic2 },
  { id: "female", name: "温柔女声", description: "甜美温柔的女性配音", icon: Volume2 },
  { id: "male", name: "温暖男声", description: "温暖亲切的男性配音", icon: Volume2 },
  { id: "child", name: "童声朗读", description: "活泼可爱的儿童配音", icon: Volume2 },
];

export default function Create() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [storyInput, setStoryInput] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);

  const totalSteps = 4;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedMode !== null;
      case 2: return storyInput.trim().length > 0;
      case 3: return selectedStyle !== null;
      case 4: return selectedVoice !== null;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = () => {
    // TODO: 调用AI生成接口
    alert("绘本生成功能即将上线，敬请期待！");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-cream/30 to-background">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          {/* 页面标题 */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              创作您的<span className="text-coral">专属绘本</span>
            </h1>
            <p className="text-muted-foreground">
              跟随向导，轻松创作独一无二的童话故事
            </p>
          </motion.div>

          {/* 步骤指示器 */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step === currentStep
                      ? "bg-coral text-white shadow-lg shadow-coral/25"
                      : step < currentStep
                      ? "bg-mint text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-12 h-1 mx-1 rounded ${
                      step < currentStep ? "bg-mint" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* 步骤内容 */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-lg border border-border/50"
          >
            {/* 步骤1：选择创作模式 */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-coral" />
                  选择创作模式
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {createModes.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = selectedMode === mode.id;
                    const colorClasses = {
                      coral: "border-coral bg-coral/5",
                      mint: "border-mint bg-mint/5",
                      sunny: "border-sunny bg-sunny/5"
                    };
                    return (
                      <div
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? colorClasses[mode.color as keyof typeof colorClasses]
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <Icon className={`w-8 h-8 mb-3 text-${mode.color}`} />
                        <h3 className="font-semibold mb-2">{mode.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {mode.description}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {mode.example}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 步骤2：输入内容 */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-mint" />
                  {selectedMode === "theme" && "输入故事主题"}
                  {selectedMode === "poem" && "输入古诗词标题"}
                  {selectedMode === "custom" && "输入故事内容"}
                </h2>
                <textarea
                  value={storyInput}
                  onChange={(e) => setStoryInput(e.target.value)}
                  placeholder={
                    selectedMode === "theme"
                      ? "请输入您想要的故事主题，例如：小兔子的森林冒险..."
                      : selectedMode === "poem"
                      ? "请输入古诗词标题，例如：静夜思、春晓..."
                      : "请输入您的故事内容..."
                  }
                  className="w-full h-40 p-4 rounded-2xl border-2 border-border focus:border-mint focus:outline-none resize-none text-base"
                />
                <p className="text-sm text-muted-foreground mt-3">
                  {selectedMode === "theme" && "AI将根据主题为您生成适合3-6岁儿童的完整故事"}
                  {selectedMode === "poem" && "AI将把古诗词改编成有趣易懂的儿童故事"}
                  {selectedMode === "custom" && "AI将为您的故事配上精美的插图"}
                </p>
              </div>
            )}

            {/* 步骤3：选择艺术风格 */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Palette className="w-6 h-6 text-sunny" />
                  选择艺术风格
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {artStyles.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? "ring-4 ring-sunny shadow-lg"
                            : "hover:shadow-md"
                        }`}
                      >
                        <div className="aspect-square bg-gradient-to-br from-cream to-mint/10">
                          <img
                            src={style.image}
                            alt={style.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <span className="text-white font-medium text-sm">
                            {style.name}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-sunny rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 步骤4：选择语音 */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Mic2 className="w-6 h-6 text-coral" />
                  选择朗读语音
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {voiceOptions.map((voice) => {
                    const Icon = voice.icon;
                    const isSelected = selectedVoice === voice.id;
                    return (
                      <div
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                          isSelected
                            ? "border-coral bg-coral/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isSelected ? "bg-coral/20" : "bg-muted"
                        }`}>
                          <Icon className={`w-6 h-6 ${isSelected ? "text-coral" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{voice.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {voice.description}
                          </p>
                          {voice.id === "clone" && isSelected && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 rounded-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              上传录音
                            </Button>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-coral" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* 导航按钮 */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="rounded-full px-6"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              上一步
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-coral hover:bg-coral/90 text-white rounded-full px-6"
              >
                下一步
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!canProceed()}
                className="bg-mint hover:bg-mint/90 text-white rounded-full px-8"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                开始生成绘本
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
