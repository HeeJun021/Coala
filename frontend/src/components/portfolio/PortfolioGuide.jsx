import React, { useState } from "react";
import { SiNotion } from "react-icons/si";
import { FileText, Layers, Upload, CheckCircle2, User, Brain, FolderGit2 } from "lucide-react";
import { getNotionAuthorizeUrl } from "../../api/notionApi";
import PortfolioGuideDetail from "./PortfolioGuideDetail";

// 🔹 이미지 (의미 있는 파일명으로 교체)
import step1Image from "../../assets/portfolio/notion-connect.png";
import step2Image from "../../assets/portfolio/portfolio-setup.png";
import step3Image from "../../assets/portfolio/user-info.png";
import step4Image from "../../assets/portfolio/about-ai.png";
import step5Image from "../../assets/portfolio/project-select.png";

export default function PortfolioGuide() {
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  const handleConnectNotion = async () => {
    try {
      setLoading(true);
      const { authorize_url } = await getNotionAuthorizeUrl();
      window.location.href = authorize_url;
    } catch (err) {
      console.error("노션 연결 URL 불러오기 실패:", err);
      alert("노션 연결을 시작할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: "노션 연결",
      description: "자신의 워크스페이스 내 공유할 노션 페이지를 선택하세요.",
      detail:
        "첫 번째 단계에서는 자신의 노션 워크스페이스를 연결하고, 공유 가능한 페이지를 선택합니다.\n\n이 페이지가 이후 포트폴리오 결과가 퍼블리시될 대상이 됩니다.\n\n‘엑세스 허용’을 눌러 연동을 완료하면, 이후 단계에서 해당 페이지를 자동으로 불러올 수 있습니다.",
      icon: <SiNotion className="w-8 h-8 text-gray-800 mb-3" />,
      image: step1Image,
    },
    {
      id: 2,
      title: "포트폴리오 기본 설정",
      description: "제목, 대상 페이지, 템플릿을 선택하세요.",
      detail:
        "이 단계에서는 포트폴리오 페이지의 기본 구성을 설정합니다.\n\n- 포트폴리오 제목을 입력합니다.\n- 대상 페이지는 앞서 연결한 노션 페이지 중 하나를 선택합니다.\n- 개발자가 제공하는 템플릿 중 하나를 선택해 전체 페이지의 형식을 결정하세요.\n\n이 설정은 나중에 언제든 수정할 수 있습니다.",
      icon: <Layers className="w-8 h-8 text-emerald-500 mb-3" />,
      image: step2Image,
    },
    {
      id: 3,
      title: "사용자 정보 입력",
      description: "학력, 경력, 기본 인적사항을 입력하세요.",
      detail:
        "포트폴리오에 포함될 인적 정보를 입력합니다.\n\n이름, 생년월일, 연락처, 이메일 등의 기본 정보 외에도 학력과 경력을 추가할 수 있습니다.\n\n입력한 정보는 ‘저장’ 버튼을 눌러 보관되며, 나중에 AI가 이를 정리해 포트폴리오 본문에 반영합니다.",
      icon: <User className="w-8 h-8 text-blue-500 mb-3" />,
      image: step3Image,
    },
    {
      id: 4,
      title: "자기소개 및 경험 입력",
      description: "AI가 내용을 다듬어 자연스러운 소개로 완성합니다.",
      detail:
        "자기소개와 경험은 포트폴리오의 핵심 섹션 중 하나입니다.\n\n이곳에 자신의 강점, 성취, 협업 경험 등을 자유롭게 작성하세요.\nAI가 자연스럽게 문장을 다듬고 구성해 완성된 소개문으로 반영합니다.",
      icon: <Brain className="w-8 h-8 text-pink-500 mb-3" />,
      image: step4Image,
    },
    {
      id: 5,
      title: "프로젝트 선택 및 역할 설정",
      description: "프로젝트와 역할을 선택해 포트폴리오에 추가하세요.",
      detail:
        "마지막 단계에서는 자신이 참여한 프로젝트를 선택하고, 담당했던 역할을 지정합니다.\n\n프로젝트를 선택하면 개요, 기술 스택, 팀 구성, 담당 업무 등이 자동으로 표시됩니다.\n이후 ‘노션에 퍼블리시’ 버튼을 클릭하면 모든 정보가 AI에 의해 정리되어 노션 페이지로 생성됩니다.",
      icon: <FolderGit2 className="w-8 h-8 text-indigo-500 mb-3" />,
      image: step5Image,
    },
  ];

  return (
    <div className="relative w-auto max-w-5xl bg-white rounded-2xl shadow-xl border border-gray-200 p-10 mt-[-12px]">
      {/* 🔹 상단 우측: 노션 연결 버튼 */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <SiNotion className="w-8 h-8 text-gray-800" />
        <button
          onClick={handleConnectNotion}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60"
        >
          {loading ? "연결 중..." : "노션 연결"}
        </button>
      </div>

      {/* 🔹 타이틀 */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
        노션 포트폴리오 가이드
      </h1>
      <p className="text-gray-600 text-lg mb-10 max-w-2xl">
        노션과 연동하여 프로젝트 기반의 포트폴리오 페이지를 자동으로 생성할 수 있습니다.
      </p>

      {/* 🔹 단계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => setSelectedStep(step)}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col items-start hover:shadow-lg transition cursor-pointer"
          >
            {step.icon}
            <div className="text-lg font-semibold text-gray-800 mb-1">
              {`${step.id}. ${step.title}`}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* 🔹 시작 버튼 */}
      <div className="text-center">
        <button className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition">
          <CheckCircle2 className="w-5 h-5" />
          시작하기
        </button>
      </div>

      {/* 🔹 디테일 모달 */}
      {selectedStep && (
        <PortfolioGuideDetail
          step={selectedStep}
          onClose={() => setSelectedStep(null)}
        />
      )}
    </div>
  );
}
