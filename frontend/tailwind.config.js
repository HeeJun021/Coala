/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // src 폴더 내 모든 js, jsx, ts, tsx 파일에서 TailwindCSS 사용 가능
  theme: {
    extend: {
      colors: {
        navbar: "#81A978", //상단바 기본 색깔
        accent: "#A7DA9B", //버튼 등 약간 밝은 초록색
        dark: "#959595", //하이라이트 죽은 색
        white: "#FFFFFF", //흰 색
        popup: "#F3EDCD" //팝업버튼이나 마이페이지에 둘 색
      }
    }, // 사용자 정의 테마 확장
  },
  plugins: [],
}

