// frontend/src/components/selfcoding/SelfCodingEditorPanel.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, FileText } from "lucide-react";
import { getCodeById, updateCodeFile } from "../../api/codeApi";
import {
  runJsPreview,
  runHtmlPreview,
  runPythonPreview,
} from "../../api/previewApi";

// ▼▼▼ CodeMirror v6 (@uiw/react-codemirror) ▼▼▼
import CodeMirror from "@uiw/react-codemirror";
import { githubLight } from "@uiw/codemirror-theme-github";
import { javascript } from "@codemirror/lang-javascript";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { python as pythonLang } from "@codemirror/lang-python";

const SelfCodingEditorPanel = ({
  tabs,
  setTabs,
  activeTabId,
  setActiveTabId,
  selectedFilename,
  setSelectedFilename,
  selectedFileContent,
  setSelectedFileContent,
  templateId,
  templateDescriptions,
  setUnsaved,
  unsaved,
  languageId,
  setLanguageId,
  setPreviewSrcDoc,
  setPreviewFilename,
}) => {
  const editorRef = useRef(null);
  const [originalContent, setOriginalContent] = useState("");
  const extension = selectedFilename?.split(".").pop()?.toLowerCase();

  // v6용: 파일 확장자 기반으로 언어 extensions 구성
  const getExtensionsForFile = (filename) => {
    const ext = filename?.split(".").pop()?.toLowerCase();
    if (ext === "js" || ext === "jsx" || ext === "ts" || ext === "tsx") {
      return [javascript({ jsx: true, typescript: ext?.startsWith("ts") })];
    }
    if (ext === "html") return [htmlLang()];
    if (ext === "css") return [cssLang()];
    if (ext === "py") return [pythonLang()];
    // 기본값(플레인 텍스트에 가까운 상태)
    return [];
  };

  const handleSave = useCallback(async () => {
    const codeId = parseInt(activeTabId.replace("code-", ""));
    try {
      await updateCodeFile(codeId, {
        content: selectedFileContent,
        language_id: languageId,
      });
      setOriginalContent(selectedFileContent);
      setUnsaved(false);
    } catch (err) {
      console.error("코드 저장 실패:", err);
      alert("저장에 실패했습니다.");
    }
  }, [activeTabId, selectedFileContent, languageId, setUnsaved]);

  const handleRunJs = async () => {
    try {
      const result = await runJsPreview(selectedFileContent);
      console.log("🔥 runJs 결과:", result);
      const escapedCode = selectedFileContent.replace(/<\/script>/g, "<\\/script>");
      const jsOutput = `
        <html>
          <body style="font-family:monospace; padding:20px;">
            <pre id="output"></pre>
            <script>
              (function() {
                const log = console.log;
                const output = document.getElementById("output");
                console.log = function(...args) {
                  args.forEach(arg => {
                    output.innerText += arg + "\\n";
                  });
                  log.apply(console, args);
                };
                try {
                  ${escapedCode}
                } catch (e) {
                  output.innerText += "🚨 오류: " + e.message;
                }
              })();
            </script>
          </body>
        </html>
      `;
      setPreviewSrcDoc(jsOutput);
      setPreviewFilename(selectedFilename);
    } catch (err) {
      console.error("JS 실행 실패", err);
      alert("실행 중 오류가 발생했습니다.");
    }
  };

  const handleRunHtml = async () => {
    try {
      const codeId = parseInt(activeTabId?.replace("code-", ""));
      if (!codeId) throw new Error("올바른 코드 ID가 아닙니다.");
      const result = await runHtmlPreview(codeId);
      setPreviewSrcDoc(result.srcdoc);
      setPreviewFilename(result.html_filename);
    } catch (err) {
      console.error("HTML 실행 실패", err.message);
      alert("HTML 실행 중 오류: " + err.message);
    }
  };

  const handleRunPython = async () => {
    try {
      const codeId = parseInt(activeTabId?.replace("code-", ""));
      if (!codeId) throw new Error("올바른 코드 ID가 아닙니다.");
      const result = await runPythonPreview(codeId);
      setPreviewSrcDoc(result);
      setPreviewFilename(selectedFilename);
    } catch (err) {
      console.error("Python 실행 실패", err.message);
      alert("Python 실행 중 오류: " + err.message);
    }
  };

  useEffect(() => {
    const fetchContent = async () => {
      if (!activeTabId) return;
      try {
        const id = parseInt(activeTabId.replace("code-", ""));
        const code = await getCodeById(id);
        setSelectedFilename(code.title);
        setSelectedFileContent(code.content);
        setOriginalContent(code.content);
        setLanguageId(code.language_id);
        setUnsaved(false);
      } catch (err) {
        console.error("파일 내용 불러오기 실패", err);
        setSelectedFileContent("// 파일 불러오기 실패");
      }
    };
    fetchContent();
  }, [activeTabId, setSelectedFilename, setSelectedFileContent, setUnsaved, setLanguageId]);

  const renderActionButton = () => {
    if (unsaved || extension === "css") {
      return (
        <button
          className="text-[12px] text-blue-600 hover:text-blue-800 px-2 py-0.5 border border-blue-300 rounded"
          onClick={handleSave}
        >
          💾 저장
        </button>
      );
    }

    if (selectedFilename?.endsWith(".js")) {
      return (
        <button
          className="text-[12px] text-green-600 hover:text-green-800 px-2 py-0.5 border border-green-300 rounded"
          onClick={handleRunJs}
        >
          ▶ JS 실행
        </button>
      );
    }

    if (selectedFilename?.endsWith(".html")) {
      return (
        <button
          className="text-[12px] text-purple-600 hover:text-purple-800 px-2 py-0.5 border border-purple-300 rounded"
          onClick={handleRunHtml}
        >
          🌐 HTML 실행
        </button>
      );
    }

    if (selectedFilename?.endsWith(".py")) {
      return (
        <button
          className="text-[12px] text-yellow-600 hover:text-yellow-800 px-2 py-0.5 border border-yellow-300 rounded"
          onClick={handleRunPython}
        >
          🐍 Python 실행
        </button>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col w-full h-full bg-white border-r border-gray-200">
            <div className="flex items-center bg-[#f3f3f3] border-b border-gray-300 px-3 py-1 text-sm font-medium text-gray-700">
              <FileText className="mr-2 text-gray-600" />
              <span className=" text-gray-700">코드 에디터</span>

      </div>
      {/* 탭 영역 */}
        <div className="flex items-center overflow-x-auto whitespace-nowrap bg-[#f3f3f3] border-b border-gray-300 px-2 pt-1">
          {tabs.map((tab) => {
            const fileName = tab.filename;
            const emoji =
              templateDescriptions[templateId]?.emoji || (
                <FileText size={14} className="inline text-gray-600" />
              );
            const isActive = tab.tabId === activeTabId;
            const isUnsaved = isActive && unsaved;

            return (
              <div
                key={tab.tabId}
                onClick={() => setActiveTabId(tab.tabId)}
                className={`inline-flex items-center px-3 py-1 mr-1 rounded-t-md text-sm font-medium border cursor-pointer flex-shrink-0
                  ${isActive
                    ? "bg-white text-black border-t border-l border-r border-gray-300"
                    : "bg-[#e0e0e0] text-gray-600 hover:bg-[#d5d5d5] border border-transparent"}`}
              >
                <span className="mr-2 flex items-center">{emoji}</span>
                <span className="truncate max-w-[160px]">
                  {fileName}{isUnsaved && " ●"}
                </span>
                <X
                  className="ml-2 text-xs hover:text-red-500 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTabs((prev) => prev.filter((t) => t.tabId !== tab.tabId));
                    if (activeTabId === tab.tabId) {
                      const nextTab = tabs.find((t) => t.tabId !== tab.tabId);
                      setActiveTabId(nextTab?.tabId || "");
                      setSelectedFilename(nextTab?.filename || "");
                      setSelectedFileContent("");
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

      {/* 파일명 및 액션 버튼 */}
      <div className="flex justify-between items-center px-4 py-1 text-xs text-gray-500 border-b border-gray-200 bg-white font-mono">
        <div>{selectedFilename || "파일을 선택하세요"}</div>
        {renderActionButton()}
      </div>

      {/* 코드 에디터 (v6) */}
      <div className="flex-1 min-h-0">
        {!selectedFilename ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {/* 좌측에서 파일을 선택하면 편집할 수 있어요 */}
            파일을 선택하면 편집할 수 있어요
          </div>
        ) : (
          <CodeMirror
            ref={editorRef}
            value={selectedFileContent || ""}
            height="100%"
            theme={githubLight}
            extensions={getExtensionsForFile(selectedFilename)}
            onChange={(val) => {
              setSelectedFileContent(val);
              setUnsaved(val !== originalContent);
            }}
            style={{ height: "100%" }}
          />
        )}
      </div>
    </div>
  );
};

export default SelfCodingEditorPanel;
