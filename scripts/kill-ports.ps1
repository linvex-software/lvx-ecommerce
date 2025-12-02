# Script para matar processos nas portas 3000, 3001, 3002, 3333
Write-Host "Matando processos nas portas 3000, 3001, 3002, 3333..." -ForegroundColor Yellow

$ports = @(3000, 3001, 3002, 3333)

foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

    if ($process) {
        foreach ($pid in $process) {
            Write-Host "Matando processo $pid na porta $port..." -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "Porta $port está livre" -ForegroundColor Green
    }
}

Write-Host "`nPortas liberadas! Agora você pode rodar 'pnpm dev' sem conflitos." -ForegroundColor Green

