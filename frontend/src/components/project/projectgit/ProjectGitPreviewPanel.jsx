import React from "react";
import { FaFileAlt } from "react-icons/fa";

/**
 * Git 코드 에디터의 실행 결과를 보여주는 미리보기 패널
 */
const GitCodePreviewPanel = ({ previewFilename, previewSrcDoc }) => {
  // Python 실행 결과는 객체 형태로 올 수 있으므로 이를 확인
  // (현재 CodeEditorPanel에서는 Python 실행이 구현되지 않았지만, 확장성을 위해 남겨둠)
  const isPythonResult =
    previewSrcDoc &&
    typeof previewSrcDoc === "object" &&
    ("stdout" in previewSrcDoc || "stderr" in previewSrcDoc);

  const stdout = isPythonResult ? previewSrcDoc.stdout : "";
  const stderr = isPythonResult ? previewSrcDoc.stderr : "";
  const success = isPythonResult ? previewSrcDoc.success : false;

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {/* 상단 실행 파일 이름 표시 */}
      <div className="flex items-center bg-[#f3f3f3] border-b border-gray-300 px-3 py-1 text-sm font-medium text-gray-700">
        <FaFileAlt className="mr-2 text-gray-600" />
        {previewFilename ? (
          <span>{previewFilename}</span>
        ) : (
          <span className="italic text-gray-400">최근 실행 결과 없음</span>
        )}
      </div>

      {/* 실행 결과 영역 */}
      <div className="flex-1 overflow-auto">
        {previewSrcDoc ? (
          isPythonResult ? (
            // Python 결과 표시 (현재 미사용)
            <div className="p-4 text-sm font-mono whitespace-pre-wrap space-y-4">
              <div>
                <span className="text-blue-700 font-bold">📥 실행 결과</span>
                <div className={`mt-1 ${stdout?.trim() !== "" ? "text-green-700 bg-gray-100" : "text-gray-400 italic"} rounded p-2`}>
                  {stdout?.trim() !== "" ? stdout : "(없음)"}
                </div>
              </div>
              {!success && stderr?.trim() !== "" && (
                <div>
                  <span className="text-pink-700 font-bold">🎯 오류</span>
                  <div className="mt-1 text-red-500 bg-gray-100 rounded p-2">
                    {stderr}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // HTML/JS 결과는 iframe으로 렌더링
            <iframe
              title="preview"
              srcDoc={previewSrcDoc}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-modals allow-same-origin"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">
            실행 결과가 여기에 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default GitCodePreviewPanel;
