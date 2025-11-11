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
    <title>Vanilla Starter - Enhanced</title>
    <link rel="stylesheet" href="src/css/variables.css" />
    <link rel="stylesheet" href="src/css/style.css" />
  </head>
  <body>
    <header class="main-header">
      <div class="logo">App Name</div>
      <nav class="main-nav">
        <ul>
          <li><a href="#">홈</a></li>
          <li><a href="#">서비스</a></li>
          <li><a href="#">문의</a></li>
        </ul>
      </nav>
    </header>

    <main class="container">
      <section>
        <h1>Hello, HTML! (Enhanced)</h1>
        <p>
          이 템플릿은 Semantic HTML 구조와 기본 스타일링을 포함합니다.<br />
          header, nav, section, footer와 같은 요소를 활용하여 작성되었습니다.
        </p>
        <button id="action-button">클릭해보세요</button>
      </section>
    </main>

    <footer>
      <p>&copy; 2025 Vanilla Starter Project</p>
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
                    "style.css": """/* Reset 및 기본 설정 */
* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif;
  margin: 0;
  line-height: 1.6;
  background-color: var(--background-color);
  color: var(--text-color);
}

/* 레이아웃 및 컨테이너 */
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: calc(var(--spacing-unit) * 3); /* 24px */
}

/* 헤더 및 네비게이션 스타일 */
.main-header {
  background-color: var(--primary-color);
  color: white;
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 3);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-header .logo {
  font-size: 1.5em;
  font-weight: bold;
}

.main-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
}

.main-nav li {
  margin-left: calc(var(--spacing-unit) * 2);
}

.main-nav a {
  color: white;
  text-decoration: none;
  padding: var(--spacing-unit);
  display: block;
}

/* 버튼 스타일 */
#action-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
  cursor: pointer;
  border-radius: 4px;
  margin-top: calc(var(--spacing-unit) * 2);
}

/* 푸터 스타일 */
footer {
  text-align: center;
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 3);
  margin-top: calc(var(--spacing-unit) * 5);
  border-top: 1px solid var(--border-color);
  font-size: 0.9em;
  color: #666;
}
"""
                },
                "js": {
                    "main.js": """console.log("Hello, Vanilla! The enhanced template is ready.");

document.getElementById("action-button").addEventListener("click", () => {
    alert("버튼이 클릭되었습니다! main.js에서 이벤트가 처리되었습니다.");
});
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
