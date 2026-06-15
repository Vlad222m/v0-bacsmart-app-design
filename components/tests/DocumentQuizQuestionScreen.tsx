"use client";

interface DocumentQuizQuestionScreenProps {
  question: any;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  setSelectedAnswer: (n: number | null) => void;
  showResult: boolean;
  onSubmit: () => void;
  onNext: () => void;
  score: number;
}

export default function DocumentQuizQuestionScreen({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  setSelectedAnswer,
  showResult,
  onSubmit,
  onNext,
  score,
}: DocumentQuizQuestionScreenProps) {
  const answerLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground text-sm">Intrebarea {currentIndex + 1} din {totalQuestions}</p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2 w-32">
            <div className="h-full bg-primary transition-all" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
          </div>
        </div>
        <div className="bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
          Scor: {score}/{totalQuestions}
        </div>
      </div>

      {/* Question */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <p className="text-foreground font-medium mb-4">{question.question}</p>

        {/* Answers */}
        <div className="space-y-2">
          {question.answers.map((answer: string, index: number) => {
            let bgColor = "bg-muted";
            let borderColor = "border-transparent";
            let textColor = "text-foreground";

            if (showResult) {
              if (index === question.correct) {
                bgColor = "bg-green-500/20";
                borderColor = "border-green-500";
                textColor = "text-green-400";
              } else if (index === selectedAnswer && index !== question.correct) {
                bgColor = "bg-red-500/20";
                borderColor = "border-red-500";
                textColor = "text-red-400";
              } else {
                bgColor = "bg-muted/50";
                textColor = "text-muted-foreground";
              }
            } else if (selectedAnswer === index) {
              bgColor = "bg-primary/20";
              borderColor = "border-primary";
              textColor = "text-primary";
            }

            return (
              <button
                key={index}
                onClick={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 ${bgColor} ${borderColor} ${textColor} transition-all text-left`}
              >
                <span className="font-bold">{answerLabels[index]}</span>
                <span>{answer}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showResult && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-medium text-primary mb-1">Explicatie:</p>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!showResult ? (
          <button
            onClick={onSubmit}
            disabled={selectedAnswer === null}
            className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Verifica raspunsul
          </button>
        ) : (
          <button onClick={onNext} className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            {currentIndex === totalQuestions - 1 ? "Termina" : "Urmatoarea"}
          </button>
        )}
      </div>
    </div>
  );
}
