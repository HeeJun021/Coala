import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaTimes } from "react-icons/fa";
import CodeMirror from "@uiw/react-codemirror";
import { getCodeById, updateCodeFile } from "../../api/codeApi";
import { runJsPreview, runHtmlPreview, runPythonPreview } from "../../api/previewApi";

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
  getLanguageExtension,
  setUnsaved,
  unsaved,
  languageId,
  setLanguageId,
  setPreviewSrcDoc,
  setPreviewFilename, 
}) => {
  const editorRef = useRef(null);
  const [originalContent, setOriginalContent] = useState("");
  const extension = selectedFilename?.split(".").pop();

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
}, [activeTabId, selectedFileContent, languageId, setOriginalContent, setUnsaved]);

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
      setPreviewFilename(selectedFilename); // ✅ 실행한 파일 이름 설정
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
      setPreviewFilename(result.html_filename); // ✅ 실행한 파일 이름 설정
    } catch (err) {
      console.error("HTML 실행 실패 Error:", err.message);
      alert("HTML 실행 중 오류: " + err.message);
    }
  };

  const handleRunPython = async () => {
    try {
      const codeId = parseInt(activeTabId?.replace("code-", ""));
      if (!codeId) throw new Error("올바른 코드 ID가 아닙니다.");

      const result = await runPythonPreview(codeId);
      console.log("🐍 runPython 결과:", result);

      setPreviewSrcDoc(result);
      setPreviewFilename(selectedFilename); // ✅ 실행한 파일 이름 설정
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

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

    if (selectedFilename.endsWith(".js")) {
      return (
        <button
          className="text-[12px] text-green-600 hover:text-green-800 px-2 py-0.5 border border-green-300 rounded"
          onClick={handleRunJs}
        >
          ▶ JS 실행
        </button>
      );
    }

    if (selectedFilename.endsWith(".html")) {
      return (
        <button
          className="text-[12px] text-purple-600 hover:text-purple-800 px-2 py-0.5 border border-purple-300 rounded"
          onClick={handleRunHtml}
        >
          🌐 HTML 실행
        </button>
      );
    }

    if (selectedFilename.endsWith(".py")) {
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
      {/* 탭 영역 */}
      <div className="flex items-center overflow-x-auto bg-[#f3f3f3] border-b border-gray-300 px-2 py-1">
        {tabs.map((tab) => {
          const fileName = tab.filename;
          const emoji = templateDescriptions[templateId]?.emoji || "📄";
          const isActive = tab.tabId === activeTabId;
          const isUnsaved = isActive && unsaved;
          return (
            <div
              key={tab.tabId}
              className={`flex items-center px-3 py-1 mr-1 rounded-t-md text-sm font-medium border cursor-pointer ${
                isActive
                  ? "bg-white text-black border-t border-l border-r border-gray-300"
                  : "bg-[#e0e0e0] text-gray-600 hover:bg-[#d5d5d5] border border-transparent"
              }`}
              onClick={() => setActiveTabId(tab.tabId)}
            >
              <span className="mr-2">{emoji}</span>
              <span>{fileName}{isUnsaved && " ●"}</span>
              <FaTimes
                className="ml-2 text-xs hover:text-red-500"
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

      {/* 코드 에디터 */}
      <div className="flex-1 p-4 overflow-auto">
        <CodeMirror
          ref={editorRef}
          value={selectedFileContent}
          height="100%"
          theme="light"
          extensions={[getLanguageExtension(selectedFilename)]}
          onChange={(value) => {
            setSelectedFileContent(value);
            setUnsaved(value !== originalContent);
          }}
          basicSetup={{ lineNumbers: true }}
          style={{
            fontFamily:
              "'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        />
      </div>
    </div>
  );
};

export default SelfCodingEditorPanel;
