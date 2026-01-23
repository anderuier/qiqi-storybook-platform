import { memo } from "react";
import { Loader2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { artStyles } from "./constants";

/**
 * 图片生成任务状态
 */
export interface ImageTask {
  status: "idle" | "processing" | "completed" | "failed";
  taskId: string | null;
  totalPages: number;
  completedPages: number;
  progress: number;
}

/**
 * 步骤4：图片生成进度
 */
export interface ImagesStepProps {
  imageTask: ImageTask;
  pageImages: Record<string, string>;
  selectedArtStyle: string | null;
  selectedProvider: string;
  onRetry: () => void;
  onRegenerateAll: () => void;
  onRegenerateOne: (pageNum: number) => void;
  onPreviewImage: (url: string) => void;
}

export const ImagesStep = memo(function ImagesStep({
  imageTask,
  pageImages,
  selectedArtStyle,
  selectedProvider,
  onRetry,
  onRegenerateAll,
  onRegenerateOne,
  onPreviewImage,
}: ImagesStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <span className="w-6 h-6 bg-coral rounded-full flex items-center justify-center text-white text-xs">图</span>
        生成插图
      </h2>
      {selectedArtStyle && (
        <p className="text-sm text-muted-foreground">
          当前风格：{artStyles.find(s => s.id === selectedArtStyle)?.name || selectedArtStyle}
        </p>
      )}

      <div className="text-center py-8">
        {imageTask.status === "processing" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-coral mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              正在生成第 {Math.min(imageTask.completedPages + 1, imageTask.totalPages)} / {imageTask.totalPages} 张图片
            </p>
            <Progress value={imageTask.progress} className="w-full max-w-md mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              AI 正在为每一页绘制精美插图，请耐心等待...
            </p>
          </>
        )}

        {imageTask.status === "completed" && (
          <>
            <div className="w-16 h-16 bg-mint rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <p className="text-lg font-medium mb-2">所有插图生成完成！</p>
            <p className="text-sm text-muted-foreground">
              共生成 {imageTask.totalPages} 张精美插图
            </p>
          </>
        )}

        {imageTask.status === "failed" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">😢</span>
            </div>
            <p className="text-lg font-medium mb-2 text-red-600">图片生成失败</p>
            <Button onClick={onRetry} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </>
        )}
      </div>

      {/* 已生成的图片预览 */}
      {Object.keys(pageImages).length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              已生成 {imageTask.completedPages} / {imageTask.totalPages} 张图片
            </h3>
            {imageTask.status === "completed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerateAll}
                className="rounded-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                全部重新生成
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(pageImages)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([pageNum, url]) => (
              <div
                key={pageNum}
                className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                onClick={() => onPreviewImage(url)}
              >
                {/* 占位背景图 */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: 'url(/images/placeholder-bg.webp)' }}
                />
                {/* 实际图片 */}
                <img
                  src={url}
                  alt={`第${pageNum}页`}
                  loading="lazy"
                  className="relative z-10 w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/image-placeholder.png';
                    e.currentTarget.alt = '图片加载失败';
                  }}
                />
                {imageTask.status === "completed" && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRegenerateOne(Number(pageNum));
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
  );
});
