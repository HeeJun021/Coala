import React, { useState, useCallback, memo } from 'react';
import { Dialog } from '@headlessui/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Folder,
  FileText,
  Database,
  Code,
  StickyNote,
  Users,
} from 'lucide-react';

// 예시 이미지 (실제 구현 시 경로 수정 필요)
const images = Array(16).fill(null).map((_, i) => `/assets/projectguide/${i + 1}.png`);

const guideSections = {
  '프로젝트 관리': [
    {
      title: '프로젝트 생성',
      content: '프로젝트 페이지에서 "새 프로젝트 생성" 버튼을 클릭하여 프로젝트를 시작하세요. 프로젝트 이름, 설명, 주제, 기술 스택, 공개 여부를 입력하고, ERD, 문서, 채팅 등 원하는 위젯을 선택할 수 있습니다. 생성 후 프로젝트 대시보드로 이동하여 작업을 시작합니다.',
      icon: <Folder size={18} className='text-blue-500' />,
      imgSrc: images[0],
    },
    {
      title: '팀원 초대 및 관리',
      content: '프로젝트 설정에서 팀원을 초대하거나 제거할 수 있습니다. "팀원 초대" 버튼을 클릭하여 사용자 ID를 입력하고 초대장을 전송하세요. 팀장은 권한을 다른 멤버에게 이전할 수도 있습니다. 팀원 목록에서 현재 멤버를 확인하세요.',
      icon: <Users size={18} className='text-green-600' />,
      imgSrc: images[1],
    },
    {
      title: '프로젝트 수정',
      content: '프로젝트 설정 메뉴에서 프로젝트 이름, 설명, 위젯 등을 수정할 수 있습니다. 변경사항을 저장하면 즉시 반영됩니다. 활동 기록을 추가하여 팀원들과 작업 내역을 공유할 수도 있습니다.',
      icon: <Folder size={18} className='text-purple-500' />,
      imgSrc: images[2],
    },
  ],
  '문서 관리': [
    {
      title: '문서 생성 및 편집',
      content: '문서 관리 섹션에서 Tiptap 에디터를 사용하여 프로젝트 문서를 작성하세요. "새 문서 생성" 버튼을 클릭하고, 서식 도구(볼드, 이탤릭, 밑줄 등)를 활용해 내용을 편집합니다. 문서는 자동 저장되며, 팀원들과 공유됩니다.',
      icon: <FileText size={18} className='text-blue-500' />,
      imgSrc: images[3],
    },
    {
      title: '문서 삭제',
      content: '문서 목록에서 삭제하고 싶은 문서를 선택한 후 "삭제" 버튼을 클릭하세요. 삭제된 문서는 복구할 수 없으니 주의하세요. 팀원들과 협의 후 진행하는 것이 좋습니다.',
      icon: <FileText size={18} className='text-red-500' />,
      imgSrc: images[4],
    },
  ],
  'ERD 관리': [
    {
      title: 'ERD 생성',
      content: 'ERD 설계 위젯을 활성화한 후 "새 ERD 생성" 버튼을 클릭하세요. 테이블, 컬럼, 관계를 정의하여 데이터베이스 구조를 설계할 수 있습니다. ERD는 프로젝트 내에서 시각적으로 관리됩니다.',
      icon: <Database size={18} className='text-purple-600' />,
      imgSrc: images[5],
    },
    {
      title: 'ERD 삭제',
      content: 'ERD 목록에서 삭제할 ERD를 선택하고 "삭제" 버튼을 클릭하세요. 삭제된 ERD는 복구되지 않으므로, 팀원들과 확인 후 진행하세요.',
      icon: <Database size={18} className='text-red-500' />,
      imgSrc: images[6],
    },
  ],
  '코드 생성': [
    {
      title: 'SQL 입력',
      content: '코드 생성 패널에서 SQL 쿼리를 입력하세요. CodeMirror 에디터를 사용하여 구문 강조와 줄 번호를 확인하며 쿼리를 작성할 수 있습니다. 작성한 SQL은 클래스 또는 ORM 코드로 변환됩니다.',
      icon: <Code size={18} className='text-green-600' />,
      imgSrc: images[7],
    },
    {
      title: '언어 및 변환 타입 선택',
      content: 'Python, Java, TypeScript, C# 중 원하는 언어를 선택하고, "실전용 클래스" 또는 "ORM 매핑" 변환 타입을 선택하세요. "현재 ERD에서 자동 가져오기" 버튼을 사용하면 ERD 기반으로 SQL을 자동 입력할 수 있습니다.',
      icon: <Code size={18} className='text-blue-500' />,
      imgSrc: images[8],
    },
  ],
  '메모 관리': [
    {
      title: '메모 생성',
      content: '메모 위젯에서 "새 메모 추가" 버튼을 클릭하여 프로젝트 관련 메모를 작성하세요. 메모는 간단한 텍스트로 작성되며, 팀원들과 공유됩니다.',
      icon: <StickyNote size={18} className='text-yellow-600' />,
      imgSrc: images[9],
    },
    {
      title: '메모 수정 및 삭제',
      content: '메모 목록에서 수정하거나 삭제할 메모를 선택하세요. 수정 시 새로운 내용을 입력하고 저장하며, 삭제 시 메모는 영구적으로 제거됩니다.',
      icon: <StickyNote size={18} className='text-red-500' />,
      imgSrc: images[10],
    },
  ],
};

const TabSection = memo(({ tab, setTab }) => (
  <div className='w-1/3 border-r p-4 bg-gray-50 overflow-y-auto'>
    <h2 className='text-lg font-bold mb-4'>가이드 항목</h2>
    {Object.keys(guideSections).map((key) => (
      <button
        key={key}
        className={`w-full text-left px-3 py-2 rounded ${
          tab === key ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
        }`}
        onClick={() => setTab(key)}
      >
        {key}
      </button>
    ))}
  </div>
));

const ContentSection = memo(({ tab, stepIndex, guides }) => {
  const current = guides[stepIndex];
  return (
    <div className='flex-1 overflow-y-auto'>
      <div>
        <div className='flex items-center gap-2 mb-4'>
          {current.icon}
          <h3 className='text-xl font-bold'>{current.title}</h3>
        </div>
        {current.imgSrc && (
          <img
            src={current.imgSrc}
            alt={current.title}
            className='w-full max-h-[360px] object-contain border rounded shadow mb-4'
            onError={(e) => { e.target.src = '/assets/placeholder.png'; }} // 대체 이미지
          />
        )}
        <p className='text-gray-700'>{current.content}</p>
      </div>
    </div>
  );
});

const ProjectGuideModal = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState('프로젝트 관리');
  const [stepIndex, setStepIndex] = useState(0);

  const guides = guideSections[tab];
  const showNavigation = guides.length > 1;

  const handleTabChange = useCallback((newTab) => {
    setTab(newTab);
    setStepIndex(0);
  }, []);

  const handlePrevStep = useCallback(() => {
    setStepIndex((prev) => prev - 1);
  }, []);

  const handleNextStep = useCallback(() => {
    setStepIndex((prev) => prev + 1);
  }, []);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className='fixed inset-0 z-50 flex items-center justify-center'
    >
      <div className='fixed inset-0 bg-black bg-opacity-40' aria-hidden='true' />
      <div className='relative z-50 bg-white rounded-xl w-[1000px] h-[700px] flex shadow-2xl'>
        <TabSection tab={tab} setTab={handleTabChange} />

        <div className='flex-1 p-6 relative flex flex-col justify-between overflow-y-auto'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 text-gray-500 hover:text-gray-800'
          >
            <X size={20} />
          </button>

          <ContentSection tab={tab} stepIndex={stepIndex} guides={guides} />

          {showNavigation && (
            <div className='flex justify-between items-center mt-6'>
              <button
                disabled={stepIndex === 0}
                className='flex items-center gap-1 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50'
                onClick={handlePrevStep}
              >
                <ChevronLeft size={16} /> 이전
              </button>

              <span className='text-sm text-gray-500'>
                {stepIndex + 1} / {guides.length}
              </span>

              <button
                disabled={stepIndex === guides.length - 1}
                className='flex items-center gap-1 px-3 py-1 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50'
                onClick={handleNextStep}
              >
                다음 <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ProjectGuideModal;