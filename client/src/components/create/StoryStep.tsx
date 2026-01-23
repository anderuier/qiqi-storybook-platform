import { memo } from "react";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

export const StoryStep = memo(function StoryStep({ story, isLoading, onRegenerate }: StoryStepProps) {
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
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>字数：{story.wordCount} 字</span>
            <span>预计页数：{story.estimatedPages} 页</span>
          </div>
          <Button
            variant="outline"
            onClick={onRegenerate}
            className="rounded-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重新生成
          </Button>
        </>
      ) : null}
    </div>
  );
});
