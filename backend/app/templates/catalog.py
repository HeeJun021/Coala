# app/templates/catalog.py
# -*- coding: utf-8 -*-

"""
템플릿 카탈로그
- 서버가 보유/신뢰하는 템플릿 정의
- materialize 시 루트 폴더 하위에 default_folder_name으로 상위 폴더를 만들고,
  그 안에 tree 구조를 그대로 DB에 생성합니다.
"""

TEMPLATE_CATALOG: dict[str, dict] = {
    # ---------------------------
    # 1) HTML + CSS + JS (vanilla)
    # ---------------------------
    "vanilla": {
        "default_folder_name": "HTML_CSS_JS", # 폴더 이름도 살짝 변경
        "open_files": ["index.html", "src/js/main.js", "src/css/style.css"], # 열리는 파일 추가
        "tree": {
            "index.html": """<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanilla Starter - Modern Template</title>
    <link rel="stylesheet" href="src/css/variables.css" />
    <link rel="stylesheet" href="src/css/style.css" />
  </head>
  <body>
    <header class="main-header">
      <div class="logo">MyWeb</div>
      <nav class="main-nav">
        <ul>
          <li><a href="#home">홈</a></li>
          <li><a href="#services">서비스</a></li>
          <li><a href="#contact">문의</a></li>
        </ul>
      </nav>
      <button class="menu-toggle" id="menu-toggle">☰</button>
    </header>

    <section id="home" class="hero">
      <div class="hero-content">
        <h1>반갑습니다 👋</h1>
        <p>이 스타터 템플릿은 HTML, CSS, JS만으로 구성된 미니 웹사이트 예시입니다.</p>
        <button id="learn-more">자세히 보기</button>
      </div>
    </section>

    <section id="services" class="services container">
      <h2>주요 서비스</h2>
      <div class="cards">
        <div class="card">
          <h3>웹 디자인</h3>
          <p>깔끔하고 반응형 웹 디자인을 제공합니다.</p>
        </div>
        <div class="card">
          <h3>프론트엔드 개발</h3>
          <p>최신 트렌드의 인터랙티브 UI 구현.</p>
        </div>
        <div class="card">
          <h3>백엔드 연동</h3>
          <p>API 통신 및 서버 연동 기능을 지원합니다.</p>
        </div>
      </div>
    </section>

    <footer>
      <p>&copy; 2025 MyWeb. All rights reserved.</p>
    </footer>

    <script src="src/js/main.js"></script>
  </body>
</html>
""",
            "src": {
                "css": {
                    "variables.css": """:root {
  /* 기본 컬러 팔레트 */
  --primary-color: #007bff;
  --text-color: #333;
  --background-color: #f4f7f9;
  --border-color: #ddd;

  /* 간격 및 폰트 */
  --spacing-unit: 8px;
  --font-base: 16px;
}
""",
                    "style.css": """@import url('variables.css');

/* Reset */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Base */
body {
  font-family: "Noto Sans KR", Arial, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
}

/* Layout */
.container {
  width: 90%;
  max-width: 1100px;
  margin: 0 auto;
  padding: calc(var(--spacing-unit) * 3);
}

/* Header */
.main-header {
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 3);
}

.main-header .logo {
  font-size: 1.4rem;
  font-weight: bold;
}

.main-nav ul {
  display: flex;
  list-style: none;
}

.main-nav li + li {
  margin-left: calc(var(--spacing-unit) * 2);
}

.main-nav a {
  color: white;
  text-decoration: none;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
}

/* Hero Section */
.hero {
  background: linear-gradient(to right, #007bff, #00c4ff);
  color: white;
  text-align: center;
  padding: 80px 20px;
}

.hero-content h1 {
  font-size: 2.4rem;
}

.hero-content p {
  margin: 16px 0;
}

.hero-content button {
  background-color: white;
  color: var(--primary-color);
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
}

/* Services */
.services h2 {
  text-align: center;
  margin-bottom: 24px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.card {
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-5px);
}

/* Footer */
footer {
  text-align: center;
  padding: 20px;
  margin-top: 40px;
  background-color: #f1f3f6;
  color: #555;
}

/* Responsive */
@media (max-width: 768px) {
  .main-nav { display: none; }
  .menu-toggle { display: block; }
}
"""
                },
                "js": {
                    "main.js": """console.clear();
console.log("JS App Running Independently!");

const appTitle = "Mini User Dashboard";
const sections = ["Home", "About", "Team", "Contact"];
const users = [
  { name: "김희준", role: "Frontend Developer", email: "heejun@example.com" },
  { name: "박민수", role: "Backend Engineer", email: "minsu@example.com" },
  { name: "이서연", role: "UI/UX Designer", email: "seoyeon@example.com" },
  { name: "정우진", role: "Data Scientist", email: "woojin@example.com" },
  { name: "최예린", role: "AI Researcher", email: "yerin@example.com" },
];

console.log("=".repeat(60));
console.log(appTitle.padStart(35, " "));
console.log("=".repeat(60));
console.log("Navigation:", sections.join(" | "));
console.log("-".repeat(60));

console.log("Team Members");
for (const user of users) {
  console.log(`${user.name}`);
  console.log(`   ├ Role : ${user.role}`);
  console.log(`   └ Email: ${user.email}`);
  console.log("-".repeat(40));
}

console.log("".repeat(1));
console.log("=".repeat(60));
console.log("© 2025 Heejoon JS Standalone Demo");
console.log("=".repeat(60));



"""
                },
            },
            "assets": {},
            "README.md": "# Vanilla Starter\n\nSemantic HTML, 기본 CSS 변수, 간단한 Navigation 구조를 포함하는 정적 웹 스타터입니다.\n",
        },
    },

    # ---------------------------
    # 2) React (Vite 스타일)
    # ---------------------------
    "react": {
        "default_folder_name": "react-starter",
        "open_files": ["README.md", "src/App.jsx"],
        "tree": {
            "package.json": """{
  "name": "react-starter",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}""",
            "index.html": """<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Starter (Vite)</title>
  </head>
  <body>
    <div id="root"></div>
    <!-- 실제 실행환경에서는 Vite가 이 파일을 번들링합니다 -->
  </body>
</html>
""",
            "src": {
                "main.jsx": """import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/app.css";

createRoot(document.getElementById("root")).render(<App />);
""",
                "App.jsx": """export default function App() {
  return (
    <main style={{ padding: 24 }}>
      <h1>React Starter</h1>
      <p>Vite 스타일의 React 예제 템플릿입니다.</p>
    </main>
  );
}
""",
                "components": {
                    "Hello.jsx": """export default function Hello({ name = "React" }) {
  return <p>Hello, {name}!</p>;
}
"""
                },
                "styles": {
                    "app.css": """* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
main { line-height: 1.6; }
"""
                },
            },
            "public": {},
            "README.md": "# React Starter (Vite)\n\n간단한 React 시작 템플릿입니다.\n",
        },
    },

    # ---------------------------
    # 3) Vue (Vite 스타일)
    # ---------------------------
    "vue": {
        "default_folder_name": "vue-starter",
        "open_files": ["README.md", "src/App.vue"],
        "tree": {
            "package.json": """{
  "name": "vue-starter",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}""",
            "index.html": """<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue Starter (Vite)</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
""",
            "src": {
                "main.js": """import { createApp } from "vue";
import App from "./App.vue";
import "./styles/app.css";

createApp(App).mount("#app");
""",
                "App.vue": """<template>
  <main class="container">
    <h1>Vue Starter</h1>
    <p>Vite 스타일의 Vue 3 예제 템플릿입니다.</p>
    <Hello />
  </main>
</template>

<script setup>
import Hello from "./components/Hello.vue";
</script>

<style scoped>
.container { padding: 24px; line-height: 1.6; }
</style>
""",
                "components": {
                    "Hello.vue": """<template>
  <p>Hello, {{ name }}!</p>
</template>

<script setup>
const name = "Vue";
</script>
"""
                },
                "styles": {
                    "app.css": """body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }"""
                },
            },
            "public": {},
            "README.md": "# Vue Starter (Vite)\n\n간단한 Vue 3 시작 템플릿입니다.\n",
        },
    },

    # ---------------------------
    # 4) Next.js (pages 라우팅)
    # ---------------------------
    "next": {
        "default_folder_name": "next-starter",
        "open_files": ["pages/index.js"],
        "tree": {
            "pages": {
                "index.js": """export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Next.js Starter</h1>
      <p>pages 기반의 간단한 Next.js 템플릿입니다.</p>
    </main>
  );
}
"""
            },
            "public": {},
            "styles": {
                "globals.css": """* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }"""
            },
            "package.json": """{
  "name": "next-starter",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}""",
            "README.md": "# Next.js Starter\n\n간단한 Next.js 시작 템플릿입니다.\n",
        },
    },

    # ---------------------------
    # 5) Python FastAPI
    # ---------------------------
    "fastapi": {
        "default_folder_name": "fastapi-starter",
        "open_files": ["app/main.py"],
        "tree": {
            "app": {
                "main.py": """from fastapi import FastAPI

app = FastAPI(title="FastAPI Starter")

@app.get("/health")
def health():
    return {"status": "ok"}
""",
                "routers": {
                    "__init__.py": ""
                },
                "models": {
                    "__init__.py": ""
                },
            },
            "requirements.txt": "fastapi\nuvicorn[standard]\n",
            ".env.example": "# ENV=local\n",
            "README.md": "# FastAPI Starter\n\n간단한 FastAPI 서버 템플릿입니다.\n",
        },
    },

    # ---------------------------
    # 6) Python Flask
    # ---------------------------
    "flask": {
        "default_folder_name": "flask-starter",
        "open_files": ["app.py", "templates/index.html"],
        "tree": {
            "app.py": """from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")
""",
            "templates": {
                "index.html": """<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flask Starter</title>
    <link rel="stylesheet" href="/static/css/style.css" />
  </head>
  <body>
    <main>
      <h1>Flask Starter</h1>
      <p>간단한 Flask 서버 템플릿입니다.</p>
      <script src="/static/js/main.js"></script>
    </main>
  </body>
</html>
"""
            },
            "static": {
                "css": {
                    "style.css": """body { font-family: Arial, sans-serif; margin: 24px; }"""
                },
                "js": {
                    "main.js": """console.log("Hello, Flask!");"""
                }
            },
            "requirements.txt": "flask\n",
            "README.md": "# Flask Starter\n\n경량 Flask 서버 템플릿입니다.\n",
        },
    },
}
