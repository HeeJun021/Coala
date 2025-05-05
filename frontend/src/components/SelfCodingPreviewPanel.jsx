import React from "react";
import { FaTimes } from "react-icons/fa";

const SelfCodingPreviewPanel = ({
  previewTabs,
  activePreviewTab,
  setActivePreviewTab,
  setPreviewTabs,
  previewSrcDoc,
  templateId,
  templateDescriptions,
}) => {
  return (
    <div className="flex flex-col w-full h-full bg-white">
      <div className="flex items-center overflow-x-auto bg-[#f3f3f3] border-b border-gray-300 px-2 py-1">
        {previewTabs.map((tab) => {
          const label = tab.split("/").slice(-1)[0];
          const emoji = templateDescriptions[templateId]?.emoji || "📄";
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
      <div className="flex-1 overflow-auto">
        {activePreviewTab && previewSrcDoc ? (
          <iframe
          title="preview"
          srcDoc={previewSrcDoc}
          className="w-full h-full border rounded"
          sandbox="allow-scripts allow-modals allow-same-origin"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">
            프리뷰 탭이 열려있지 않습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfCodingPreviewPanel;
