import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";

export const getLanguageExtension = (filename) => {
  if (filename.endsWith(".js") || filename.endsWith(".jsx")) return javascript();
  if (filename.endsWith(".html")) return html();
  if (filename.endsWith(".css")) return css();
  if (filename.endsWith(".py")) return python();
  return [];
};

export const templateDescriptions = {
  vanilla: { emoji: "🌐", label: "기본 HTML/CSS/JS 정적 웹 템플릿입니다." },
  react: { emoji: "⚛️", label: "React 기반의 컴포넌트 기반 UI 템플릿입니다." },
  vue: { emoji: "🖖", label: "Vue.js 프레임워크로 구성된 프론트엔드 템플릿입니다." },
  next: { emoji: "⏭️", label: "Next.js 기반의 SSR/정적 사이트 템플릿입니다." },
  fastapi: { emoji: "🚀", label: "FastAPI를 이용한 경량 Python 웹 서버 템플릿입니다." },
  flask: { emoji: "🍶", label: "Flask 기반의 간단한 Python 웹 서버 템플릿입니다." },
};

export const templateFiles = {
  react: {
    public: {
      "index.html": `<!DOCTYPE html><html><body><div id='root'></div></body></html>`,
    },
    src: {
      "App.jsx": `function App() {
  return <h1>Hello Vite + React!</h1>;
}
export default App;`,
      "main.jsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
    },
    "package.json": `{
  "name": "vite-react",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`,
    "vite.config.js": `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });`,
  },
  vanilla: {
    "index.html": `<!DOCTYPE html>
<html>
  <head><title>Vanilla</title><link rel="stylesheet" href="style.css"></head>
  <body><h1>Hello Vanilla</h1><script src="script.js"></script></body>
</html>`,
    "style.css": `body { font-family: sans-serif; }`,
    "script.js": `console.log('Hello Vanilla!');`,
  },
  vue: {
    public: {
      "index.html": `<!DOCTYPE html><html><body><div id="app"></div></body></html>`,
    },
    src: {
      "App.vue": `<template><h1>Hello Vue</h1></template>`,
      "main.js": `import { createApp } from 'vue';
import App from './App.vue';
createApp(App).mount('#app');`,
    },
    "package.json": `{
  "name": "vite-vue",
  "dependencies": { "vue": "^3.0.0" }
}`,
  },
  next: {
    pages: {
      "index.js": `export default function Home() {
  return <h1>Hello from Next.js</h1>;
}`,
    },
    "package.json": `{
  "name": "next-app",
  "dependencies": {
    "next": "13.x",
    "react": "18.x",
    "react-dom": "18.x"
  }
}`,
    "next.config.js": `module.exports = { reactStrictMode: true };`,
  },
  fastapi: {
    "main.py": `from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}`,
    "requirements.txt": `fastapi\nuvicorn`,
  },
  flask: {
    "app.py": `from flask import Flask
app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello Flask!"`,
    "requirements.txt": `flask`,
  },
};