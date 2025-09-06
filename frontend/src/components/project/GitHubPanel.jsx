// frontend/src/components/project/GitHubPanel.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  GitBranch,
  GitCommit,
  FileDiff,
  Plus,
  Github,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  RotateCw,
  X,
  ChevronsUpDown,
} from "lucide-react";
import {
  getStatus,
  getRepoConnectionStatus,
  createRepo,
  listBranches,
  getCommitHistory,
  switchBranch,
  createBranch,
  getRepoInfo,
  commitChanges,
} from "../../api/project_gitApi";

/* ---------------------- Sub Components ---------------------- */

const ConnectView = () => (
  <div className="max-w-2xl mx-auto text-center py-16">
    <Github size={48} className="mx-auto text-gray-400" />
    <p className="mt-4 text-gray-600">
      프로젝트 버전 관리를 위해 GitHub 계정을 먼저 연결해주세요.
    </p>
    <button
      className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 flex items-center gap-2 mx-auto"
      onClick={() => alert("GitHub 연동 페이지로 이동합니다.")}
    >
      <Github size={16} /> GitHub 계정 연결하기
    </button>
  </div>
);

const CreateRepoView = ({ project, onRepoCreated }) => {
  const [repoName, setRepoName] = useState(
    project.name.toLowerCase().replace(/\s+/g, "-")
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!repoName) {
      alert("저장소 이름을 입력해주세요.");
      return;
    }
    setIsCreating(true);
    try {
      await createRepo({
        project_id: project.project_id,
        name: repoName,
        is_private: isPrivate,
      });
      alert(`'${repoName}' 저장소를 생성하고 프로젝트에 연결했습니다.`);
      onRepoCreated();
    } catch (error) {
      alert(
        `저장소 생성 실패: ${
          error?.response?.data?.detail || error.message || "알 수 없는 오류"
        }`
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-8">
      <h3 className="text-xl font-semibold text-gray-800">새 GitHub 저장소 생성</h3>
      <p className="text-sm text-gray-500 mt-1">
        이 프로젝트를 위한 새 저장소를 GitHub에 만들고 연결합니다.
      </p>

      <div className="mt-6">
        <label
          htmlFor="repo-name"
          className="block text-sm font-medium text-gray-700"
        >
          저장소 이름
        </label>
        <input
          id="repo-name"
          type="text"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                     focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div className="mt-4 flex items-center">
        <input
          id="is-private"
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="is-private" className="ml-2 block text-sm text-gray-900">
          비공개(Private) 저장소로 만들기
        </label>
      </div>

      <button
        className="mt-8 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700
                   flex items-center justify-center gap-2 disabled:opacity-50"
        onClick={handleCreate}
        disabled={isCreating}
      >
        <Plus size={16} />
        {isCreating ? "생성 중..." : "저장소 생성 및 연결"}
      </button>
    </div>
  );
};

const BranchModal = ({
  isOpen,
  onClose,
  branches, // [{ name, head_sha, is_default, is_protected }]
  currentBranch,
  onSwitch,
  onCreate,
}) => {
  const [newBranchName, setNewBranchName] = useState("");
  if (!isOpen) return null;

  const handleCreate = () => {
    if (newBranchName.trim()) {
      onCreate(newBranchName.trim());
      setNewBranchName("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">브랜치 관리</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">브랜치 이동</h4>
          <ul className="max-h-48 overflow-y-auto border rounded-md">
            {(branches || []).map((b) => (
              <li key={b.name}>
                <button
                  onClick={() => onSwitch(b.name)}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    currentBranch === b.name
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {b.name} {b.is_default ? "(기본)" : ""}
                </button>
              </li>
            ))}
          </ul>

          <h4 className="text-sm font-medium text-gray-600 mt-6 mb-2">
            새 브랜치 생성 (현재 브랜치: {currentBranch})
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="새 브랜치 이름"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm
                         focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConnectedView = ({ project, repoInfo, onBranchChange }) => {
  const storageKey = `proj:${project.project_id}:gitBranch`;

  const [status, setStatus] = useState({ staged: [], unstaged: [] });
  const [branches, setBranches] = useState([]); // normalized: [{ name, head_sha, is_default, is_protected }]
  const [currentBranch, setCurrentBranch] = useState(repoInfo?.default_branch || "main");
  const [commits, setCommits] = useState([]);
  const [commitMsg, setCommitMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  const fetchDataForBranch = useCallback(
    async (branch) => {
      if (!branch) return;
      setIsSubmitting(true);
      try {
        const [statusRes, commitsRes] = await Promise.all([
          getStatus(project.project_id, { branch }),
          getCommitHistory(project.project_id, branch),
        ]);
        setStatus(statusRes);
        setCommits(commitsRes);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
        alert("GitHub 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [project.project_id]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const raw = await listBranches(project.project_id);

        const mapped =
          (raw || []).map((b) => ({
            name: b.branch_name,
            head_sha: b.head_sha,
            is_default: b.branch_name === (repoInfo?.default_branch ?? ""),
            is_protected: !!b.is_protected,
          })) || [];

        setBranches(mapped);

        // 우선순위: localStorage 저장된 브랜치 → repoInfo.default_branch → 첫 번째 브랜치
        const saved = localStorage.getItem(storageKey);
        const existsSaved = mapped.find((b) => b.name === saved)?.name;
        const initialBranch =
          existsSaved ||
          repoInfo?.default_branch ||
          mapped.find((b) => b.is_default)?.name ||
          mapped[0]?.name;

        if (initialBranch) {
          setCurrentBranch(initialBranch);
          localStorage.setItem(storageKey, initialBranch); 
          await fetchDataForBranch(initialBranch);
        }
      } catch (error) {
        console.error("초기 데이터 로딩 실패", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.project_id, repoInfo, fetchDataForBranch]);

  const handleBranchSwitch = async (newBranch) => {
    if (!newBranch || typeof newBranch !== "string") {
      alert("잘못된 브랜치 이름입니다.");
      setIsBranchModalOpen(false);
      return;
    }
    if (newBranch === currentBranch) {
      setIsBranchModalOpen(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await switchBranch(project.project_id, newBranch);
      setCurrentBranch(newBranch);
      localStorage.setItem(storageKey, newBranch);
      await fetchDataForBranch(newBranch);
      onBranchChange?.(newBranch);
    } catch (error) {
      alert(
        `브랜치 이동 실패: ${
          error?.response?.data?.detail || error.message || "알 수 없는 오류"
        }`
      );
    } finally {
      setIsSubmitting(false);
      setIsBranchModalOpen(false);
    }
  };

  const handleCreateBranch = async (newBranchName) => {
    if (!newBranchName?.trim()) return;
    setIsSubmitting(true);
    try {
      await createBranch(project.project_id, {
        from_branch: currentBranch,
        new_branch: newBranchName.trim(),
      });
      await handleBranchSwitch(newBranchName.trim());
    } catch (error) {
      alert(
        `브랜치 생성 실패: ${
          error?.response?.data?.detail || error.message || "알 수 없는 오류"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMsg.trim()) {
      alert("커밋 메시지를 입력하세요.");
      return;
    }
    if ((status.staged?.length || 0) === 0) {
      const goOn = window.confirm(
        "Staged 파일이 없습니다. 그래도 커밋을 시도할까요?"
      );
      if (!goOn) return;
    }
    try {
      setIsSubmitting(true);
      await commitChanges(project.project_id, {
        branch: currentBranch,
        message: commitMsg.trim(),
        useStagedOnly: true,
      });
      setCommitMsg("");
      await fetchDataForBranch(currentBranch);
      alert("커밋 완료!");
    } catch (e) {
      alert(
        e?.response?.data?.detail ||
          e?.message ||
          "커밋 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">로딩 중...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Branch / Fetch / Pull / Push */}
      <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg border">
        <button
          onClick={() => setIsBranchModalOpen(true)}
          className="px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-gray-50 flex items-center gap-2"
        >
          현재 브랜치:{" "}
          <span className="font-semibold text-blue-600">{currentBranch}</span>
          <ChevronsUpDown size={14} className="text-gray-400" />
        </button>
        <div className="flex items-center gap-2">
          <button
            disabled={isSubmitting}
            className="px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
            onClick={() => fetchDataForBranch(currentBranch)}
            title="원격 상태 새로고침"
          >
            <RotateCw size={14} /> Fetch
          </button>
          <button
            disabled
            className="px-3 py-1.5 text-sm bg-white border rounded-md flex items-center gap-1.5 opacity-50 cursor-not-allowed"
            title="Pull은 서버 미구현"
          >
            <ArrowDown size={14} /> Pull
          </button>
          <button
            disabled
            className="px-3 py-1.5 text-sm bg-white border rounded-md flex items-center gap-1.5 opacity-50 cursor-not-allowed"
            title="Push는 commit API로 처리됨"
          >
            <ArrowUp size={14} /> Push
          </button>
        </div>
      </div>

      {/* Status & Commit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
          <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <FileDiff size={16} /> 로컬 변경사항
          </h4>

          <div className="p-4 bg-gray-50 rounded-lg border text-sm">
            <h5 className="font-medium text-orange-700">
              Unstaged ({status.unstaged?.length || 0})
            </h5>
            {status.unstaged?.length > 0 ? (
              <ul className="mt-2 space-y-1 text-gray-600">
                {status.unstaged.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 mt-2 text-xs">변경사항 없음</p>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border text-sm mt-4">
            <h5 className="font-medium text-green-700">
              Staged ({status.staged?.length || 0})
            </h5>
            {status.staged?.length > 0 ? (
              <ul className="mt-2 space-y-1 text-gray-600">
                {status.staged.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 mt-2 text-xs">Staging된 파일 없음</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <GitCommit size={16} /> 커밋
          </h4>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <textarea
              placeholder="커밋 메시지"
              rows={3}
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              className="mt-2 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              onClick={handleCommit}
              disabled={isSubmitting || !currentBranch}
            >
              '{currentBranch}'에 커밋
            </button>
          </div>
        </div>
      </div>

      {/* Commits */}
      <div className="mt-8">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
          <GitCommit size={16} /> 최근 커밋 내역
        </h4>
        <ul className="space-y-3 text-sm border rounded-lg p-2 bg-white">
          {commits.map((c) => (
            <li key={c.sha} className="p-3 border-b last:border-b-0">
              <p className="font-medium text-gray-900">{c.message}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  {c.author} - {new Date(c.date).toLocaleString()}
                </p>
                <p className="font-mono text-blue-600 text-xs hover:underline cursor-pointer">
                  {c.sha.substring(0, 7)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        currentBranch={currentBranch}
        onSwitch={handleBranchSwitch}
        onCreate={handleCreateBranch}
      />
    </div>
  );
};

const ErrorView = ({ error, onRetry }) => (
  <div className="max-w-2xl mx-auto text-center py-16">
    <AlertTriangle size={48} className="mx-auto text-red-400" />
    <p className="mt-4 text-red-600 font-semibold">
      정보를 불러오는 중 오류가 발생했습니다.
    </p>
    <p className="mt-2 text-sm text-gray-500 bg-red-50 p-2 rounded-md">
      {error}
    </p>
    <button
      className="mt-6 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
      onClick={onRetry}
    >
      다시 시도
    </button>
  </div>
);

/* ---------------------- Main Component ---------------------- */

export default function GitHubPanel({ project, currentUser, onBranchChange }) {
  const [viewMode, setViewMode] = useState("initial");
  const [repoInfo, setRepoInfo] = useState(null);
  const [error, setError] = useState(null);
  const isUserConnected = currentUser?.provider === "github";

  const checkStatus = useCallback(async () => {
    setError(null);
    setViewMode("initial");

    if (!currentUser || !isUserConnected) {
      setViewMode("connecting");
      return;
    }

    try {
      const status = await getRepoConnectionStatus(project.project_id);
      if (status.is_connected) {
        const detailedRepoInfo = await getRepoInfo(project.project_id);
        setRepoInfo(detailedRepoInfo);
        setViewMode("connected");
      } else {
        setViewMode("creating");
      }
    } catch (err) {
      console.error("저장소 연결 상태 확인 실패:", err);
      setError(
        err?.response?.data?.detail || err.message || "서버와 통신할 수 없습니다."
      );
      setViewMode("error");
    }
  }, [project.project_id, isUserConnected, currentUser]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const renderContent = () => {
    switch (viewMode) {
      case "connecting":
        return <ConnectView />;
      case "creating":
        return <CreateRepoView project={project} onRepoCreated={checkStatus} />;
      case "connected":
        return (
          <ConnectedView
            project={project}
            repoInfo={repoInfo}
            onBranchChange={onBranchChange}
          />
        );
      case "error":
        return <ErrorView error={error} onRetry={checkStatus} />;
      default:
        return <div className="text-center py-10">상태를 확인 중입니다...</div>;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <GitBranch size={20} className="text-gray-700" /> GitHub 관리
      </h2>
      <div className="border-t pt-4 mt-4">{renderContent()}</div>
    </div>
  );
}
