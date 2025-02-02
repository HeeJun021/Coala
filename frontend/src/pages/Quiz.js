import QuizCard from "../components/QuizCard";

const Quiz = () => {
  const quizData = [
    { question: "HTML의 기본 구조를 감싸는 태그는?", answer: "<html>" },
    { question: "CSS에서 글꼴 색상을 설정하는 속성은?", answer: "color" },
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">퀴즈 목록</h1>
      <div className="grid gap-4">
        {quizData.map((quiz, index) => (
          <QuizCard key={index} {...quiz} />
        ))}
      </div>
    </div>
  );
};

export default Quiz;