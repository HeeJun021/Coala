# ingest_templates.ps1 (디버그/인증/에러출력 보강판)

# --- 한글 출력/전송 깨짐 방지 ---
chcp 65001 > $null
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['Invoke-RestMethod:ContentType'] = 'application/json; charset=utf-8'

# --- API 기본 URL ---
$base = "http://localhost:8000"

# (옵션) 라우터가 인증을 요구한다면 토큰 추가
# $headers = @{ Authorization = "Bearer <YOUR_API_TOKEN>" }

# --- Notion URL에서 page_id(32자리 hex) 추출 ---
function Get-NotionPageId([string]$url) {
    if (-not $url) { throw "빈 URL" }
    $url = $url.Trim()

    # 1) 끝의 32자리 hex
    $m = [regex]::Match($url, '[0-9a-fA-F]{32}$')
    if ($m.Success) { return $m.Value.ToLower() }

    # 2) 끝의 하이픈 포함 UUID -> 하이픈 제거
    $m2 = [regex]::Match($url, '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
    if ($m2.Success) { return ($m2.Value -replace '-', '').ToLower() }

    throw "Notion 페이지 URL 형식이 아님(마지막에 페이지 ID가 없음): $url"
}

# === 여기 배열만 수정해서 사용하세요 ===
$templates = @(
    @{ url="https://www.notion.so/26f6a27ce65080458e39d0cd68abaaad"; key="tpl-1"; title="템플릿 1"; description="자동 인제스트 템플릿 1" },
    @{ url="https://www.notion.so/1-26a6a27ce65080d399e6ef42af45c9e6"; key="tpl-2"; title="템플릿 2"; description="자동 인제스트 템플릿 2" },
    @{ url="https://www.notion.so/26d6a27ce650807d81abffbc43b8a825"; key="tpl-3"; title="템플릿 3"; description="자동 인제스트 템플릿 3" }
)


foreach ($tpl in $templates) {
    $pageId32 = $null  # 루프마다 초기화
    try {
        $pageId32 = Get-NotionPageId $tpl.url
        Write-Host "DEBUG: url=$($tpl.url) -> pageId32=$pageId32"

        $body = @{
            page_id     = $pageId32
            key         = $tpl.key
            title       = $tpl.title
            description = $tpl.description
        } | ConvertTo-Json -Depth 10

        # (옵션) 인증이 필요하면 -Headers $headers 추가
        $res = Invoke-RestMethod -Uri "$base/templates/ingest" -Method POST -Body $body -ContentType "application/json; charset=utf-8" # -Headers $headers

        $resTitle  = $res.title
        $resBlocks = $res.blocks_count
        Write-Host "[OK] key=$($tpl.key) → id=$($res.template_id), version=$($res.version), blocks=$resBlocks, title='$resTitle'"
    }
    catch {
    $status  = ""
    $errBody = ""

    # ✅ 여기서 null 처리용 출력 변수 준비
    $pageIdOut = if ($null -ne $pageId32) { $pageId32 } else { '<null>' }

    if ($_.Exception.Response) {
        try {
            $status = $_.Exception.Response.StatusCode.value__
            $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $sr.ReadToEnd()
        } catch { }
    }

    # 👇 문자열 안에서는 $pageIdOut 사용
    Write-Warning "[FAIL] key=$($tpl.key) url=$($tpl.url) pageId32=$pageIdOut status=$status"
    if ($errBody) { Write-Host "SERVER ERROR: $errBody" }
    Write-Host "HINT: 이 페이지에 Coala Integration이 직접 공유(Share)되어 있는지, 그리고 URL이 '데이터베이스'가 아닌 '페이지' URL인지 확인하세요." -ForegroundColor Yellow
}

}

Write-Host "`n완료. 목록 확인:"
try {
    # 슬래시 포함 경로 권장
    $list = Invoke-RestMethod "$base/templates/"  # -Headers $headers
    $list | ConvertTo-Json -Depth 10
} catch {
    Write-Warning "목록 조회 실패"
    if ($_.Exception.Response) {
        try {
            $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $sr.ReadToEnd()
            Write-Host "SERVER ERROR: $errBody"
        } catch { }
    }
}
