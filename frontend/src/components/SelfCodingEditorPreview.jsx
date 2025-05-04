import React, { useRef } from "react";
import { FaTimes } from "react-icons/fa";
import Split from "react-split";
import CodeMirror from "@uiw/react-codemirror";
import { debounce } from "lodash";

const SelfCodingEditorPreview = ({
  tabs,
  setTabs,
  activeTab,
  setActiveTab,
  selectedFilename,
  setSelectedFilename,
  selectedFileContent,
  setSelectedFileContent,
  folders,
  previewTabs,
  setPreviewTabs,
  activePreviewTab,
  setActivePreviewTab,
  previewSrcDoc,
  templateId,
  getLanguageExtension,
  templateDescriptions,
}) => {
  const editorRef = useRef(null);
  const debouncedLayout = debounce(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, 100);

  const handleSplitDragEnd = () => {
    if (editorRef.current) {
      requestAnimationFrame(() => {
        debouncedLayout();
      });
    }
  };

  return (
    <div className="flex-1 overflow-hidden" style={{ width: "100%", height: "100%" }}>
      <Split
        className="flex h-full"
        minSize={200}
        gutterSize={8}
        gutterClassName="gutter"
        snapOffset={20}
        onDragEnd={handleSplitDragEnd}
      >
        <div style={{ width: "100%", height: "100%" }}>
          {tabs.length > 0 ? (
            <div className="flex flex-col w-full h-full bg-white border-r border-gray-200">
              <div className="flex items-center overflow-x-auto bg-[#f3f3f3] border-b border-gray-300 px-2 py-1">
                {tabs.map((tab) => {
                  const fileName = tab.split("/").pop();
                  const emoji = templateDescriptions[templateId]?.emoji || "📄";
                  const isActive = tab === activeTab;
                  return (
                    <div
                      key={tab}
                      className={`flex items-center px-3 py-1 mr-1 rounded-t-md text-sm font-medium border cursor-pointer ${
                        isActive
                          ? "bg-white text-black border-t border-l border-r border-gray-300"
                          : "bg-[#e0e0e0] text-gray-600 hover:bg-[#d5d5d5] border border-transparent"
                      }`}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedFilename(tab);
                        const parts = tab.split("/");
                        let content = folders;
                        for (const p of parts) content = content[p];
                        setSelectedFileContent(content);
                      }}
                    >
                      <span className="mr-2">{emoji}</span>
                      <span>{fileName}</span>
                      <FaTimes
                        className="ml-2 text-xs hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTabs((prev) => prev.filter((t) => t !== tab));
                          if (activeTab === tab) {
                            const nextTab = tabs.find((t) => t !== tab);
                            setActiveTab(nextTab || "");
                            setSelectedFilename(nextTab || "");
                            if (nextTab) {
                              const parts = nextTab.split("/");
                              let content = folders;
                              for (const p of parts) content = content[p];
                              setSelectedFileContent(content);
                            } else {
                              setSelectedFileContent("");
                            }
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-1 text-xs text-gray-500 border-b border-gray-200 bg-white font-mono">
                {selectedFilename || "파일을 선택하세요"}
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <CodeMirror
                  ref={editorRef}
                  value={selectedFileContent}
                  height="100%"
                  theme="light"
                  extensions={[getLanguageExtension(selectedFilename)]}
                  onChange={(value) => setSelectedFileContent(value)}
                  basicSetup={{
                    lineNumbers: true,
                  }}
                  style={{
                    fontFamily: "'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                />
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>
        <div style={{ width: "100%", height: "100%" }}>
          {previewTabs.length > 0 ? (
            <div className="flex flex-col w-full h-full bg-white">
              <div className="flex items-center overflow-x-auto bg-[#f3f3f3] border-b border-gray-300 px-2 py-1">
                {previewTabs.map((tab) => {
                  const label = tab.split("/").slice(-1)[0];
                  const emoji = templateDescriptions[templateId]?.emoji || "📁";
                  const isActive = tab === activePreviewTab;
                  return (
                    <div
                      key={tab}
                      className={`flex items-center px-3 py-1 mr-1 rounded-t-md text-sm font-medium border cursor-pointer ${
                        isActive
                          ? "bg-white text-black border-t border-l border-r border-gray-300"
                          : "bg-[#e0e0e0] text-gray-600 hover:bg-[#d5d5d5] border border-transparent"
                      }`}
                      onClick={() => setActivePreviewTab(tab)}
                    >
                      <span className="mr-2">{emoji}</span>
                      <span>{label}</span>
                      <FaTimes
                        className="ml-2 text-xs hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTabs((prev) => prev.filter((t) => t !== tab));
                          if (activePreviewTab === tab) {
                            const nextTab = previewTabs.find((t) => t !== tab);
                            setActivePreviewTab(nextTab || null);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 p-4 overflow-auto">
                {activePreviewTab ? (
                  <iframe
                    title="preview"
                    srcDoc={previewSrcDoc}
                    className="w-full h-full border rounded"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">
                    프리뷰 탭이 열려있지 않습니다.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>
      </Split>
    </div>
  );
};

export default SelfCodingEditorPreview;