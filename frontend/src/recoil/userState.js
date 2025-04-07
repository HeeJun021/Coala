import { atom } from "recoil";

// 로그인된 사용자 정보 상태
export const loginUserState = atom({
  key: "loginUserState",
  default: null, // { user_id: 1, username: "코알라" } 이런 식으로 저장될 예정
});
