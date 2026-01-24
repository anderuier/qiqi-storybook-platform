/**
 * 创作页面子组件
 * 将 Create.tsx 拆分为更小的组件，提升可维护性
 */

export { StepIndicator } from "./StepIndicator";
export { InputStep } from "./InputStep";
export type { InputStepProps } from "./InputStep";

export { StoryStep } from "./StoryStep";
export type { StoryStepProps } from "./StoryStep";

export { StoryboardStep } from "./StoryboardStep";
export type { StoryboardStepProps } from "./StoryboardStep";

export { ImagesStep } from "./ImagesStep";
export type { ImagesStepProps, ImageTask } from "./ImagesStep";

export { BookStep } from "./BookStep";
export type { BookStepProps } from "./BookStep";

export { VoiceStep } from "./VoiceStep";
export type { VoiceStepProps } from "./VoiceStep";

export * from "./constants";
