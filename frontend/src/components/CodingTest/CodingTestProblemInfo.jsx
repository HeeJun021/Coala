import React from "react";
import {
  FileText,
  CornerDownLeft,
  CornerDownRight,
  ShieldCheck,
  Table2,
  Copy,
} from "lucide-react";

const CodingTestProblemInfo = ({ problem, setShowCopyMessage }) => {
  const getLevelClass = (level) => {
    switch (level) {
      case 1:
        return "bg-green-200 text-green-800";
      case 2:
        return "bg-lime-200 text-lime-800";
      case 3:
        return "bg-yellow-200 text-yellow-800";
      case 4:
        return "bg-orange-200 text-orange-800";
      case 5:
        return "bg-rose-200 text-rose-800";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-2 text-gray-800">{problem.title}</h2>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-1 rounded-md font-medium ${getLevelClass(
              problem.difficulty
            )}`}
          >
            LV.{problem.difficulty}
          </span>
          <span className="text-xs text-gray-500">| 카테고리 {problem.category}</span>
        </div>
        <div className="text-xs text-gray-500">
          총 {problem.total_submissions || 0}번의 풀이 | 정답률{" "}
          {(problem.correct_rate || 0).toFixed(1)}%
        </div>
      </div>

      <section className="space-y-6 text-sm text-gray-800 leading-relaxed">
        {/* 문제 설명 */}
        <div>
          <h2 className="flex items-center gap-2 font-semibold mb-2 text-base text-gray-700">
            <FileText size={16} className="text-indigo-500" />
            문제 설명
          </h2>
          <p className="whitespace-pre-line">{problem.description}</p>
        </div>

        {/* 입력 형식 */}
        <div>
          <hr className="border-gray-300 my-4" />
          <h2 className="flex items-center gap-2 font-semibold mb-2 text-base text-gray-700">
            <CornerDownLeft size={16} className="text-blue-500" />
            입력 형식
          </h2>
          <p className="whitespace-pre-line">{problem.input_format}</p>
        </div>

        {/* 출력 형식 */}
        <div>
          <hr className="border-gray-300 my-4" />
          <h2 className="flex items-center gap-2 font-semibold mb-2 text-base text-gray-700">
            <CornerDownRight size={16} className="text-blue-500" />
            출력 형식
          </h2>
          <p className="whitespace-pre-line">{problem.output_format}</p>
        </div>

        {/* 제한 사항 */}
        <div>
          <hr className="border-gray-300 my-4" />
          <h2 className="flex items-center gap-2 font-semibold mb-2 text-base text-gray-700">
            <ShieldCheck size={16} className="text-indigo-500" />
            제한 사항
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>
              <span className="font-medium text-gray-800">타임리밋:</span>{" "}
              {problem.time_limit}ms
            </li>
            <li>
              <span className="font-medium text-gray-800">메모리리밋:</span>{" "}
              {problem.memory_limit} bytes
            </li>
          </ul>
        </div>

        {/* 제약조건 */}
        <div>
          <hr className="border-gray-300 my-4" />
          <h2 className="flex items-center gap-2 font-semibold mb-2 text-base text-gray-700">
            <ShieldCheck size={16} className="text-rose-500" />
            제약조건
          </h2>
          {problem.constraints.map((con, idx) => (
            <div
              key={idx}
              className="text-sm whitespace-pre-line mb-2 text-gray-700"
            >
              {con.description}
            </div>
          ))}
        </div>

        {/* 입출력 예제 */}
        <div>
          <hr className="border-gray-300 my-4" />
          <h2 className="flex items-center gap-2 font-semibold mb-2 text-base text-gray-700">
            <Table2 size={16} className="text-emerald-500" />
            입출력 예제
          </h2>
          {problem.testcases.map((ex, idx) => (
            <div
              key={idx}
              className="border border-gray-300 bg-gray-50 p-4 mb-4 rounded-md"
            >
              {/* 입력 */}
              <p className="text-xs text-gray-500 mb-1">입력</p>
              <div className="relative bg-white border border-gray-200 rounded-md p-3 text-sm whitespace-pre-wrap">
                <span>{ex.input.replace(/\\n/g, "\n")}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ex.input.replace(/\\n/g, "\n"));
                    setShowCopyMessage(true);
                    setTimeout(() => setShowCopyMessage(false), 3000);
                  }}
                  className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-teal-500 hover:text-white transition flex items-center gap-1"
                >
                  <Copy size={14} />
                  복사
                </button>
              </div>

              {/* 출력 */}
              <p className="text-xs text-gray-500 mt-4 mb-1">출력</p>
              <div className="relative bg-white border border-gray-200 rounded-md p-3 text-sm whitespace-pre-wrap">
                <span>{ex.output}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ex.output);
                    setShowCopyMessage(true);
                    setTimeout(() => setShowCopyMessage(false), 3000);
                  }}
                  className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-teal-500 hover:text-white transition flex items-center gap-1"
                >
                  <Copy size={14} />
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
