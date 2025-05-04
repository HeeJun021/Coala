import React from "react";
import SelfCodingExplorerPanel from "./SelfCodingExplorerPanel";
import SelfCodingGitPanel from "./SelfCodingGitPanel";
import SelfCodingSavePanel from "./SelfCodingSavePanel";

const SelfCodingPanel = ({
  activePanel,
  navigate,
  templateId,
  setTemplateId,
  folders,
  setFolders,
  tabs,
  setTabs,
  activeTab,
  setActiveTab,
  previewTabs,
  setPreviewTabs,
  activePreviewTab,
  setActivePreviewTab,
  previewSrcDoc,
  setPreviewSrcDoc,
  selectedFilename,
  setSelectedFilename,
  selectedFileContent,
  setSelectedFileContent,
  location,
  templateFiles,
  templateDescriptions,
  isGithubConnected,
}) => {
  return (
    <div className="w-64 bg-[#f3f3f3] border-r border-gray-300 p-4 overflow-auto">
      {activePanel === "explorer" && (
        <SelfCodingExplorerPanel
          navigate={navigate}
          templateId={templateId}
          setTemplateId={setTemplateId}
          folders={folders}
          setFolders={setFolders}
          tabs={tabs}
          setTabs={setTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          previewTabs={previewTabs}
          setPreviewTabs={setPreviewTabs}
          activePreviewTab={activePreviewTab}
          setActivePreviewTab={setActivePreviewTab}
          previewSrcDoc={previewSrcDoc}
          setPreviewSrcDoc={setPreviewSrcDoc}
          selectedFilename={selectedFilename}
          setSelectedFilename={setSelectedFilename}
          selectedFileContent={selectedFileContent}
          setSelectedFileContent={setSelectedFileContent}
          location={location}
          templateFiles={templateFiles}
          templateDescriptions={templateDescriptions}
        />
      )}
      {activePanel === "git" && (
        <SelfCodingGitPanel isGithubConnected={isGithubConnected} />
      )}
      {activePanel === "save" && (
        <SelfCodingSavePanel />
      )}
    </div>
  );
};

export default SelfCodingPanel;