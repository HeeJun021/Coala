import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../Layout/Navbar";
import SelfCodingSidebar from "../components/SelfCodingSidebar";
import SelfCodingPanel from "../components/SelfCodingPanel";
import SelfCodingEditorPreview from "../components/SelfCodingEditorPreview";
import { templateDescriptions, templateFiles, getLanguageExtension } from "../data/templateData";
import "../index.css";

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
        <SelfCodingEditorPreview
          tabs={tabs}
          setTabs={setTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedFilename={selectedFilename}
          setSelectedFilename={setSelectedFilename}
          selectedFileContent={selectedFileContent}
          setSelectedFileContent={setSelectedFileContent}
          folders={folders}
          previewTabs={previewTabs}
          setPreviewTabs={setPreviewTabs}
          activePreviewTab={activePreviewTab}
          setActivePreviewTab={setActivePreviewTab}
          previewSrcDoc={previewSrcDoc}
          templateId={templateId}
          getLanguageExtension={getLanguageExtension}
          templateDescriptions={templateDescriptions}
        />
      </div>
    </div>
  );
};

export default SelfCodingPage;