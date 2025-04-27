import React from "react";

const CodingTestProblemInfo = ({ problem, setShowCopyMessage }) => {
  return (
    <>
      <h2 className="text-2xl font-bold mb-2">{problem.title}</h2>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-[#e5f4db] text-green-700 text-xs px-2 py-1 rounded">
            LV.{problem.difficulty}
          </span>
          <span className="text-xs text-gray-300">| 카테고리 {problem.category}</span>
        </div>
        <div className="text-xs text-gray-300">
          총 {problem.total_submissions || 0}번의 풀이 | 정답률 {(problem.correct_rate || 0).toFixed(1)}%
        </div>
      </div>

      <section className="space-y-4 text-sm leading-6">
        <div>
          <h2 className="font-semibold mb-2">문제 설명</h2>
          <p className="whitespace-pre-line">{problem.description}</p>
        </div>
        <div>
          <hr className="border-gray-500 my-2" />
          <h2 className="font-semibold mb-2">입력 형식</h2>
          <p className="whitespace-pre-line">{problem.input_format}</p>
        </div>
        <div>
          <hr className="border-gray-500 my-2" />
          <h2 className="font-semibold mb-2">출력 형식</h2>
          <p className="whitespace-pre-line">{problem.output_format}</p>
        </div>
        <div>
          <hr className="border-gray-500 mb-2" />
          <h2 className="font-semibold mb-2">제약조건</h2>
          {problem.constraints.map((con, idx) => (
            <div key={idx} className="text-sm whitespace-pre-line mb-2">
              {con.description}
            </div>
          ))}
        </div>
        <div>
          <hr className="border-gray-500 my-2" />
          <h2 className="font-semibold mb-2">입출력 예제</h2>
          {problem.testcases.map((ex, idx) => (
            <div key={idx} className="border border-gray-500 p-3 mb-2 rounded">
              <p className="text-xs text-gray-300 mb-1">입력</p>
              <div className="flex items-center bg-[#2c3544] p-2 rounded justify-between whitespace-pre-wrap relative">
                <span>{ex.input.replace(/\\n/g, "\n")}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ex.input.replace(/\\n/g, "\n"));
                    setShowCopyMessage(true);
                    setTimeout(() => setShowCopyMessage(false), 3000);
                  }}
                  className="absolute top-1 right-2 text-xs bg-[#4b5b6e] text-white px-3 py-1 rounded hover:bg-[#5f6f82]"
                  style={{ cursor: "pointer" }}
                >
                  복사
                </button>
              </div>
              <p className="text-xs text-gray-300 mt-2 mb-1">출력</p>
              <div className="flex items-center bg-[#2c3544] p-2 rounded justify-between whitespace-pre-wrap relative mt-2">
                <span>{ex.output}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ex.input.replace(/\\n/g, "\n"));
                    setShowCopyMessage(true);
                    setTimeout(() => setShowCopyMessage(false), 3000);
                  }}
                  className="absolute top-1 right-2 text-xs bg-[#4b5b6e] text-white px-3 py-1 rounded hover:bg-[#5f6f82]"
                  style={{ cursor: "pointer" }}
                >
                  복사
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default CodingTestProblemInfo;
