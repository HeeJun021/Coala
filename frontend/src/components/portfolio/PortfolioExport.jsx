// src/components/portfolio/PortfolioExport.jsx
import React, { useEffect, useState, useCallback } from "react";
import NotionConnectPanel from "./NotionConnectPanel";
import PortfolioFilterPanel from "./PortfolioFilterPanel";
import { getNotionStatus, disconnectNotion, publishToNotion } from "../../api/notionApi";
import { getMyProjects } from "../../api/projectApi";
import { X, Upload, MapPin } from "lucide-react";
import NotionTemplateSelectModal from "./NotionTemplateSelectModal";
import NotionTargetPageSelectModal from "./NotionTargetPageSelectModal";

export default function PortfolioExport() {
  // 연결 상태
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);

  // 프로젝트/필터
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [filters, setFilters] = useState({});

  // 선택 상태: 템플릿/대상 페이지/제목
  const [templateId, setTemplateId] = useState(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [targetPageId, setTargetPageId] = useState(null);
  const [targetPageTitle, setTargetPageTitle] = useState("");
  const [pageTitle, setPageTitle] = useState("");

  // 모달
  const [tplOpen, setTplOpen] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);

  const [publishing, setPublishing] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotionStatus();
      setConnected(!!data?.connected);
      setWorkspaceName(data?.workspace_name || "");
    } catch {
      setConnected(false);
      setWorkspaceName("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  useEffect(() => {
    if (!connected) return;
    (async () => {
      try {
        setProjectsLoading(true);
        const list = await getMyProjects();
        setProjects(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("프로젝트 로드 실패:", e);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    })();
  }, [connected]);

  const handleDisconnect = useCallback(async () => {
    if (!connected || disconnecting) return;
    try {
      setDisconnecting(true);
      await disconnectNotion();
      await refreshStatus();
      // 선택 초기화
      setTemplateId(null); setTemplateTitle("");
      setTargetPageId(null); setTargetPageTitle("");
    } catch (err) {
      console.error("노션 연동 해제 실패:", err);
      alert("노션 연동 해제에 실패했어요.");
    } finally {
      setDisconnecting(false);
    }
  }, [connected, disconnecting, refreshStatus]);

  const handlePublish = useCallback(async () => {
    if (!templateId) return alert("템플릿을 선택하세요.");
    if (!targetPageId) return alert("붙여넣을 노션 페이지를 선택하세요.");
    if (!pageTitle.trim()) return alert("생성될 페이지 제목을 입력하세요.");

    try {
      setPublishing(true);
      const res = await publishToNotion({
        template_id: templateId,
        target_page_id: targetPageId,
        title: pageTitle.trim(),
        filters: filters || {},
      });
      if (res?.ok) {
        alert("노션에 성공적으로 퍼블리시되었습니다.");
      } else {
        alert("퍼블리시에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("퍼블리시에 실패했습니다. 권한/공유 설정을 확인하세요.");
    } finally {
      setPublishing(false);
    }
  }, [templateId, targetPageId, pageTitle, filters]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="animate-pulse text-gray-500">상태 확인 중...</div>
      </div>
    );
  }

  if (!connected) {
    return (
      <NotionConnectPanel
        connected={false}
        onConnectedChange={(v) => {
          if (v) {
            setConnected(true);
            refreshStatus();
          }
        }}
      />
    );
  }

  return (
    <div className="relative">
      {/* 상단 상태 바 */}
      <div className="w-full max-w-6xl mx-auto mb-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="text-sm font-semibold">노션 연결됨</span>
          {workspaceName ? <span className="text-sm">({workspaceName})</span> : null}
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
            disconnecting ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
          }`}
          title="노션 연동 해제"
        >
          <X size={16} />
          {disconnecting ? "해제 중..." : "연결 해제"}
        </button>
      </div>

      {/* 카드 */}
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        {/* 필터 */}
        <div className="mb-2">
          {projectsLoading && <div className="text-sm text-gray-500 mb-4">프로젝트 불러오는 중...</div>}
          <PortfolioFilterPanel projects={projects} onFiltersChange={setFilters} />
        </div>

        <div className="h-px bg-gray-200 my-8" />

        {/* 템플릿/대상 선택 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              템플릿 선택 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTplOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-3 rounded-md border bg-white hover:bg-gray-50"
              >
                템플릿 검색/선택
              </button>
              {templateTitle && (
                <span className="inline-flex items-center gap-2 text-sm px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                  선택됨: {templateTitle}
                  <button
                    className="ml-1 text-emerald-700/70 hover:text-emerald-900"
                    onClick={() => { setTemplateId(null); setTemplateTitle(""); }}
                    title="선택 해제"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              붙여넣을 페이지 선택 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setPageOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-3 rounded-md border bg-white hover:bg-gray-50"
              >
                <MapPin className="w-4 h-4" /> 대상 페이지 선택
              </button>
              {targetPageTitle && (
                <span className="inline-flex items-center gap-2 text-sm px-2.5 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-700">
                  선택됨: {targetPageTitle}
                  <button
                    className="ml-1 text-sky-700/70 hover:text-sky-900"
                    onClick={() => { setTargetPageId(null); setTargetPageTitle(""); }}
                    title="선택 해제"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 제목 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            생성될 페이지 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            placeholder="예) 2025 포트폴리오 - 홍길동"
            className="w-full mb-2 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <p className="text-xs text-gray-500">
            대상 페이지는 노션에서 코알라 통합앱에 <b>공유(초대)</b>되어 있어야 합니다.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8">
          <button
            onClick={handlePublish}
            disabled={publishing}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition ${
              publishing ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-md"
            }`}
          >
            <Upload size={18} />
            {publishing ? "노션에 퍼블리시 중..." : "노션에 퍼블리시"}
          </button>
        </div>
      </div>

      {/* 모달들 */}
      <NotionTemplateSelectModal
        open={tplOpen}
        onClose={() => setTplOpen(false)}
        onSelect={(id, title) => { setTemplateId(id); setTemplateTitle(title); setTplOpen(false); }}
      />
      <NotionTargetPageSelectModal
        open={pageOpen}
        onClose={() => setPageOpen(false)}
        onSelect={(id, title) => { setTargetPageId(id); setTargetPageTitle(title); setPageOpen(false); }}
      />
    </div>
  );
}
