/**
 * 创作页面 - 绘本创作向导
 * 设计风格：梦幻童话风格
 * 已对接后端 API
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Mic2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useCreate } from "@/hooks/useCreate";
import { ImageProvider } from "@/lib/api";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
// 创作流程子组件
import {
  StepIndicator,
  InputStep,
  StoryStep,
  StoryboardStep,
  ImagesStep,
  VoiceStep,
  totalSteps,
} from "@/components/create";

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
      // 检查是否已经有生成的图片
      const hasExistingImages = Object.keys(create.pageImages).length > 0;
      // 如果已有图片，强制重新生成；否则正常生成
      await create.startImageGeneration(selectedArtStyle, selectedProvider, hasExistingImages);
    } catch (err) {
      // 错误已在 hook 中处理
      // 如果失败，返回第 3 步
      setCurrentStep(3);
    }
  };

  // 轮询生成图片 - 使用指数退避算法优化
  useEffect(() => {
    if (create.imageTask.status === "processing" && create.imageTask.taskId) {
      let consecutiveFailures = 0; // 连续失败次数
      const maxRetries = 10; // 最大重试次数
      let syncCheckCount = 0;

      // 指数退避配置
      let delay = 1000;        // 初始 1 秒
      const minDelay = 1000;   // 最小 1 秒
      const maxDelay = 10000;  // 最大 10 秒
      const backoffFactor = 1.5; // 失败退避因子
      const successFactor = 0.8; // 成功加速因子

      let timeoutId: NodeJS.Timeout | null = null;
      let isPolling = true;

      // 轮询函数（递归 setTimeout）
      const poll = async () => {
        if (!isPolling) return;

        try {
          const result = await create.continueImageGeneration();
          consecutiveFailures = 0; // 成功后重置连续失败计数
          syncCheckCount = 0; // 重置同步检查计数

          // 成功后调整延迟：略微减少（最小不低于 minDelay）
          delay = Math.max(minDelay, Math.floor(delay * successFactor));

          console.log(`[图片轮询] 成功，下次延迟 ${delay}ms`);

          if (result.status === "completed") {
            console.log('[图片轮询] 全部完成');
            isPolling = false;
            return;
          }

          // 继续轮询
          if (isPolling) {
            timeoutId = setTimeout(poll, delay);
          }

        } catch (err) {
          consecutiveFailures++;
          syncCheckCount++;

          // 失败后增加延迟（指数退避）
          delay = Math.min(maxDelay, Math.floor(delay * backoffFactor));
          console.log(`[图片轮询] 失败 ${consecutiveFailures} 次，下次延迟 ${delay}ms`);

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
            isPolling = false;
            // 最后尝试一次同步状态
            create.checkTaskStatus().catch(console.error);
            return;
          }

          // 继续轮询
          if (isPolling) {
            timeoutId = setTimeout(poll, delay);
          }
        }
      };

      // 开始轮询（初始延迟 1 秒）
      console.log(`[图片轮询] 开始，初始延迟 ${delay}ms`);
      timeoutId = setTimeout(poll, delay);

      // 清理函数
      return () => {
        isPolling = false;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
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
          <StepIndicator currentStep={currentStep} />

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
              <InputStep
                childName={childName}
                setChildName={setChildName}
                childAge={childAge}
                setChildAge={setChildAge}
                selectedMode={selectedMode}
                setSelectedMode={setSelectedMode}
                storyInput={storyInput}
                setStoryInput={setStoryInput}
                selectedStoryStyle={selectedStoryStyle}
                setSelectedStoryStyle={setSelectedStoryStyle}
                storyLength={storyLength}
                setStoryLength={setStoryLength}
              />
            )}

            {/* 步骤2：查看生成的故事 */}
            {currentStep === 2 && (
              <StoryStep
                story={create.story}
                isLoading={create.isLoading}
                onRegenerate={() => {
                  create.reset();
                  setCurrentStep(1);
                }}
              />
            )}

            {/* 步骤3：分镜和选择艺术风格 */}
            {currentStep === 3 && (
              <StoryboardStep
                storyboard={create.storyboard}
                isLoading={create.isLoading}
                selectedArtStyle={selectedArtStyle}
                setSelectedArtStyle={setSelectedArtStyle}
              />
            )}

            {/* 步骤4：图片生成进度 */}
            {currentStep === 4 && (
              <ImagesStep
                imageTask={create.imageTask}
                pageImages={create.pageImages}
                selectedArtStyle={selectedArtStyle}
                selectedProvider={selectedProvider}
                onRetry={() => selectedArtStyle && create.startImageGeneration(selectedArtStyle, selectedProvider)}
                onRegenerateAll={async () => {
                  if (selectedArtStyle && window.confirm('确定要重新生成所有图片吗？')) {
                    await create.startImageGeneration(selectedArtStyle, selectedProvider, true);
                  }
                }}
                onRegenerateOne={(pageNum) => {
                  if (selectedArtStyle && window.confirm(`确定要重新生成第 ${pageNum} 张图片吗？`)) {
                    create.generateImage(pageNum, selectedArtStyle, selectedProvider);
                  }
                }}
                onPreviewImage={setPreviewImage}
              />
            )}

            {/* 步骤5：选择语音并完成 */}
            {currentStep === 5 && (
              <VoiceStep
                selectedVoice={selectedVoice}
                setSelectedVoice={setSelectedVoice}
              />
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
