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
        "default_folder_name": "Default_html",
        "open_files": ["index.html", "src/js/main.js"],
        "tree": {
            "index.html": """<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanilla Starter</title>
    <link rel="stylesheet" href="src/css/style.css" />
  </head>
  <body>
    <h1>Hello, HTML!</h1>
    <p>이 프로젝트는 HTML/CSS/JS로 바로 실행할 수 있는 가장 기본 템플릿입니다.</p>
    <script src="src/js/main.js"></script>
  </body>
</html>
""",
            "src": {
                "css": {
                    "style.css": """body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif;
  margin: 24px;
  line-height: 1.6;
}
h1 { margin-bottom: 8px; }
"""
                },
                "js": {
                    "main.js": """console.log("Hello, Vanilla!");"""
                },
            },
            "assets": {},
            "README.md": "# Vanilla Starter\n\n가장 기본적인 정적 웹 스타터입니다.\n",
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
