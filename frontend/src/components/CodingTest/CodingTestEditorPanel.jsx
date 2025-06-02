import React from "react";
import { ResizableBox } from "react-resizable";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cleanStderr } from "../../utils/cleanStderr";
import { githubLight } from "@uiw/codemirror-theme-github";

console.log("🐛 githubLight theme:", githubLight);

const CodingTestEditorPanel = ({
  code,
  setCode,
  language,
  HoverHandle,
  executionResults,
  isSubmitResult,
  isRunning,
}) => {
  const getLanguageExtension = () => {
    if (language === "python") return python();
    if (language === "java") return java();
    if (language === "javascript") return javascript();
    return [];
  };
  console.log("🐛 githubLight theme:", githubLight)


  return (
    <div className="w-[60%] flex flex-col border-l border-gray-200 bg-white">
      {/* 코드 에디터 */}
      <div className="flex-1 overflow-auto bg-white editor-scrollbar">
        <CodeMirror
          value={code}
          height="650px"
          extensions={[getLanguageExtension(), githubLight]}  // ✅ 작동
          onChange={(value) => setCode(value)}
        />
      </div>

      {/* 실행 결과 */}
      <ResizableBox
        width={1043.83}
        height={350}
        minConstraints={[100, 100]}
        maxConstraints={[Infinity, 500]}
        resizeHandles={["n"]}
        handle={
          <span
            className="react-resizable-handle react-resizable-handle-n"
            style={{
              position: "absolute",
              top: "5px",
              left: "50%",
              transform: "translateX(-50%)",
              height: "16px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "ns-resize",
              background: "transparent",
            }}
          >
            <HoverHandle />
          </span>
        }
      >
        <div className="border-t border-gray-300 shadow-sm p-4 text-sm overflow-auto bg-gray-100 h-full result-scrollbar">
          <h3 className="text-gray-700 font-semibold mb-2">
            {isSubmitResult ? "제출 실행 결과" : "실행 결과"}
          </h3>

          {isRunning ? (
            <div className="text-sm mt-3 flex items-center gap-2 text-teal-600">
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
              {isSubmitResult
                ? "제출 실행 중입니다..."
                : "테스트케이스 실행 중입니다..."}
            </div>
          ) : executionResults.length === 0 ? (
            <div className="text-gray-500 text-sm mt-3">
              코드 실행 결과가 여기에 표시됩니다.
            </div>
          ) : (
            <>
              <table className="w-full text-left border border-gray-300 table-auto">
                <thead>
                  <tr className="bg-blue-100 text-gray-700 text-sm">
                    <th className="px-3 py-2 border-r border-gray-300">
                      입력값
                    </th>
                    <th className="px-3 py-2 border-r border-gray-300">
                      기댓값
                    </th>
                    <th className="px-3 py-2 border-r border-gray-300">
                      실행 결과
                    </th>
                    <th className="px-3 py-2">출력</th>
                  </tr>
                </thead>
                <tbody>
                  {executionResults.map((result, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-300 text-gray-800 text-sm leading-relaxed"
                    >
                      <td className="px-3 py-2 border-r border-gray-300 whitespace-pre-line">
                        {result.input.replace(/\\n/g, "\n")}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-300">
                        {result.expected_output}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-300">
                        {result.passed ? (
                          <div className="flex items-center gap-1 text-teal-600 font-medium">
                            <CheckCircle size={16} strokeWidth={2.2} />
                            테스트 통과
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-rose-500 font-medium">
                            <XCircle size={16} strokeWidth={2.2} />
                            테스트 실패
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {result.actual_output !== undefined &&
                        result.actual_output !== ""
                          ? result.actual_output
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isRunning && executionResults.some((r) => r.stderr) && (
                <div className="bg-red-50 border border-red-300 rounded-md p-4 mt-4 text-sm text-red-700 whitespace-pre-wrap">
                  <pre className="leading-relaxed font-mono">
                    {cleanStderr(
                      executionResults
                        .map((r) => r.stderr)
                        .filter(Boolean)
                        .join("\n\n")
                    )}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </ResizableBox>
    </div>
  );
};

export default CodingTestEditorPanel;
