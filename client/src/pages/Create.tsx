/**
 * 创作页面 - 绘本创作向导
 * 设计风格：梦幻童话风格
 * 已对接后端 API
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
  Volume2,
  Loader2,
  RefreshCw,
  Eye,
  Image as ImageIcon
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useCreate } from "@/hooks/useCreate";
import { Progress } from "@/components/ui/progress";
import { ImageProvider } from "@/lib/api";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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
  { id: "flat", name: "扁平插画", image: "/images/demo-book.png" },
  { id: "3d", name: "3D渲染", image: "/images/demo-book.png" },
  { id: "anime", name: "动漫风格", image: "/images/demo-book.png" },
  { id: "oil", name: "油画风格", image: "/images/demo-book.png" },
];

// 故事风格
const storyStyles = [
  { id: "warm", name: "温馨感人" },
  { id: "adventure", name: "冒险刺激" },
  { id: "funny", name: "幽默搞笑" },
  { id: "educational", name: "寓教于乐" },
  { id: "fantasy", name: "奇幻梦幻" },
  { id: "friendship", name: "友情故事" },
];

// 语音选项
const voiceOptions = [
  { id: "female_gentle", name: "温柔女声", description: "甜美温柔的女性配音", icon: Volume2 },
  { id: "female_lively", name: "活泼女声", description: "活泼开朗的女性配音", icon: Volume2 },
  { id: "male_warm", name: "温暖男声", description: "温暖亲切的男性配音", icon: Volume2 },
  { id: "child_cute", name: "童声朗读", description: "活泼可爱的儿童配音", icon: Volume2 },
  { id: "clone", name: "克隆我的声音", description: "上传30秒录音，AI克隆您的声音", icon: Mic2 },
];

// 图片生成提供商选项
const imageProviders: Array<{
  id: ImageProvider;
  name: string;
  description: string;
  recommended?: boolean;
}> = [
  { id: "siliconflow", name: "硅基流动", description: "国内服务，免费额度，FLUX 模型", recommended: true },
  { id: "imagen", name: "Google Imagen", description: "Google AI 图片生成" },
  { id: "dalle", name: "DALL-E", description: "OpenAI 出品" },
  { id: "stability", name: "Stability AI", description: "Stable Diffusion 官方" },
  { id: "jimeng", name: "即梦", description: "字节跳动旗下" },
  { id: "custom", name: "自定义", description: "使用自定义 API" },
];

export default function Create() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // 创作流程状态
  const create = useCreate();

  // 本地表单状态
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(4);
  const [storyInput, setStoryInput] = useState("");
  const [selectedStoryStyle, setSelectedStoryStyle] = useState<string>("warm");
  const [storyLength, setStoryLength] = useState<"short" | "medium" | "long">("medium");
  const [selectedArtStyle, setSelectedArtStyle] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ImageProvider>("siliconflow");
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // 图片预览

  const totalSteps = 5; // 输入 -> 故事 -> 分镜 -> 图片 -> 预览

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // 从 URL 参数恢复草稿
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const draftId = params.get('draft');

    if (draftId && isAuthenticated && !isRestoringDraft) {
      setIsRestoringDraft(true);
      create.restoreFromDraft(draftId).then((draft) => {
        // 恢复本地表单状态
        if (draft.work.theme) {
          setStoryInput(draft.work.theme);
          setSelectedMode("theme");
        }
        if (draft.work.childName) setChildName(draft.work.childName);
        if (draft.work.childAge) setChildAge(draft.work.childAge);
        if (draft.work.style) setSelectedStoryStyle(draft.work.style);
        if (draft.work.length) setStoryLength(draft.work.length as any);

        // 恢复艺术风格选择
        if (draft.work.artStyle) {
          // 如果有保存的艺术风格，使用保存的风格
          setSelectedArtStyle(draft.work.artStyle);
        } else if (draft.storyboard && draft.storyboard.pages.length > 0) {
          // 如果没有保存的风格但有分镜，默认选择水彩风格
          setSelectedArtStyle("watercolor");
        }

        // 根据当前步骤设置页面步骤
        const stepMap: Record<string, number> = {
          'input': 1,
          'story': 2,
          'storyboard': 3,
          'images': 4,
          'preview': 5,
          'completed': 5,
        };
        setCurrentStep(stepMap[draft.work.currentStep] || 1);
        setIsRestoringDraft(false);
      }).catch(() => {
        setIsRestoringDraft(false);
      });
    }
  }, [isAuthenticated]);

  // 定期同步图片生成状态（每 10 秒）
  useEffect(() => {
    if (currentStep === 4 && create.imageTask.taskId && create.imageTask.status === "processing") {
      const syncInterval = setInterval(() => {
        create.checkTaskStatus();
      }, 10000); // 每 10 秒同步一次状态

      return () => clearInterval(syncInterval);
    }
  }, [currentStep, create.imageTask.taskId, create.imageTask.status]);

  // 判断是否可以进入下一步
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedMode !== null && childName.trim().length > 0 && storyInput.trim().length > 0;
      case 2:
        return create.story !== null;
      case 3:
        return create.storyboard !== null && selectedArtStyle !== null;
      case 4:
        return create.imageTask.status === "completed";
      case 5:
        return selectedVoice !== null;
      default:
        return false;
    }
  };

  // 生成故事
  const handleGenerateStory = async () => {
    try {
      await create.generateStory({
        childName,
        childAge,
        theme: storyInput,
        style: selectedStoryStyle as any,
        length: storyLength,
      });
      setCurrentStep(2);
    } catch (err) {
      // 错误已在 hook 中处理
    }
  };

  // 生成分镜
  const handleGenerateStoryboard = async () => {
    try {
      await create.generateStoryboard();
      setCurrentStep(3);
    } catch (err) {
      // 错误已在 hook 中处理
    }
  };

  // 开始生成图片
  const handleStartImageGeneration = async () => {
    if (!selectedArtStyle) return;
    // 立即跳转到第 4 步，让用户看到加载状态
    setCurrentStep(4);
    try {
      await create.startImageGeneration(selectedArtStyle, selectedProvider);
    } catch (err) {
      // 错误已在 hook 中处理
      // 如果失败，返回第 3 步
      setCurrentStep(3);
    }
  };

  // 轮询生成图片
  useEffect(() => {
    if (create.imageTask.status === "processing" && create.imageTask.taskId) {
      let consecutiveFailures = 0; // 连续失败次数
      const maxRetries = 10; // 最大重试次数
      let syncCheckCount = 0;

      const interval = setInterval(async () => {
        try {
          const result = await create.continueImageGeneration();
          consecutiveFailures = 0; // 成功后重置连续失败计数
          syncCheckCount = 0; // 重置同步检查计数

          if (result.status === "completed") {
            clearInterval(interval);
          }
        } catch (err) {
          consecutiveFailures++;
          syncCheckCount++;

          // 每 3 次失败后，尝试同步任务状态
          if (syncCheckCount >= 3) {
            try {
              await create.checkTaskStatus();
              syncCheckCount = 0; // 同步成功后重置
            } catch (syncErr) {
              console.error('同步任务状态失败:', syncErr);
            }
          }

          // 连续失败超过 maxRetries 次才停止
          if (consecutiveFailures >= maxRetries) {
            console.error('图片生成失败次数过多，停止轮询');
            clearInterval(interval);
            // 最后尝试一次同步状态
            create.checkTaskStatus().catch(console.error);
          }
        }
      }, 5000); // 改为每 5 秒生成一张，给后端更多时间

      return () => clearInterval(interval);
    }
  }, [create.imageTask.status, create.imageTask.taskId]);

  // 上一步
  const handlePrev = () => {
    if (currentStep > 1) {
      create.clearError(); // 清除错误
      setCurrentStep(currentStep - 1);
    }
  };

  // 下一步
  const handleNext = () => {
    create.clearError(); // 清除错误
    if (currentStep === 1) {
      handleGenerateStory();
    } else if (currentStep === 2) {
      handleGenerateStoryboard();
    } else if (currentStep === 3) {
      handleStartImageGeneration();
    } else if (currentStep === 4 && create.imageTask.status === "completed") {
      setCurrentStep(5);
    }
  };

  // 完成创作
  const handleComplete = () => {
    // TODO: 保存作品并跳转到预览页
    setLocation("/my-works");
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
            {["输入", "故事", "分镜", "图片", "完成"].map((label, index) => {
              const step = index + 1;
              return (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
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
                    <span className="text-xs mt-1 text-muted-foreground">{label}</span>
                  </div>
                  {step < 5 && (
                    <div
                      className={`w-8 md:w-12 h-1 mx-1 rounded ${
                        step < currentStep ? "bg-mint" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 错误提示 */}
          {create.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{create.error}</span>
              </div>
              <button
                onClick={create.clearError}
                className="ml-2 underline hover:no-underline text-orange-600"
              >
                关闭
              </button>
            </motion.div>
          )}

          {/* 步骤内容 */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-lg border border-border/50"
          >
            {/* 步骤1：输入信息 */}
            {currentStep === 1 && (
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
            )}

            {/* 步骤2：查看生成的故事 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-mint" />
                  AI 生成的故事
                </h2>

                {create.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin text-coral mb-4" />
                    <p className="text-muted-foreground">AI 正在创作故事...</p>
                    <p className="text-sm text-muted-foreground mt-2">预计需要 10-20 秒</p>
                  </div>
                ) : create.story ? (
                  <>
                    <div className="bg-cream/30 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-4">{create.story.title}</h3>
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        {create.story.content}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>字数：{create.story.wordCount} 字</span>
                      <span>预计页数：{create.story.estimatedPages} 页</span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        create.reset();
                        setCurrentStep(1);
                      }}
                      className="rounded-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新生成
                    </Button>
                  </>
                ) : null}
              </div>
            )}

            {/* 步骤3：分镜和选择艺术风格 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Palette className="w-6 h-6 text-sunny" />
                  分镜剧本 & 艺术风格
                </h2>

                {create.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin text-mint mb-4" />
                    <p className="text-muted-foreground">AI 正在生成分镜剧本...</p>
                  </div>
                ) : create.storyboard ? (
                  <>
                    {/* 分镜预览 */}
                    <div className="bg-cream/30 rounded-2xl p-4">
                      <h3 className="font-semibold mb-3">分镜剧本 ({create.storyboard.pageCount} 页)</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {create.storyboard.pages.map((page) => (
                          <div key={page.pageNumber} className="bg-white rounded-xl p-3 text-sm">
                            <span className="font-medium text-coral">第 {page.pageNumber} 页：</span>
                            <span className="text-muted-foreground ml-2">{page.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 艺术风格选择 */}
                    <div>
                      <label className="block text-sm font-medium mb-3">选择艺术风格</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {artStyles.map((style) => {
                          const isSelected = selectedArtStyle === style.id;
                          return (
                            <div
                              key={style.id}
                              onClick={() => setSelectedArtStyle(style.id)}
                              className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${
                                isSelected ? "ring-4 ring-sunny shadow-lg" : "hover:shadow-md"
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
                                <span className="text-white font-medium text-sm">{style.name}</span>
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
                  </>
                ) : null}
              </div>
            )}

            {/* 步骤4：图片生成进度 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-coral" />
                  生成插图
                </h2>

                <div className="text-center py-8">
                  {create.imageTask.status === "processing" && (
                    <>
                      <Loader2 className="w-16 h-16 animate-spin text-coral mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">
                        正在生成第 {Math.min(create.imageTask.completedPages + 1, create.imageTask.totalPages)} / {create.imageTask.totalPages} 张图片
                      </p>
                      <Progress value={create.imageTask.progress} className="w-full max-w-md mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        AI 正在为每一页绘制精美插图，请耐心等待...
                      </p>
                    </>
                  )}

                  {create.imageTask.status === "completed" && (
                    <>
                      <div className="w-16 h-16 bg-mint rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-lg font-medium mb-2">所有插图生成完成！</p>
                      <p className="text-sm text-muted-foreground">
                        共生成 {create.imageTask.totalPages} 张精美插图
                      </p>
                    </>
                  )}

                  {create.imageTask.status === "failed" && (
                    <>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">😢</span>
                      </div>
                      <p className="text-lg font-medium mb-2 text-red-600">图片生成失败</p>
                      <Button
                        onClick={() => selectedArtStyle && create.startImageGeneration(selectedArtStyle, selectedProvider)}
                        className="mt-4"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        重试
                      </Button>
                    </>
                  )}
                </div>

                {/* 已生成的图片预览 */}
                {Object.keys(create.pageImages).length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        已生成 {Object.keys(create.pageImages).length} / {create.imageTask.totalPages} 张图片
                      </h3>
                      {create.imageTask.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedArtStyle && window.confirm('确定要重新生成所有图片吗？')) {
                              create.startImageGeneration(selectedArtStyle, selectedProvider);
                            }
                          }}
                          className="rounded-full"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          全部重新生成
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {Object.entries(create.pageImages).map(([pageNum, url]) => (
                        <div
                          key={pageNum}
                          className="relative aspect-square rounded-xl overflow-hidden bg-cream group cursor-pointer"
                          onClick={() => setPreviewImage(url)}
                        >
                          <img
                            src={url}
                            alt={`第${pageNum}页`}
                            className="w-full h-full object-cover"
                          />
                          {create.imageTask.status === "completed" && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selectedArtStyle && window.confirm(`确定要重新生成第 ${pageNum} 张图片吗？`)) {
                                    create.generateImage(Number(pageNum), selectedArtStyle, selectedProvider);
                                  }
                                }}
                                className="rounded-full"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                重新生成
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 步骤5：选择语音并完成 */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
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
                          <p className="text-sm text-muted-foreground">{voice.description}</p>
                          {voice.id === "clone" && isSelected && (
                            <Button variant="outline" size="sm" className="mt-3 rounded-full">
                              <Upload className="w-4 h-4 mr-2" />
                              上传录音
                            </Button>
                          )}
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-coral" />}
                      </div>
                    );
                  })}
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  语音功能即将上线，目前可先跳过此步骤
                </p>
              </div>
            )}
          </motion.div>

          {/* 导航按钮 */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1 || create.isLoading}
              className="rounded-full px-6"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              上一步
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || create.isLoading}
                className="bg-coral hover:bg-coral/90 text-white rounded-full px-6"
              >
                {create.isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    {currentStep === 1 && "生成故事"}
                    {currentStep === 2 && "生成分镜"}
                    {currentStep === 3 && "生成图片"}
                    {currentStep === 4 && "下一步"}
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!selectedVoice}
                className="bg-mint hover:bg-mint/90 text-white rounded-full px-8"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                完成创作
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* 图片大图预览 Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-transparent border-none">
          {previewImage && (
            <img
              src={previewImage}
              alt="预览大图"
              className="w-full h-auto rounded-xl"
              onClick={() => setPreviewImage(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
