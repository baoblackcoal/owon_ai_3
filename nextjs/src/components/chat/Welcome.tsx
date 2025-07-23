import { useChatContext } from '@/contexts/ChatContext';

interface CommonQuestion {
  text: string;
  icon: string;
}

const COMMON_QUESTIONS: CommonQuestion[] = [
  { text: "幅度是怎么计算？", icon: "📏"},
  { text: "如何使用光标测量？", icon: "📊"},
  { text: "如何进行示波器校准？", icon: "🔧"},
];

export function Welcome() {
  const { isLoading, sendMessage } = useChatContext();

  const handleQuestionClick = async (question: string) => {
    await sendMessage(question);
  };

  return (
    <div className="h-full flex">
      <div className="flex flex-col items-center justify-center h-full px-8 text-center w-full">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            欢迎使用 OWON 小欧AI 助手
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            我是您的专业测试测量设备助手，可以帮助您解答关于OWON的示波器、信号发生器等设备的问题。
          </p>
          
          <div className="space-y-4">                
            <div className="grid gap-3">
              {COMMON_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(question.text)}
                  disabled={isLoading}
                  className="p-4 bg-muted hover:bg-muted/80 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <span className="text-primary mr-3">{question.icon}</span>
                    <span className="text-foreground">{question.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 