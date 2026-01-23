import { memo } from "react";
import { Palette, Loader2, Check } from "lucide-react";
import { artStyles } from "./constants";

/**
 * 步骤3：分镜剧本 & 艺术风格
 */
export interface StoryboardStepProps {
  storyboard: {
    pageCount: number;
    pages: Array<{
      pageNumber: number;
      text: string;
      imagePrompt?: string;
    }>;
  } | null;
  isLoading: boolean;
  selectedArtStyle: string | null;
  setSelectedArtStyle: (value: string) => void;
}

export const StoryboardStep = memo(function StoryboardStep({
  storyboard,
  isLoading,
  selectedArtStyle,
  setSelectedArtStyle,
}: StoryboardStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Palette className="w-6 h-6 text-sunny" />
        分镜剧本 & 艺术风格
      </h2>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-mint mb-4" />
          <p className="text-muted-foreground">AI 正在生成分镜剧本...</p>
        </div>
      ) : storyboard ? (
        <>
          {/* 分镜预览 */}
          <div className="bg-cream/30 rounded-2xl p-4">
            <h3 className="font-semibold mb-3">分镜剧本 ({storyboard.pageCount} 页)</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {storyboard.pages.map((page) => (
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
  );
});
