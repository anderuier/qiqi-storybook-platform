# 测试 API 健康检查

Write-Host "正在测试 API 健康检查..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://storybook-gamma-ten.vercel.app/api/health" -TimeoutSec 15
    Write-Host "`n✅ API 正常工作！" -ForegroundColor Green
    Write-Host "`n响应内容：" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`n❌ API 测试失败！" -ForegroundColor Red
    Write-Host "错误信息：$($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
