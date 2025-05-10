import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../Layout/Navbar";
import SelfCodingSidebar from "../components/SelfCodingSidebar";
import SelfCodingPanel from "../components/SelfCodingPanel";
import SelfCodingEditorPanel from "../components/SelfCodingEditorPanel";
import SelfCodingPreviewPanel from "../components/SelfCodingPreviewPanel";
import { templateDescriptions, templateFiles, getLanguageExtension } from "../data/templateData";
import "../index.css";
import Split from "react-split";
import { getCurrentUser, checkGithubConnection } from "../api/authApi";
import { updateCodeFile } from "../api/codeApi"; // ✅ 추가

const SelfCodingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("explorer");
  const [templateId, setTemplateId] = useState(null);
  const [folders, setFolders] = useState({ "내 파일": {} });

  // 탭 정보
  const [tabs, setTabs] = useState([]); // [{ tabId, filename, content }]
  const [activeTabId, setActiveTabId] = useState(null);

  // 파일 상태
  const [selectedFilename, setSelectedFilename] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [languageId, setLanguageId] = useState(null);
  const [unsaved, setUnsaved] = useState(false);
  const [selectedFolderId] = useState(null);

  // 미리보기 결과
  const [previewSrcDoc, setPreviewSrcDoc] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");

  // GitHub 연결 여부
  const [isGithubConnected, setIsGithubConnected] = useState(false);

  // ✅ 현재 탭 내용 서버에 저장하는 함수
  const handleSave = async () => {
    const currentTab = tabs.find((tab) => tab.tabId === activeTabId);
    if (!currentTab) return;

    const codeId = parseInt(currentTab.tabId.replace("code-", ""));
    await updateCodeFile(codeId, {
      content: selectedFileContent,
      language_id: languageId,
    });

    setUnsaved(false); // 저장 완료 후 상태 업데이트
  };

  const fetchUserAndGithubStatus = useCallback(async () => {
    try {
      await getCurrentUser();
      const githubStatus = await checkGithubConnection();
      console.log("GitHub Status:", githubStatus);
      setIsGithubConnected(githubStatus.isConnected);
      if (githubStatus.isConnected) {
        setActivePanel("git");
      }
    } catch (error) {
      console.error("Failed to fetch user or GitHub status:", error);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserAndGithubStatus();
  }, [fetchUserAndGithubStatus]);

  useEffect(() => {
    if (location.pathname === "/self-coding" && location.search.includes("code=")) {
      fetchUserAndGithubStatus();
    }
  }, [location, fetchUserAndGithubStatus]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Navbar />
      <div className="flex" style={{ height: "calc(100vh - 70px)" }}>
        <SelfCodingSidebar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          tabs={tabs}
          activeTabId={activeTabId}
          unsaved={unsaved}
          handleSave={handleSave} // ✅ 저장 함수 전달
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
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          previewSrcDoc={previewSrcDoc}
          setPreviewSrcDoc={setPreviewSrcDoc}
          selectedFilename={selectedFilename}
          setSelectedFilename={setSelectedFilename}
          selectedFileContent={selectedFileContent}
          setSelectedFileContent={setSelectedFileContent}
          location={location}
          templateFiles={templateFiles}
          templateDescriptions={templateDescriptions}
          isGithubConnected={isGithubConnected}
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
            activeTabId={activeTabId}
            setActiveTabId={setActiveTabId}
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
            setPreviewFilename={setPreviewFilename}
            currentFolderId={selectedFolderId}
          />
          <SelfCodingPreviewPanel
            previewFilename={previewFilename}
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
