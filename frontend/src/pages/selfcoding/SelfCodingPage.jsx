import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../Layout/Navbar";
import SelfCodingSidebar from "../../components/selfcoding/SelfCodingSidebar";
import SelfCodingPanel from "../../components/selfcoding/SelfCodingPanel";
import SelfCodingEditorPanel from "../../components/selfcoding/SelfCodingEditorPanel";
import SelfCodingPreviewPanel from "../../components/selfcoding/SelfCodingPreviewPanel";
import { templateDescriptions, templateFiles, getLanguageExtension } from "../../data/templateData";
import "../../index.css";
import Split from "react-split";
import { getCurrentUser, checkGithubConnection } from "../../api/authApi";
import { getRootCodeFolder, updateCodeFile, getChildFolders, getCodesInFolder } from "../../api/codeApi";

const SelfCodingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // URL state에서 전달된 panel 초기화
  const initialPanel = location.state?.panel || "explorer";
  const [activePanel, setActivePanel] = useState(initialPanel);

  const [templateId, setTemplateId] = useState(null);
  const [folders, setFolders] = useState({ "내 파일": {} });
  const [rootFolderId, setRootFolderId] = useState(null);

  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [selectedFilename, setSelectedFilename] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [languageId, setLanguageId] = useState(null);
  const [unsaved, setUnsaved] = useState(false);
  const [selectedFolderId] = useState(null);

  const [previewSrcDoc, setPreviewSrcDoc] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");
  const [isGithubConnected, setIsGithubConnected] = useState(false);

  const handleSave = async () => {
    const currentTab = tabs.find((tab) => tab.tabId === activeTabId);
    if (!currentTab) return;

    const codeId = parseInt(currentTab.tabId.replace("code-", ""));
    await updateCodeFile(codeId, {
      content: selectedFileContent,
      language_id: languageId,
    });

    setUnsaved(false);
  };

  const reloadFolderTree = async () => {
    try {
      const root = await getRootCodeFolder();
      const [children, codes] = await Promise.all([
        getChildFolders(root.folder_id),
        getCodesInFolder(root.folder_id),
      ]);

      setFolders({
        ...root,
        children: children.map((child) => ({
          ...child,
          children: [],
          codes: [],
          expanded: false,
          loaded: false,
        })),
        codes,
        expanded: true,
        loaded: true,
      });
    } catch (err) {
      console.error("탐색기 갱신 실패", err);
    }
  };

  const fetchUserAndGithubStatus = useCallback(async () => {
  try {
    await getCurrentUser();
    const githubStatus = await checkGithubConnection();
    setIsGithubConnected(githubStatus.isConnected);

    // location.state?.panel이 있으면 그걸 우선 적용
    const requestedPanel = location.state?.panel;
    if (requestedPanel) {
      setActivePanel(requestedPanel);
    } else if (githubStatus.isConnected) {
      setActivePanel("explorer");
    }
  } catch (error) {
    console.error("Failed to fetch user or GitHub status:", error);
    navigate("/login");
  }
}, [navigate, location.state?.panel]);

  useEffect(() => {
    fetchUserAndGithubStatus();

    const loadRoot = async () => {
      try {
        const root = await getRootCodeFolder();
        setRootFolderId(root.folder_id);
      } catch (err) {
        console.error("루트 폴더 불러오기 실패", err);
      }
    };
    loadRoot();
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
          selectedFilename={selectedFilename}
          selectedFileContent={selectedFileContent}
          handleSave={handleSave}
          setTabs={setTabs}
          setActiveTabId={setActiveTabId}
          rootFolderId={rootFolderId}
          reloadFolderTree={reloadFolderTree}
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
          reloadFolderTree={reloadFolderTree}
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
