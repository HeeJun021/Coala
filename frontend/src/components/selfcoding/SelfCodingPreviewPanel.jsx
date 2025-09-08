import React from "react";
import { FileText } from "lucide-react";

const SelfCodingPreviewPanel = ({
  previewFilename,
  previewSrcDoc,
  templateId,
  templateDescriptions,
}) => {
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
        <FileText className="mr-2 text-gray-600" />
        {previewFilename ? (
          <span>{previewFilename}</span>
        ) : (
          <span className="italic text-gray-400">최근 실행 결과 없음</span>
        )}
      </div>

      {/* 실행 결과 영역 */}
      <div className="flex-1 overflow-auto p-4 text-sm font-mono whitespace-pre-wrap">
        {previewSrcDoc ? (
          isPythonResult ? (
            <div className="space-y-4">
              {/* stdout */}
              <div>
                <span className="text-blue-700 font-bold">📥 실행 결과</span>
                <div
                  className={`mt-1 ${
                    stdout?.trim() !== ""
                      ? "text-green-700 bg-gray-100"
                      : "text-gray-400 italic"
                  } rounded p-2`}
                >
                  {stdout?.trim() !== "" ? stdout : "(없음)"}
                </div>
              </div>

              {/* stderr: 실패한 경우만 표시 */}
              {!success && stderr?.trim() !== "" && (
                <div>
                  <span className="text-pink-700 font-bold">🎯 오류</span>
                  <div className="mt-1 text-red-500 bg-gray-100 rounded p-2">
                    [stderr]
                    <br />
                    {stderr}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <iframe
              title="preview"
              srcDoc={previewSrcDoc}
              className="w-full h-full border rounded"
              sandbox="allow-scripts allow-modals allow-same-origin"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">
            실행 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfCodingPreviewPanel;
