import apiClient from "./apiClient";

export interface NotionTemplate {
  id: string;
  title: string;
  url?: string;
  emoji?: string;
  icon_url?: string;
}

export interface TemplatePreviewResponse {
  preview_image_url: string | null;
  source: "cover" | "icon" | "first_image_block" | "none";
}

/**
 * 템플릿 검색
 * @param rootPageId (선택) 루트 페이지 ID
 */
export async function searchNotionTemplates(
  rootPageId?: string
): Promise<NotionTemplate[]> {
  try {
    const res = await apiClient.get("/notion/templates", {
      params: rootPageId ? { parent_page_id: rootPageId } : {},
    });
    return res.data?.items || [];
  } catch (err) {
    console.error("템플릿 검색 실패:", err);
    throw err;
  }
}

/**
 * 템플릿 미리보기 이미지 가져오기
 * @param pageId 노션 페이지 ID
 */
export async function getTemplatePreview(
  pageId: string
): Promise<TemplatePreviewResponse> {
  try {
    const res = await apiClient.get("/notion/templates/preview", {
      params: { id: pageId },
    });
    return res.data as TemplatePreviewResponse;
  } catch (err) {
    console.error("템플릿 미리보기 실패:", err);
    throw err;
  }
}
