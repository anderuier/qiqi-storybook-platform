import { memo } from "react";
import { Mic2, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceOptions } from "./constants";

/**
 * 步骤5：选择朗读语音
 */
export interface VoiceStepProps {
  selectedVoice: string | null;
  setSelectedVoice: (value: string) => void;
}

export const VoiceStep = memo(function VoiceStep({ selectedVoice, setSelectedVoice }: VoiceStepProps) {
  return (
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
  );
});
