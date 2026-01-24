import { memo } from "react";
import { Mic2, Upload, Check, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceOptions } from "./constants";

/**
 * 步骤6：选择朗读语音
 */
export interface VoiceStepProps {
  selectedVoice: string | null;
  setSelectedVoice: (value: string) => void;
}

// 无配音选项
const noVoiceOption = {
  id: "none" as const,
  name: "无配音",
  description: "不添加语音朗读，仅展示绘本内容",
  icon: VolumeX,
};

export const VoiceStep = memo(function VoiceStep({ selectedVoice, setSelectedVoice }: VoiceStepProps) {
  // 合并选项：无配音 + 其他语音选项
  const allOptions = [noVoiceOption, ...voiceOptions];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Mic2 className="w-6 h-6 text-coral" />
        选择朗读语音 <span className="text-sm font-normal text-muted-foreground">(可选)</span>
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        {allOptions.map((voice) => {
          const Icon = voice.icon;
          const isSelected = selectedVoice === voice.id;
          const isNoVoice = voice.id === "none";

          return (
            <div
              key={voice.id}
              onClick={() => setSelectedVoice(voice.id)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                isSelected
                  ? "border-coral bg-coral/5"
                  : "border-border hover:border-muted-foreground/30"
              } ${isNoVoice && isSelected ? "border-mint bg-mint/5" : ""}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isSelected
                  ? (isNoVoice ? "bg-mint/20" : "bg-coral/20")
                  : "bg-muted"
              }`}>
                <Icon className={`w-6 h-6 ${
                  isSelected
                    ? (isNoVoice ? "text-mint" : "text-coral")
                    : "text-muted-foreground"
                }`} />
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
              {isSelected && (
                <Check className={`w-5 h-5 ${isNoVoice ? "text-mint" : "text-coral"}`} />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        语音功能即将上线，您可以选择"无配音"跳过此步骤
      </p>
    </div>
  );
});
