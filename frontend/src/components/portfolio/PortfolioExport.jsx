// src/components/portfolio/PortfolioExport.jsx
import React, { useEffect, useState, useCallback } from "react";
import NotionConnectPanel from "./NotionConnectPanel";
import PortfolioFilterPanel from "./PortfolioFilterPanel";
import { getNotionStatus, disconnectNotion, publishToNotion } from "../../api/notionApi";
import { getMyProjects } from "../../api/projectApi";
import { X, Upload, MapPin, Layers, CheckCircle2, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import NotionTemplateSelectModal from "./NotionTemplateSelectModal";
import NotionTargetPageSelectModal from "./NotionTargetPageSelectModal";

function PublishProgressModal({
  open,
  status = "loading", // "loading" | "success" | "error"
  title,
  subtitle,
  onClose,
  onOpenNotion, // optional
}) {
  if (!open) return null;

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 p-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full border flex items-center justify-center
              ${isLoading ? "bg-emerald-50 border-emerald-200" : ""}
              ${isSuccess ? "bg-emerald-50 border-emerald-200" : ""}
              ${isError ? "bg-rose-50 border-rose-200" : ""}`}>
            {isLoading && <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />}
            {isSuccess && <CheckCircle2 className="w-7 h-7 text-emerald-600" />}
            {isError && <AlertTriangle className="w-7 h-7 text-rose-600" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isLoading ? (title || "노션에 퍼블리시 중…")
               : isSuccess ? "노션에 성공적으로 퍼블리시되었습니다."
               : "퍼블리시에 실패했습니다."}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoading ? (subtitle || "잠시만 기다려 주세요. 완료되면 자동으로 상태가 바뀝니다.")
               : isSuccess ? "아래 버튼으로 노션에서 결과를 확인할 수 있어요."
               : "권한/공유 설정 또는 네트워크 상태를 확인한 뒤 다시 시도해 주세요."}
            </p>
          </div>
        </div>

        {/* 진행 안내 (로딩시에만) */}
        {isLoading && (
          <div className="mt-5">
            <ul className="mt-4 text-xs text-gray-500 space-y-1 list-disc list-inside">
              <li>템플릿 로딩</li>
              <li>데이터 바인딩 및 AI 설명 적용</li>
              <li>노션 페이지에 블록 삽입</li>
            </ul>
          </div>
        )}

        {/* 액션 */}
        <div className="mt-6 flex items-center justify-end gap-2">
          {isSuccess && (
            <>
              {onOpenNotion && (
                <button
                  onClick={onOpenNotion}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                >
                  노션에서 열기 <ExternalLink className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-gray-700"
              >
                닫기
              </button>
            </>
          )}

          {isError && (
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-gray-700"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


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

  const [aiNotes, setAiNotes] = useState("");

  const [publishStatus, setPublishStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
 const [publishModalOpen, setPublishModalOpen] = useState(false);
 const [publishedPageUrl, setPublishedPageUrl] = useState("");
 const [publishedPageId, setPublishedPageId] = useState("");

  // 템플릿 선택 시 상태 반영
const handleSelectTemplate = useCallback((id, title) => {
   setTemplateId(id ?? null);
   setTemplateTitle(title ?? "");
   setTplOpen(false);
 }, []);

// 대상 페이지 선택 시 상태 반영
const handleSelectTarget = useCallback((id, title) => {
   setTargetPageId(id ?? null);
   setTargetPageTitle(title ?? "");
   setPageOpen(false);
 }, []);

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
      setPublishModalOpen(true);
      setPublishStatus("loading");
      setPublishedPageUrl("");
      setPublishedPageId("");
      const res = await publishToNotion({
   template_id: templateId,
   target_page_id: targetPageId,
   title: pageTitle.trim(),
   filters: { ...filters, ai_notes: aiNotes }, // Export의 메모 반영
 });
      if (res?.ok) {
        // 백엔드 응답 형식에 맞게 page_url / page_id 추출
        const url = res.page_url || res.url || "";
        const pid = res.page_id || res.id || "";
        setPublishedPageUrl(url);
        setPublishedPageId(pid);
        setPublishStatus("success");
      } else {
        setPublishStatus("error");
      }
    } catch (e) {
      console.error(e);
      setPublishStatus("error");
    } finally {
      setPublishing(false);
    }
  }, [templateId, targetPageId, pageTitle, filters, aiNotes]);

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
  <div>
    {/* 상단 히어로/스텝퍼 */}
    
    <div className="bg-gradient-to-b">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
   {/* 좌: 타이틀 */}
   <div>
     <h1 className="text-2xl font-bold text-gray-900">포트폴리오 퍼블리시</h1>
     <p className="text-sm text-gray-500 mt-1">
       프로젝트를 선택하고 템플릿과 대상 페이지를 정한 뒤 노션으로 퍼블리시하세요.
     </p>
   </div>

   {/* 우: 노션 연결 상태 + 해제 */}
   {connected && (
     <div className="flex items-center gap-4">
       <div className="inline-flex items-center gap-2 text-sm text-emerald-700" title="노션 연결 상태">
         <CheckCircle2 className="w-4 h-4" />
         <span>노션 연결됨{workspaceName ? ` · ${workspaceName}` : ""}</span>
       </div>
       <button
         type="button"
         onClick={handleDisconnect}
         className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600"
         title="노션 연동 해제"
       >
         <X className="w-4 h-4" />
         연동 해제
       </button>
     </div>
   )}
 </div>

        {/* 스텝퍼 */}
        <ol className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
          {["제목","대상 페이지","템플릿","필터","퍼블리시"].map((label, i) => {
            const step = i + 1;
            // 간단한 진행상태: 선택/입력 여부로 색상만 달리 표시
            const done =
     (step === 1 && !!(pageTitle?.trim())) ||
     (step === 2 && !!targetPageId) ||
     (step === 3 && !!templateId) ||
     (step === 4 && (filters?.project_ids?.length > 0)) ||
     false;
            return (
              <li
                key={label}
                className={[
                  "inline-flex items-center gap-2 px-2.5 py-1 rounded-full border",
                  done
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-gray-100 border-gray-200 text-gray-700"
                ].join(" ")}
              >
                <span className="w-5 h-5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold bg-white border border-gray-200">
                  {step}
                </span>
                {label}
              </li>
            );
          })}
        </ol>
      </div>
    </div>

    {/* 본문 12col 레이아웃 */}
    <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
      {/* 좌측 메인 */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {/* 연결 안 됨 → Connect 패널만 */}
        {!connected ? (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">노션 계정 연결 필요</h2>
            <p className="text-sm text-gray-500 mb-4">
              퍼블리시하려면 먼저 노션 계정을 연결해주세요.
            </p>
            <NotionConnectPanel onDisconnect={refreshStatus} onConnected={refreshStatus} />
          </div>
        ) : (
          <>
          {/* 섹션 카드: 제목/대상/템플릿 묶음 (1-3단계) */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-xl">
              <header className="px-6 pt-5 pb-3 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">
      포트폴리오 페이지 설정
    </h3>
              </header>

              <div className="p-6 space-y-5">
                {/* 1) 제목 */}
 <div className="flex flex-col gap-2">
   <span className="text-sm text-gray-600">노션 페이지 제목</span>
   <input
     value={pageTitle}
     onChange={(e) => setPageTitle(e.target.value)}
     placeholder="예: 엘리베이터형 자판기 시스템 – 포트폴리오"
     className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
   />
 </div>

 {/* 2) 대상 페이지 */}
 <div className="flex flex-col gap-2">
   <span className="text-sm text-gray-600">대상 페이지</span>
   <button
     type="button"
     onClick={() => setPageOpen(true)}
     className="h-10 inline-flex items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-3 text-sm hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
   >
     <div className="truncate text-left flex items-center gap-2">
       <MapPin className="w-4 h-4 text-yellow-500" />
       <span className="truncate">{targetPageTitle || "붙여넣을 대상 페이지 선택"}</span>
     </div>
     <span className="text-[11px] text-gray-400">{targetPageId ? "선택됨" : ""}</span>
   </button>
 </div>

 {/* 3) 템플릿 */}
 <div className="flex flex-col gap-2">
   <span className="text-sm text-gray-600">템플릿</span>
   <button
     type="button"
     onClick={() => setTplOpen(true)}
     className="h-10 inline-flex items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-3 text-sm hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
   >
     <div className="truncate text-left flex items-center gap-2">
       <Layers className="text-emerald-600 w-4 h-4" />
       <span className="truncate">{templateTitle || "템플릿 검색/선택"}</span>
     </div>
     <span className="text-[11px] text-gray-400">{templateId ? "선택됨" : ""}</span>
   </button>
 </div>
{/* 4) AI 설명 입력 (새로 추가) */}
<div className="flex flex-col gap-2">
      <span className="text-sm text-gray-600">AI 설명 입력</span>
      <textarea
        value={aiNotes}
        onChange={(e) => setAiNotes(e.target.value)}
        rows={4}
        placeholder={"예:\n- 프론트엔드 중심으로 내 역할을 강조해줘.\n- 내가 맡은 기능을 간단히 정리해줘.\n- 협업 과정과 사용 기술을 자연스럽게 언급해줘."}
        className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-y"
      />
      <div className="mt-1 text-xs text-gray-400">{aiNotes.length}자 입력됨</div>
    </div>
              
              </div>
            </section>
            {/* 섹션 카드: 필터 + 퍼블리시 (4-5단계) */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-xl">
              <header className="px-6 pt-5 pb-3 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">프로젝트 범위 설정</h3>
              </header>
              <div className="p-6">
                <PortfolioFilterPanel projects={projects} onFiltersChange={setFilters} showAINotes={false} />

    {/* ✅ 퍼블리시 버튼을 이곳으로 이동 */}
    <div className="pt-4">
      <button
        type="button"
        onClick={handlePublish}
        disabled={
          publishing ||
          !(filters?.project_ids?.length > 0 && templateId && targetPageId && pageTitle?.trim())
        }
        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition ${
          publishing
            ? "bg-emerald-400 cursor-not-allowed"
            : "bg-emerald-600 hover:bg-emerald-700 shadow-lg"
        }`}
      >
        <><Upload className="w-4 h-4" /> 노션에 퍼블리시</>
      </button>
    </div>
              </div>
            </section>

            
          </>
        )}
      </div>

      {/* 우측 요약(Sticky) */}
      <aside className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-6 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-lg p-5">
            <h4 className="text-sm font-semibold text-gray-900">요약</h4>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="w-16 shrink-0 text-gray-500">프로젝트</span>
                <div className="flex-1 text-gray-900">
                  {(() => {
                    const pid = filters?.project_ids?.[0];
                    const found = (projects || []).find((p) => (p?.id ?? p?.project_id) === pid);
                    const name = found?.name ?? found?.project_name ?? "(미선택)";
                    return name || "(미선택)";
                  })()}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-16 shrink-0 text-gray-500">역할</span>
               <div className="flex-1">
                  {Array.isArray(filters?.my_roles) && filters.my_roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filters.my_roles.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded-full text-xs border bg-gray-50 text-gray-700"
                          title={r}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">없음</span>
                  )}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-16 shrink-0 text-gray-500">템플릿</span>
                <div className="flex-1 text-gray-900">
                  {templateTitle || "(미선택)"}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-16 shrink-0 text-gray-500">대상</span>
                <div className="flex-1 text-gray-900">
                  {targetPageTitle || "(미선택)"}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-16 shrink-0 text-gray-500">제목</span>
                <div className="flex-1 text-gray-900">
                  {pageTitle?.trim() || "(미입력)"}
                </div>
              </li>
            </ul>

            {/* 간단한 유효성 가이드 */}
            <div className="mt-4 text-xs text-gray-500">
              필수: 프로젝트 1개, 템플릿, 대상 페이지, 제목
            </div>
          </section>
        </div>
      </aside>
    </div>

    {/* 기존 모달 호출은 그대로 */}
    <NotionTemplateSelectModal open={tplOpen} onClose={() => setTplOpen(false)} onSelect={handleSelectTemplate} />

    <NotionTargetPageSelectModal open={pageOpen} onClose={() => setPageOpen(false)} onSelect={handleSelectTarget} />

      <PublishProgressModal
  open={publishModalOpen}
  status={publishStatus}
  title="노션에 퍼블리시 중…"
  subtitle={
    [pageTitle && `제목: ${pageTitle}`, templateTitle && `템플릿: ${templateTitle}`, targetPageTitle && `대상: ${targetPageTitle}`]
      .filter(Boolean)
      .join(" · ")
  }
  onClose={() => {
    setPublishModalOpen(false);
    setPublishStatus("idle");
  }}
  onOpenNotion={() => {
    if (publishedPageUrl) {
      window.open(publishedPageUrl, "_blank", "noopener,noreferrer");
    } else if (publishedPageId) {
      // 페이지 ID만 있을 경우 노션 URL 구성 (공유 설정에 따라 접근 제한될 수 있음)
      const compact = String(publishedPageId).replace(/-/g, "");
      window.open(`https://www.notion.so/${compact}`, "_blank", "noopener,noreferrer");
    }
  }}
/>
  </div>
);
}
