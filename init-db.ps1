# 数据库初始化脚本

$body = @{
    secret = "c50c15beeaa9f920c45ada993378dbd4"
} | ConvertTo-Json

Write-Host "正在调用数据库初始化接口..." -ForegroundColor Yellow
Write-Host "URL: https://storybook-gamma-ten.vercel.app/api/db/init" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://storybook-gamma-ten.vercel.app/api/db/init" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 60

    Write-Host "`n✅ 数据库初始化成功！" -ForegroundColor Green
    Write-Host "响应内容：" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`n❌ 数据库初始化失败！" -ForegroundColor Red
    Write-Host "错误信息：$($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "响应内容：$responseBody" -ForegroundColor Yellow
    }
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
