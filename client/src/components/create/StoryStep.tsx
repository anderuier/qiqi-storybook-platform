import { memo, useState, useEffect } from "react";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * 步骤2：查看生成的故事
 */
export interface StoryStepProps {
  story: {
    title: string;
    content: string;
    wordCount: number;
    estimatedPages: number;
  } | null;
  isLoading: boolean;
  onRegenerate: () => void;
  desiredPageCount: number;
  onDesiredPageCountChange: (count: number) => void;
}

export const StoryStep = memo(function StoryStep({
  story,
  isLoading,
  onRegenerate,
  desiredPageCount,
  onDesiredPageCountChange,
}: StoryStepProps) {
  const [inputValue, setInputValue] = useState(desiredPageCount.toString());
  const [error, setError] = useState<string>("");

  // 同步外部 desiredPageCount 变化到本地状态
  useEffect(() => {
    setInputValue(desiredPageCount.toString());
    setError("");
  }, [desiredPageCount]);

  const handlePageCountChange = (value: string) => {
    setInputValue(value);
    const count = parseInt(value);

    if (isNaN(count)) {
      setError("请输入有效的数字");
      return;
    }

    if (count < 6 || count > 12) {
      setError("页数必须在 6-12 页之间");
      return;
    }

    setError("");
    onDesiredPageCountChange(count);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <FileText className="w-6 h-6 text-mint" />
        AI 生成的故事
      </h2>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-coral mb-4" />
          <p className="text-muted-foreground">AI 正在创作故事...</p>
          <p className="text-sm text-muted-foreground mt-2">预计需要 10-20 秒</p>
        </div>
      ) : story ? (
        <>
          <div className="bg-cream/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">{story.title}</h3>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {story.content}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">字数：{story.wordCount} 字</span>
            <div className="flex items-center gap-3">
              <Label htmlFor="pageCount" className="text-sm whitespace-nowrap">
                生成页数：
              </Label>
              <Input
                id="pageCount"
                type="number"
                min={6}
                max={12}
                value={inputValue}
                onChange={(e) => handlePageCountChange(e.target.value)}
                className="w-20 h-9 text-center"
              />
              <span className="text-sm text-muted-foreground">页</span>
            </div>
          </div>
          {error && (
            <p className="text-sm text-coral font-medium">{error}</p>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onRegenerate}
              className="rounded-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重新生成故事
            </Button>
            {error && (
              <span className="text-sm text-muted-foreground">
                请调整页数后再继续
              </span>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
});
