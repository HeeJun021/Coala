// frontend/src/api/notionExportApi.ts
export type ExportFilters = {
  date_from?: string;
  date_to?: string;
  include_projects?: boolean;
  include_quiz?: boolean;
  include_codingtest?: boolean;
  include_tech?: boolean;
  project_ids?: number[];
};

export async function exportToNotion(payload: {
  template_url_or_id: string;
  parent_page_url_or_id?: string | null;
  parent_database_url_or_id?: string | null;
  title: string;
  filters: ExportFilters;
}) {
  const res = await fetch("http://localhost:8000/notion/export", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Export 실패");
  }
  return res.json() as Promise<{ page_id: string; url: string }>;
}
