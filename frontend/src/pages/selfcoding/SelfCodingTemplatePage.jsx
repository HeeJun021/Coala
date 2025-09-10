import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Layout/Navbar";
import {
  Globe2,
  Atom,
  Landmark,
  Hexagon,
  Rocket,
  FlaskConical,
  Code2,
  Layers,
  Filter,
  ArrowRight,
  Folder as FolderIcon,
  FileText as FileIcon,
  ChevronRight,
} from "lucide-react";

/* ---------------------------
   템플릿 스펙 (백엔드 생성용)
---------------------------- */
const TEMPLATE_SPECS = {
  vanilla: {
    displayName: "HTML + CSS + JS",
    category: "frontend",
    description: [
      "가장 기본적인 정적 웹 스타터로, 빌드 툴 없이 바로 실행할 수 있어요.",
      "학습·실험용에 적합하고, 구조가 단순해 확장도 쉬워요.",
      "index.html과 src/ 디렉토리에 CSS/JS가 포함돼요.",
    ],
    treeObj: {
      "index.html": "<!-- html -->",
      src: {
        css: { "style.css": "/* css */" },
        js: { "main.js": "// js" },
      },
      assets: {},
      "README.md": "# Vanilla Starter",
    },
  },
  react: {
    displayName: "React App (Vite)",
    category: "frontend",
    description: [
      "Vite 기반의 React SPA 템플릿이에요. 빠른 HMR을 제공해요.",
      "컴포넌트·스타일·엔트리 구조가 기본 제공돼요.",
      "학습부터 소규모 프로젝트까지 빠르게 시작할 수 있어요.",
    ],
    treeObj: {
      "package.json": "{}",
      "index.html": "<!-- html -->",
      src: {
        "main.jsx": "// entry",
        "App.jsx": "// app",
        components: { "Hello.jsx": "// component" },
        styles: { "app.css": "/* css */" },
      },
      public: {},
      "README.md": "# React (Vite)",
    },
  },
  vue: {
    displayName: "Vue.js App (Vite)",
    category: "frontend",
    description: [
      "Vite 기반의 Vue 3 템플릿으로, SFC 컴포넌트 예시를 포함해요.",
      "간결한 설정으로 바로 개발을 시작할 수 있어요.",
      "기본 스타일 파일도 포함돼요.",
    ],
    treeObj: {
      "package.json": "{}",
      "index.html": "<!-- html -->",
      src: {
        "main.js": "// entry",
        "App.vue": "<template>hello</template>",
        components: { "Hello.vue": "<template>hi</template>" },
        styles: { "app.css": "/* css */" },
      },
      public: {},
      "README.md": "# Vue (Vite)",
    },
  },
  next: {
    displayName: "Next.js App",
    category: "frontend",
    description: [
      "SSR/SSG를 지원하는 Next.js 기본 구조에요.",
      "pages 라우팅과 전역 스타일 파일이 포함돼요.",
      "프로덕션 전환이 쉬운 베이스예요.",
    ],
    treeObj: {
      pages: { "index.js": "// page" },
      public: {},
      styles: { "globals.css": "/* css */" },
      "package.json": "{}",
      "README.md": "# Next.js",
    },
  },
  fastapi: {
    displayName: "Python FastAPI",
    category: "backend",
    description: [
      "간단한 FastAPI 서버 템플릿이에요.",
      "헬스체크/라우터 모듈링과 CORS 설정이 포함돼요.",
      "추후 DB 확장에도 용이한 구조예요.",
    ],
    treeObj: {
      app: {
        "main.py": "# fastapi app",
        routers: { "__init__.py": "" },
        models: { "__init__.py": "" },
      },
      "requirements.txt": "fastapi\nuvicorn[standard]",
      ".env.example": "# ENV",
      "README.md": "# FastAPI Starter",
    },
  },
  flask: {
    displayName: "Python Flask",
    category: "backend",
    description: [
      "경량 Flask 서버 템플릿이에요.",
      "Jinja 템플릿·정적 파일 디렉토리가 포함돼요.",
      "간단한 라우팅 예제로 시작이 쉬워요.",
    ],
    treeObj: {
      "app.py": "# flask app",
      templates: { "index.html": "<!-- html -->" },
      static: { css: { "style.css": "" }, js: { "main.js": "" } },
      "requirements.txt": "flask",
      "README.md": "# Flask Starter",
    },
  },
};

const TEMPLATE_META = [
  { id: "vanilla", icon: <Globe2 size={20} />, category: "frontend" },
  { id: "react", icon: <Atom size={20} />, category: "frontend" },
  { id: "vue", icon: <Hexagon size={20} />, category: "frontend" },
  { id: "next", icon: <Rocket size={20} />, category: "frontend" },
  { id: "fastapi", icon: <Landmark size={20} />, category: "backend" },
  { id: "flask", icon: <FlaskConical size={20} />, category: "backend" },
];

const categories = [
  { key: "all", label: "전체", icon: <Layers size={14} /> },
  { key: "frontend", label: "프론트엔드", icon: <Code2 size={14} /> },
  { key: "backend", label: "백엔드", icon: <Landmark size={14} /> },
];

/* ---------------------------
   MiniFileTree (호버 미리보기용)
---------------------------- */
const MiniFileTree = ({ treeObj, maxDepth = 3 }) => {
  const renderNode = (node, depth = 0) => {
    if (depth > maxDepth) return null;
    return Object.entries(node).map(([name, val]) => {
      const isFile = typeof val === "string";
      const isDir = typeof val === "object";
      return (
        <div key={`${depth}-${name}`} className="text-[12px] leading-5">
          <div className="flex items-center" style={{ paddingLeft: depth * 14 }}>
            {isDir ? (
              <>
                <FolderIcon size={14} className="text-yellow-600 mr-1" />
                <span className="text-gray-800">{name}/</span>
              </>
            ) : (
              <>
                <FileIcon size={14} className="text-gray-500 mr-1" />
                <span className="text-gray-700">{name}</span>
              </>
            )}
          </div>
          {isDir && <div>{renderNode(val, depth + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl max-h-[300px] overflow-hidden">
      <div className="text-[11px] font-semibold text-gray-600 flex items-center mb-2">
        파일 구조 미리보기
        <ChevronRight size={12} className="ml-1 text-gray-400" />
      </div>
      {renderNode(treeObj, 0)}
    </div>
  );
};

const SelfCodingTemplatePage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 스크롤 제거: 전체 뷰 고정
  const contentStyle = { height: "calc(100vh - 70px)" };

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return TEMPLATE_META;
    return TEMPLATE_META.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  const handleTemplateClick = (templateId) => {
    navigate("/self-coding", { state: { templateId } });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <Navbar />
      <div className="mx-auto max-w-7xl px-8" style={contentStyle}>
        {/* 헤더 */}
        <div className="h-[84px] flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-gray-900">템플릿 선택</h1>
            <p className="text-[14px] text-gray-600 mt-1">
              시작하고 싶은 프로젝트 유형을 고르세요
            </p>
          </div>
        </div>

        {/* 카테고리 */}
        <div className="h-[48px] flex items-center gap-2 mb-6">
          <span className="text-[13px] text-gray-500 flex items-center gap-1">
            <Filter size={13} /> 카테고리
          </span>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition ${
                  selectedCategory === cat.key
                    ? "bg-green-600 text-white border-green-600"
                    : "text-green-700 border-green-400 hover:bg-green-50"
                } flex items-center gap-1`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 카드 그리드: 큰 카드 3열, 넘침 허용 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 overflow-visible">
          {filtered.map(({ id, icon, category }) => {
            const spec = TEMPLATE_SPECS[id];
            return (
              <div
                key={id}
                className="
                  group relative rounded-2xl border border-gray-200 p-5 bg-white
                  shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col
                  overflow-visible min-h-[300px]
                "
                onClick={() => handleTemplateClick(id)}
              >
                {/* 카드 헤더 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700">
                    {icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-700">
                      {spec.displayName}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {category === "frontend" ? "Frontend" : "Backend"}
                    </p>
                  </div>
                </div>

                {/* 설명 */}
                <div className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                  {spec.description.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-auto text-right text-sm text-green-600 font-medium opacity-90 group-hover:opacity-100">
                  선택하기 <ArrowRight size={14} className="inline-block ml-1" />
                </div>

                {/* 🔥 호버 미리보기: 카드 밖(오른쪽·아래)으로 자연스럽게 넘어가도록 배치 */}
                <div
                  className="
                    pointer-events-none absolute z-30
                    opacity-0 group-hover:opacity-100 transition
                    -right-10 -bottom-20
                  "
                  style={{ width: 300 }}
                >
                  <MiniFileTree treeObj={spec.treeObj} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 스킵 버튼 (화면 고정) */}
        <button
          onClick={() => navigate("/self-coding", { state: { panel: "explorer" } })}
          className="fixed right-8 bottom-6 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm shadow-lg hover:bg-black flex items-center gap-2"
        >
          템플릿 생성하지 않기 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default SelfCodingTemplatePage;
