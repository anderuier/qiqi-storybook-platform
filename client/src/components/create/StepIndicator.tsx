import { Check } from "lucide-react";
import { stepLabels } from "./constants";

/**
 * 步骤指示器组件
 * 显示当前创作进度
 */
interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const totalSteps = stepLabels.length;

  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {stepLabels.map((label, index) => {
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
            {step < totalSteps && (
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
  );
}
