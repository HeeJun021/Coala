import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../Layout/Navbar";
import SelfCodingSidebar from "../components/SelfCodingSidebar";
import SelfCodingPanel from "../components/SelfCodingPanel";
import SelfCodingEditorPanel from "../components/SelfCodingEditorPanel";
import SelfCodingPreviewPanel from "../components/SelfCodingPreviewPanel";
import { templateDescriptions, templateFiles, getLanguageExtension } from "../data/templateData";
import "../index.css";
import Split from "react-split";

const SelfCodingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("explorer");
  const [templateId, setTemplateId] = useState(null);
  const [folders, setFolders] = useState({ "내 파일": {} });
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [previewTabs, setPreviewTabs] = useState([]);
  const [activePreviewTab, setActivePreviewTab] = useState(null);
  const [previewSrcDoc, setPreviewSrcDoc] = useState("");
  const [selectedFilename, setSelectedFilename] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  const [languageId, setLanguageId] = useState(null);
  const [selectedFolderId] = useState(null);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Navbar />
      <div className="flex" style={{ height: "calc(100vh - 70px)" }}>
        <SelfCodingSidebar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
        />
        <SelfCodingPanel
          activePanel={activePanel}
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
          isGithubConnected={false}
        />
        <Split
          className="flex flex-1"
          direction="horizontal"
          sizes={[50, 50]}
          minSize={200}
          gutterSize={8}
          gutterClassName="gutter"
        >
          <SelfCodingEditorPanel
            tabs={tabs}
            setTabs={setTabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedFilename={selectedFilename}
            setSelectedFilename={setSelectedFilename}
            selectedFileContent={selectedFileContent}
            setSelectedFileContent={setSelectedFileContent}
            templateId={templateId}
            getLanguageExtension={getLanguageExtension}
            templateDescriptions={templateDescriptions}
            setUnsaved={setUnsaved}
            unsaved={unsaved}
            languageId={languageId}
            setLanguageId={setLanguageId}
            setPreviewSrcDoc={setPreviewSrcDoc}
            setPreviewTabs={setPreviewTabs}
            setActivePreviewTab={setActivePreviewTab}
            currentFolderId={selectedFolderId}
          />
          <SelfCodingPreviewPanel
            previewTabs={previewTabs}
            setPreviewTabs={setPreviewTabs}
            activePreviewTab={activePreviewTab}
            setActivePreviewTab={setActivePreviewTab}
            previewSrcDoc={previewSrcDoc}
            templateId={templateId}
            templateDescriptions={templateDescriptions}
          />
        </Split>
      </div>
    </div>
  );
};

export default SelfCodingPage;
