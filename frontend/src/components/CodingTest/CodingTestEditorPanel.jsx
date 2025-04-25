import React from "react";
import { ResizableBox } from "react-resizable";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cleanStderr } from "../../utils/cleanStderr";
import { oneDark } from "@codemirror/theme-one-dark";

const CodingTestEditorPanel = ({
  code,
  setCode,
  language,
  HoverHandle,
  executionResults,
  isSubmitResult,
  isRunning,
}) => {
  // 언어 확장
  const getLanguageExtension = () => {
    if (language === "python") return python();
    if (language === "java") return java();
    if (language === "javascript") return javascript();
    return [];
  };

  return (
    <div className="w-[60%] flex flex-col border-l border-gray-600">
      {/* 코드 에디터 */}
      <div className="flex-1 overflow-auto p-4 bg-[#30435D] editor-scrollbar">
        <CodeMirror
          value={code}
          height="510px"
          extensions={[getLanguageExtension(), oneDark]}
          onChange={(value) => setCode(value)}
        />
      </div>

      {/* 실행 결과 */}
      <ResizableBox
        width={"100%"}
        height={200}
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
        <div className="border-t border-gray-600 p-4 text-sm overflow-auto bg-[#30435d] h-full result-scrollbar">
          <h3 className="text-white font-semibold mb-2">
            {isSubmitResult ? "제출 실행 결과" : "실행 결과"}
          </h3>

          {isRunning ? (
            <div className="text-gray-300 text-sm mt-3 animate-pulse">
              ⏳ 제출 실행 중입니다...
            </div>
          ) : executionResults.length === 0 ? (
            <div className="text-gray-300 text-sm mt-3">
              코드 실행 결과가 여기에 표시됩니다.
            </div>
          ) : (
            <>
              <table className="w-full text-left border border-gray-500">
                <thead>
                  <tr className="bg-[#2c3544] text-white">
                    <th className="p-2 border-r border-gray-500">입력값</th>
                    <th className="p-2 border-r border-gray-500">기댓값</th>
                    <th className="p-2 border-r border-gray-500">실행 결과</th>
                    <th className="p-2">출력</th>
                  </tr>
                </thead>
                <tbody>
                  {executionResults.map((result, idx) => (
                    <tr key={idx} className="border-t border-gray-500 text-white">
                      <td className="p-2 border-r border-gray-500 whitespace-pre-line">
                        {result.input.replace(/\\n/g, "\n")}
                      </td>
                      <td className="p-2 border-r border-gray-500">
                        {result.expected_output}
                      </td>
                      <td className="p-2 border-r border-gray-500">
                        {result.passed ? (
                          <span className="text-blue-400">테스트를 통과하였습니다.</span>
                        ) : (
                          <span className="text-red-400">테스트를 통과하지 못했습니다.</span>
                        )}
                      </td>
                      <td className="p-2">
                        {result.actual_output !== undefined && result.actual_output !== ""
                          ? result.actual_output
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isRunning && executionResults.some((r) => r.stderr) && (
                <div className="bg-[#2b2f38] border border-red-400 rounded-md p-4 mt-4 text-sm text-red-200 whitespace-pre-wrap">
                  <pre className="leading-relaxed text-red-200 font-mono">
                    {cleanStderr(
                      executionResults.map((r) => r.stderr).filter(Boolean).join("\n\n")
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
