import { Button } from "@/components/ui/button";

interface TestQuestion {
  text: string;
  icon: string;
  label: string;
}

const TEST_QUESTIONS: TestQuestion[] = [
  { text: "测试消息1", icon: "🧪", label: "测试1" },
  { text: "测试消息2", icon: "🔬", label: "测试2" },
  { text: "测试消息3", icon: "⚗️", label: "测试3" },
  { text: "测试消息4", icon: "🧮", label: "测试4" },
  { text: "测试消息5", icon: "📊", label: "测试5" },
];

interface TestQuestionsProps {
  onQuestionSelect: (question: string) => Promise<void>;
  disabled?: boolean;
}

export function TestQuestions({ onQuestionSelect, disabled = false }: TestQuestionsProps) {
  // 在生产环境不显示测试问题
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
      {TEST_QUESTIONS.map((question) => (
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