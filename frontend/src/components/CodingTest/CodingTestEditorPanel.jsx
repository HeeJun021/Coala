import React, { useEffect } from "react";
import { ResizableBox } from "react-resizable";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/eclipse.css";

// 언어 모드
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike";

// 자동완성 모듈
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/anyword-hint";

// ✅ 커스텀 힌트 등록 함수
import { registerCustomHints } from "../../utils/customHints";

import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cleanStderr } from "../../utils/cleanStderr";

const CodingTestEditorPanel = ({
  code,
  setCode,
  language,
  HoverHandle,
  executionResults,
  isSubmitResult,
  isRunning,
}) => {
  useEffect(() => {
    registerCustomHints();
  }, []);

  const getLanguageMode = (filename) => {
  const ext = filename?.split(".").pop();
  if (ext === "js") return "javascript";
  if (ext === "html") return "htmlmixed";
  if (ext === "css") return "css";
  if (ext === "py") return "python";
  if (ext === "java") return "text/x-java";
  if (ext === "c") return "text/x-csrc";
  if (ext === "cpp" || ext === "cc" || ext === "cxx") return "text/x-c++src";
  return "text/plain";
};


  const getHintByLanguage = () => {
  const mode = getLanguageMode();
  const hints = window.CodeMirror?.hint;

  if (mode === "javascript") return hints?.javascript || hints?.anyword;
  if (mode === "python") return hints?.["python-custom"] || hints?.anyword;
  if (mode === "text/x-java") return hints?.["java-custom"] || hints?.anyword;
  return hints?.anyword;
};


  return (
    <div className="w-[60%] flex flex-col border-l border-gray-200 bg-white">
      {/* 코드 에디터 */}
      <div className="flex-1 overflow-auto bg-white editor-scrollbar">
        <CodeMirror
          value={code}
          options={{
            mode: getLanguageMode(),
            theme: "eclipse",
            lineNumbers: true,
            lineWrapping: true,
            indentUnit: 4,
            tabSize: 4,
            smartIndent: true,
            extraKeys: {
              Enter: (cm) => {
                const cursor = cm.getCursor();
                const lineContent = cm.getLine(cursor.line);
                const indentMatch = lineContent.match(/^\s*/);
                cm.replaceSelection("\n" + (indentMatch ? indentMatch[0] : ""), "end");
              },
              Backspace: (cm) => {
                const cursor = cm.getCursor();
                const lineContent = cm.getLine(cursor.line);
                const indentUnit = cm.getOption("indentUnit") || 4;
                const beforeCursor = lineContent.slice(0, cursor.ch);
                const isIndentSpace = /^[\s]+$/.test(beforeCursor);

                if (isIndentSpace && cursor.ch % indentUnit === 0) {
                  const from = { line: cursor.line, ch: cursor.ch - indentUnit };
                  const to = { line: cursor.line, ch: cursor.ch };
                  cm.replaceRange("", from, to);
                } else {
                  cm.execCommand("delCharBefore");
                }
              },
              "Ctrl-Space": "autocomplete",
            },
            hintOptions: {
              hint: getHintByLanguage(),
              completeSingle: false,
            },
          }}
          onBeforeChange={(editor, data, value) => {
            setCode(value);
          }}
          onKeyUp={(editor, event) => {
            const { key } = event;
            if (!editor.state.completionActive && /^[\w.]$/.test(key)) {
              editor.showHint();
            }
          }}
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
                    <th className="px-3 py-2 border-r border-gray-300">입력값</th>
                    <th className="px-3 py-2 border-r border-gray-300">기댓값</th>
                    <th className="px-3 py-2 border-r border-gray-300">실행 결과</th>
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
                      <td className="px-3 py-2 border-r border-gray-300">{result.expected_output}</td>
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
                        {result.actual_output !== undefined && result.actual_output !== ""
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
