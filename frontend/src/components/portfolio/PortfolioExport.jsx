// frontend/src/components/portfolio/PortfolioExport.jsx
import React, { useEffect, useState, useCallback } from "react";
import NotionConnectPanel from "./NotionConnectPanel";
import PortfolioFilterPanel from "./PortfolioFilterPanel";
import { getNotionStatus, disconnectNotion } from "../../api/notionApi";
import { exportToNotion } from "../../api/notionExportApi.ts";
import { getMyProjects } from "../../api/projectApi";
import { X, Upload } from "lucide-react";
import NotionTemplateSelectModal from "./NotionTemplateSelectModal";

export default function PortfolioExport() {
  // 연결 및 상태
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);

  // 프로젝트 목록
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // 필터 (하위에서 올려줌)
  const [filters, setFilters] = useState({});

  // 내보내기 입력 상태
  const [templateUrlOrId, setTemplateUrlOrId] = useState("");
  const [selectedTemplateTitle, setSelectedTemplateTitle] = useState("");
  const [pageTitle, setPageTitle] = useState("");

  const [exporting, setExporting] = useState(false);

  // 템플릿 모달/목록 상태
  const [tplOpen, setTplOpen] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotionStatus();
      setConnected(!!data?.connected);
      setWorkspaceName(data?.workspace_name || "");
    } catch (err) {
      console.error(err);
      setConnected(false);
      setWorkspaceName("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // 프로젝트 로딩
  useEffect(() => {
    if (!connected) return;
    (async () => {
      try {
        setProjectsLoading(true);
        const list = await getMyProjects();
        setProjects(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("프로젝트 목록 불러오기 실패:", e);
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
    } catch (err) {
      console.error("노션 연동 해제 실패:", err);
      alert("노션 연동 해제에 실패했어요. 콘솔 로그를 확인해주세요.");
    } finally {
      setDisconnecting(false);
    }
  }, [connected, disconnecting, refreshStatus]);

  const handleExport = useCallback(async () => {
    if (!templateUrlOrId.trim() || !pageTitle.trim()) {
      alert("템플릿과 페이지 제목은 필수입니다.");
      return;
    }
    if (!connected) {
      alert("노션 연동이 필요합니다.");
      return;
    }
    try {
      setExporting(true);
      const result = await exportToNotion({
        template_url_or_id: templateUrlOrId.trim(), // ✅ 선택된 템플릿의 페이지 ID를 넣음
        title: pageTitle.trim(),
        filters: filters || {},
      });
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        alert("생성된 페이지 URL을 받지 못했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("노션 내보내기에 실패했습니다. 템플릿/부모 권한을 확인해주세요.");
    } finally {
      setExporting(false);
    }
  }, [connected, templateUrlOrId, pageTitle, filters]);

  // ---------- UI ----------
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
          {workspaceName ? (
            <span className="text-sm">({workspaceName})</span>
          ) : null}
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition
            ${
              disconnecting
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
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
        {/* 필터 (프로젝트/레이아웃/톤/AI메모) */}
        <div className="mb-2">
          {projectsLoading ? (
            <div className="text-sm text-gray-500 mb-4">
              프로젝트 목록 불러오는 중...
            </div>
          ) : null}
          <PortfolioFilterPanel
            projects={projects}
            onFiltersChange={(next) => setFilters(next)}
          />
        </div>

        {/* 구분선 */}
        <div className="h-px bg-gray-200 my-8" />

        {/* 노션 내보내기 설정 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">노션 내보내기 설정</h2>

          {/* 템플릿 선택 (모달) */}
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
            {selectedTemplateTitle && (
              <span className="inline-flex items-center gap-2 text-sm px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                선택됨: {selectedTemplateTitle}
                <button
                  className="ml-1 text-emerald-700/70 hover:text-emerald-900"
                  onClick={() => {
                    setTemplateUrlOrId("");
                    setSelectedTemplateTitle("");
                  }}
                  title="선택 해제"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          {/* (선택/백업) 직접 입력란 유지 — 선택 시 ID 자동 주입 */}
          <input
            type="text"
            value={templateUrlOrId}
            readOnly
            placeholder="템플릿 페이지 URL 또는 ID (템플릿 선택 시 자동 입력)"
            className="w-full mb-4 px-3 py-2 border rounded-xl bg-gray-100 text-gray-600 cursor-default focus:ring-0"
          />

          {/* 제목 */}
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
            템플릿/부모(페이지·데이터베이스)는 노션에서 코알라 통합앱에{" "}
            <b>공유(초대)</b>되어 있어야 합니다.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8">
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition
              ${
                exporting
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 shadow-md"
              }
            `}
          >
            <Upload size={18} />
            {exporting ? "노션으로 내보내는 중..." : "노션으로 내보내기"}
          </button>
        </div>
      </div>

      {/* 템플릿 선택 모달 (분리 컴포넌트) */}
      <NotionTemplateSelectModal
        open={tplOpen}
        onClose={() => setTplOpen(false)}
        onSelect={(id, title) => {
          setTemplateUrlOrId(id);
          setSelectedTemplateTitle(title);
          setTplOpen(false);
        }}
      />
    </div>
  );
}
