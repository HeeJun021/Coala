import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  getFile,
  saveFile,
  stagePaths,
  commitChanges,
  getStatus,
} from "../../api/project_gitApi";
import { runProjectJs, runProjectPython } from "../../api/projectPreviewApi";
import ProjectGitExplorerPanel from "./projectgit/ProjectGitExploerPanel";
import ProjectGitPreviewPanel from "./projectgit/ProjectGitPreviewPanel";
import CommitModal from "./projectgit/CommitModal";
import { useNavigate, useParams } from "react-router-dom";

// CodeMirror v6
import CodeMirror from "@uiw/react-codemirror";
import { githubLight } from "@uiw/codemirror-theme-github";
import { javascript } from "@codemirror/lang-javascript";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { python as pythonLang } from "@codemirror/lang-python";
import { keymap } from "@codemirror/view";

export default function CodeEditorPanel({ project, branch, onBranchChange }) {
  const projectId = project?.project_id;
  const navigate = useNavigate();
  const { id: routeId, projectId: routeProjectId } = useParams();
  const pid = project?.project_id ?? routeProjectId ?? routeId;

  // UI/State
  const [showExplorer, setShowExplorer] = useState(true);
  const sidebarWidth = showExplorer ? 260 : 36;

  const [activePath, setActivePath] = useState("");
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [baseSha, setBaseSha] = useState(null);
  const [encoding, setEncoding] = useState("utf-8");

  const [status, setStatus] = useState({
    staged: [],
    unstaged: [],
    has_uncommitted: false,
  });

  const [previewSrcDoc, setPreviewSrcDoc] = useState(null);
  const [previewFilename, setPreviewFilename] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);

  // Git 연결 불가 상태
  const [gitUnavailable, setGitUnavailable] = useState(false);
  const [gitErrMsg, setGitErrMsg] = useState("");

  // 공통: 404/409/400 등을 Git 미연결로 전환
  const handleGit404 = useCallback((error, fallbackMsg) => {
    const st = error?.response?.status;
    if (st === 404 || st === 409 || st === 400) {
      setGitUnavailable(true);
      setGitErrMsg(
        error?.response?.data?.detail ||
          fallbackMsg ||
          "이 프로젝트에 연결된 Git 저장소를 찾을 수 없습니다."
      );
      // 에디터/상태 초기화
      setActivePath("");
      setContent("");
      setOriginalContent("");
      setBaseSha(null);
      setStatus({ staged: [], unstaged: [], has_uncommitted: false });
      return true; // handled
    }
    return false; // not handled
  }, []);

  // 변경 여부
  const unsaved = useMemo(
    () => content !== originalContent,
    [content, originalContent]
  );

  // 현재 파일 확장자
  const ext = useMemo(
    () => activePath?.split(".").pop()?.toLowerCase() || "",
    [activePath]
  );

  // 실행 가능 확장자
  const isRunnable = useMemo(() => {
    if (!activePath) return false;
    return ["js", "py", "html"].includes(ext);
  }, [activePath, ext]);

  // CodeMirror 언어 확장
  const cmLangExtensions = useMemo(() => {
    switch (ext) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return [javascript({ jsx: true, typescript: ext.startsWith("ts") })];
      case "html":
        return [htmlLang()];
      case "css":
        return [cssLang()];
      case "py":
        return [pythonLang()];
      default:
        return [];
    }
  }, [ext]);

  // 상태 조회
  const refreshStatus = useCallback(async () => {
    if (!projectId || !branch) return;
    try {
      const s = await getStatus(projectId, { branch });
      setStatus(s);
      setGitUnavailable(false);
      setGitErrMsg("");
    } catch (e) {
      if (handleGit404(e, "Git 상태를 불러올 수 없습니다. Git 패널에서 저장소를 초기화하세요.")) {
        return;
      }
      console.error("[Git] 상태 조회 실패:", e);
      setGitUnavailable(true);
      setGitErrMsg("Git 상태를 불러오는 중 오류가 발생했습니다.");
    }
  }, [projectId, branch, handleGit404]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // 파일 열기
  const handleOpenFile = async (path, fileData) => {
    if (gitUnavailable) return;
    try {
      setActivePath(path);
      const file = fileData || (await getFile(projectId, { path, branch }));
      const nextContent = file?.content ?? "";
      setContent(nextContent);
      setOriginalContent(nextContent);
      setBaseSha(file?.base_sha ?? null);
      setEncoding(file?.encoding ?? "utf-8");
      setPreviewSrcDoc(null);
      setPreviewFilename("");
    } catch (e) {
      if (handleGit404(e, "파일을 불러올 수 없습니다. 저장소를 먼저 준비하세요.")) return;
      console.error("[Git] 파일 열기 실패:", e);
    }
  };

  // 저장
  const handleSave = useCallback(async () => {
    if (gitUnavailable) return;
    if (!activePath || !unsaved) return;
    try {
      await saveFile(projectId, {
        branch,
        path: activePath,
        content,
        encoding,
        expected_base_sha: baseSha ?? undefined,
      });
      setOriginalContent(content);
      await refreshStatus();
    } catch (e) {
      if (handleGit404(e, "저장할 수 없습니다. 저장소 연결/브랜치를 확인하세요.")) return;
      console.error("[Git] 저장 실패:", e);
    }
  }, [
    gitUnavailable,
    activePath,
    unsaved,
    projectId,
    branch,
    content,
    encoding,
    baseSha,
    refreshStatus,
    handleGit404,
  ]);

  // Ctrl/Cmd+S
  const saveKeymap = useMemo(
    () =>
      keymap.of([
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            handleSave();
            return true;
          },
        },
      ]),
    [handleSave]
  );

  // stage/unstage
  const handleStage = async () => {
    if (gitUnavailable) return;
    if (!activePath) return;
    try {
      await stagePaths(projectId, { branch, paths: [activePath], staged: true });
      await refreshStatus();
    } catch (e) {
      if (handleGit404(e, "Staging할 수 없습니다. 저장소를 먼저 준비하세요.")) return;
      console.error("[Git] staging 실패:", e);
    }
  };

  const handleUnstage = async () => {
    if (gitUnavailable) return;
    if (!activePath) return;
    try {
      await stagePaths(projectId, { branch, paths: [activePath], staged: false });
      await refreshStatus();
    } catch (e) {
      if (handleGit404(e, "Unstage할 수 없습니다. 저장소를 먼저 준비하세요.")) return;
      console.error("[Git] unstage 실패:", e);
    }
  };

  // 커밋
  const handleCommit = async ({ title, message }) => {
    if (gitUnavailable) return;
    try {
      const fullMessage = `${title}\n\n${message}`;
      await commitChanges(projectId, {
        branch,
        message: fullMessage,
        useStagedOnly: true,
      });
      setBaseSha(null);
      await refreshStatus();
    } catch (e) {
      if (handleGit404(e, "커밋할 수 없습니다. 저장소를 먼저 준비하세요.")) return;
      console.error("[Git] commit 실패:", e);
    }
  };

  // 실행
  const handleRun = async () => {
    if (gitUnavailable) return;
    if (!isRunnable) return;
    try {
      if (ext === "js") {
        const result = await runProjectJs(content);
        setPreviewSrcDoc(result);
      } else if (ext === "py") {
        const result = await runProjectPython(content);
        setPreviewSrcDoc(result);
      } else if (ext === "html") {
        setPreviewSrcDoc(content);
      }
      setPreviewFilename(activePath);
      setShowPreview(true);
    } catch (err) {
      // 실행 API는 Git과 직접 무관할 수 있지만, 혹시 백엔드가 404를 돌려줄 수 있으니 처리
      if (handleGit404(err, "코드를 실행할 수 없습니다. 저장소를 먼저 준비하세요.")) return;
      console.error(`${ext.toUpperCase()} 실행 실패`, err);
      setPreviewSrcDoc({
        success: false,
        stdout: "",
        stderr:
          err?.response?.data?.detail ||
          err.message ||
          "알 수 없는 오류가 발생했습니다.",
      });
      setPreviewFilename(activePath);
      setShowPreview(true);
    }
  };

  const onCodeChange = useCallback((value) => {
    setContent(value);
  }, []);

  // Git 미연결 안내 UI
  const renderGitMissing = () => {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
        <div className="text-2xl font-semibold text-gray-800 mb-2">
          Git 연결이 되어있지 않습니다.
        </div>
        <div className="text-sm text-gray-500 mb-6 max-w-md">
          {gitErrMsg || "이 프로젝트에 연결된 저장소가 없거나 접근할 수 없습니다."}
          <br />
          GitHub 패널에서 저장소를 연결하거나, 자율코딩으로 이동해 로컬 편집을 이용하세요.
        </div>
        <div className="flex gap-3">
          <button
            onClick={() =>
              navigate(
                `/team-project/${pid}`,
                {
                  state: {
                    tab: "overview",     // 바깥 TeamProjectPage에: 상세뷰로 전환
                    subTab: "git",       // 안쪽 ProjectWidgetTabs에: git 탭으로
                    projectId: pid,      // 선택 프로젝트 지정 (라우트 파라미터 이름과 무관)
                    ts: Date.now(),      // 같은 경로 재이동 시에도 state 변경 감지
                  },
                }
              )
            }

            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            GitPanel로 이동
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* 상단 바 */}
      <div className="flex flex-row items-stretch gap-2 px-4 py-2 border-b">
        <button
          className="text-gray-500 hover:text-gray-800 my-auto"
          onClick={() => setShowExplorer((v) => !v)}
          title={showExplorer ? "탐색기 접기" : "탐색기 펼치기"}
          disabled={gitUnavailable}
        >
          {showExplorer ? <FaChevronLeft /> : <FaChevronRight />}
        </button>

        <div className="text-sm text-gray-600 flex items-center flex-shrink min-w-0">
          <span className="font-medium truncate">
            {gitUnavailable ? "Git 연결 필요" : activePath || "파일을 선택하세요"}
          </span>
          <div className="w-px bg-gray-300 mx-3 self-stretch" />
          <span className="flex-shrink-0">{branch || "브랜치 로딩 중..."}</span>
          <div className="w-px bg-gray-300 mx-3 self-stretch" />
          <span className="flex-shrink-0">Staged: {status.staged?.length || 0}</span>
          <span className="ml-2 flex-shrink-0">Unstaged: {status.unstaged?.length || 0}</span>
        </div>

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <button
            className="text-[12px] text-blue-600 hover:text-blue-800 justify-center px-2 py-0.5 w-16 h-6 border border-blue-300 rounded disabled:opacity-50"
            onClick={handleSave}
            disabled={gitUnavailable || !activePath || !unsaved}
            title={unsaved ? "저장" : "변경 사항 없음"}
          >
            Save
          </button>
          <button
            className="text-[12px] text-purple-600 hover:text-purple-800 px-2 py-0.5 w-16 h-6 border border-purple-300 rounded flex items-center justify-center gap-1 disabled:opacity-50"
            onClick={handleRun}
            disabled={gitUnavailable || !activePath || !isRunnable}
          >
            Run
          </button>
          <button
            className="text-[12px] text-green-600 hover:text-green-800 justify-center px-2 py-0.5 w-16 h-6 border border-green-300 rounded disabled:opacity-50"
            onClick={handleStage}
            disabled={gitUnavailable || !activePath}
          >
            Staging
          </button>
          <button
            className="text-[12px] text-orange-500 hover:text-orange-700 justify-center px-2 py-0.5 w-16 h-6 border border-orange-300 rounded disabled:opacity-50"
            onClick={handleUnstage}
            disabled={gitUnavailable || !activePath}
          >
            Unstage
          </button>
          <button
            className="text-[12px] text-gray-700 hover:text-black justify-center px-2 py-0.5 w-16 h-6 border border-gray-300 rounded disabled:opacity-50"
            onClick={() => setIsCommitModalOpen(true)}
            disabled={gitUnavailable || status.staged?.length === 0}
          >
            Commit
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 w-full min-h-0">
        {gitUnavailable ? (
          <div className="flex-1">{renderGitMissing()}</div>
        ) : (
          <>
            <div
              className="border-r transition-all duration-200 ease-out flex-shrink-0"
              style={{ width: sidebarWidth }}
            >
              {showExplorer && (
                <ProjectGitExplorerPanel
                  className="h-full overflow-auto"
                  projectId={projectId}
                  branch={branch}
                  onOpenFile={handleOpenFile}
                  rootLabel={branch ? `root (${branch})` : "root"}
                  // (선택) 탐색기 내부에서 tree 404를 감지해 알려줄 수 있다면:
                  onGitMissing={(msg) => {
                    setGitUnavailable(true);
                    setGitErrMsg(msg || "저장소 트리를 불러올 수 없습니다.");
                    setActivePath("");
                    setContent("");
                    setOriginalContent("");
                    setBaseSha(null);
                    setStatus({ staged: [], unstaged: [], has_uncommitted: false });
                  }}
                />
              )}
            </div>

            {/* 에디터 */}
            <div className="flex-1 min-w-0 h-full">
              {!activePath ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  좌측에서 파일을 선택하면 편집할 수 있어요
                </div>
              ) : (
                <CodeMirror
                  value={content}
                  height="100%"
                  theme={githubLight}
                  extensions={[...cmLangExtensions, saveKeymap]}
                  onChange={onCodeChange}
                  style={{ height: "100%" }}
                />
              )}
            </div>

            {showPreview && (
              <div className="border-l flex-1 min-w-0 h-full">
                <ProjectGitPreviewPanel
                  previewFilename={previewFilename}
                  previewSrcDoc={previewSrcDoc}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Commit Modal */}
      {isCommitModalOpen && !gitUnavailable && (
        <CommitModal onClose={() => setIsCommitModalOpen(false)} onSubmit={handleCommit} />
      )}
    </div>
  );
}
