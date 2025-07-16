import { Button } from "@/components/ui/button";

interface QuickQuestion {
  text: string;
  icon: string;
  label: string;
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  { text: "hi", icon: "👋", label: "Hi" },
  { text: "你有什么功能？", icon: "🔍", label: "功能介绍" },
  { text: "ADS800的带宽是多少？", icon: "📊", label: "ADS800带宽" },
  { text: "ADS800的采样率是多少？", icon: "", label: "ADS800的采样率是多少？" },
];

interface QuickQuestionsProps {
  onQuestionSelect: (question: string) => Promise<void>;
  disabled?: boolean;
}

export function QuickQuestions({ onQuestionSelect, disabled = false }: QuickQuestionsProps) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
      {QUICK_QUESTIONS.map((question) => (
        <Button
          key={question.text}
          variant="outline"
          size="sm"
          onClick={() => onQuestionSelect(question.text)}
          disabled={disabled}
          className="whitespace-nowrap"
        >
          {question.icon} {question.label}
        </Button>
      ))}
    </div>
  );
} 