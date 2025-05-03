import apiClient from "./apiClient";

// ✅ 전체 템플릿 단위 저장
export const createTemplate = async ({ template_name, files }) => {
  const response = await apiClient.post("/freecode/create-template", {
    template_name,
    files,
  });
  return response.data;
};

// ✅ 파일 단위 저장 (수정 후 저장 아이콘 클릭 시 사용)
export const saveCodeFile = async ({ code_id, content }) => {
  const response = await apiClient.patch("/freecode/save", {
    code_id,
    content,
  });
  return response.data;
};

// ✅ 폴더 이름 저장 (리네임 또는 새로 만들기 후)
export const saveFolderName = async ({ folder_id, new_name }) => {
  const response = await apiClient.patch("/freecode/save-folder", {
    folder_id,
    new_name,
  });
  return response.data;
};

// ✅ 폴더/파일 삭제
export const deleteItem = async ({ item_id, item_type }) => {
  const response = await fetch("/freecode/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ item_id, item_type }),
  });

  if (!response.ok) {
    throw new Error("삭제 실패");
  }

  return await response.json();
};

// ✅ 전체 구조 불러오기
export const loadStructure = async () => {
  const response = await apiClient.get("/freecode/load-structure");
  return response.data.folders;
};

// ✅ 이름 변경 (파일 또는 폴더)
export const renameItem = async ({ item_id, item_type, new_name }) => {
  const res = await apiClient.put("/freecode/rename", {
    item_id,
    item_type,
    new_name,
  });
  return res.data;
};
