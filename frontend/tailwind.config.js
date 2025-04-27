/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "Figma Hand": ["'Figma Hand'", "sans-serif"], // 추가된 폰트
      },
      colors: {
        navbar: "#81A978", // 상단바 기본 색깔
        accent: "#1CCC5D", // 버튼 등 약간 밝은 초록색
        dark: "#959595", // 하이라이트 죽은 색
        white: "#FFFFFF", // 흰색
        popup: "#F3EDCD", // 팝업 버튼이나 마이페이지에 둘 색
        beige: "#F8F3E2", // 전체 배경에 쓰이는 베이지색
        gray: {
          200: "#EFEFEF", // 연한 회색
          600: "#959595", // 기존 dark 색과 동일
        },
        green: {
          400: "#A7DA9B", // 기존 accent 색과 동일
        },
      },
    },
  },
  plugins: [],
};

