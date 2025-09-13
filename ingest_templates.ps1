# ingest_templates.ps1
# --- 한글 출력/전송 깨짐 방지 ---
chcp 65001 > $null
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['Invoke-RestMethod:ContentType'] = 'application/json; charset=utf-8'


# --- API 기본 URL ---
$base = "http://localhost:8000"

# --- Notion URL에서 page_id(32자리 hex) 추출 ---
function Get-NotionPageId([string]$url) {
    if (-not $url) { return $null }
    # 1) 끝의 32자리 hex 추출 (일반적인 공유 URL 형식)
    $m = [regex]::Match($url, '[0-9a-fA-F]{32}$')
    if ($m.Success) { return $m.Value.ToLower() }

    # 2) 하이픈 포함 UUID가 있으면 하이픈 제거해서 반환
    $m2 = [regex]::Match($url, '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')
    if ($m2.Success) { return ($m2.Value -replace '-', '').ToLower() }

    throw "Notion URL에서 page_id를 찾을 수 없습니다: $url"
}

# === 여기 배열만 수정해서 사용하세요 ===
$templates = @(
    @{
        url         = "https://www.notion.so/1-26a6a27ce65080d399e6ef42af45c9e6"
        key         = "tpl-1"                 # 고유 키(같은 키 재실행 시 version++)
        title       = "템플릿 1"              # DB에 저장될 제목
        description = "자동 인제스트 템플릿 1" # 설명
    },
    @{
        url         = "https://www.notion.so/1-26a6a27ce65080d399e6ef42af45c9e6"
        key         = "tpl-2"
        title       = "템플릿 2"
        description = "자동 인제스트 템플릿 2"
    }
)
# =====================================

foreach ($tpl in $templates) {
    try {
        $pageId32 = Get-NotionPageId $tpl.url

        # body 구성 (엔드포인트는 page_id(32/UUID 상관 없음), key, title, description 사용)
        $body = @{
            page_id     = $pageId32
            key         = $tpl.key
            title       = $tpl.title
            description = $tpl.description
        } | ConvertTo-Json -Depth 10

        $res = Invoke-RestMethod -Uri "$base/templates/ingest" -Method POST -Body $body -ContentType "application/json; charset=utf-8"

        Write-Host "[OK] key=$($tpl.key) → id=$($res.template_id), version=$($res.version), blocks=$($res.blocks_count)"
    }
    catch {
        Write-Warning "[FAIL] key=$($tpl.key) url=$($tpl.url) - $($_.Exception.Message)"
    }
}

Write-Host "`n완료. 목록 확인:"
Invoke-RestMethod "$base/templates" | ConvertTo-Json -Depth 10
