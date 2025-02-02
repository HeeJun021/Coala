const QuizCard = ({ question, answer }) => {
    return (
      <div className="border p-4 rounded-lg shadow-md bg-white">
        <h2 className="font-semibold">{question}</h2>
        <p className="text-gray-500">{answer}</p>
      </div>
    );
  };
  
  export default QuizCard;