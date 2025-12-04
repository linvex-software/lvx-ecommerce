# Script para limpar ambiente de desenvolvimento
# Mata processos nas portas e remove diretórios de build

Write-Host "🧹 Limpando ambiente de desenvolvimento..." -ForegroundColor Cyan

# 1. Matar processos nas portas
Write-Host "`n📌 Matando processos nas portas 3000, 3001, 3002, 3003, 3333..." -ForegroundColor Yellow

$ports = @(3000, 3001, 3002, 3003, 3333)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processes) {
            try {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  ⚠️  Matando processo $pid ($($proc.ProcessName)) na porta $port..." -ForegroundColor Red
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            } catch {
                # Processo já não existe
            }
        }
    } else {
        Write-Host "  ✅ Porta $port está livre" -ForegroundColor Green
    }
}

# 2. Matar processos node relacionados ao repo (opcional, mais agressivo)
Write-Host "`n📌 Verificando processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*white-label-ecommerce*"
}
if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Write-Host "  ⚠️  Matando processo Node.js $($proc.Id)..." -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "  ✅ Nenhum processo Node.js do repo encontrado" -ForegroundColor Green
}

# 3. Remover diretórios .next
Write-Host "`n📌 Removendo diretórios .next..." -ForegroundColor Yellow

$nextDirs = @(
    "apps\web\.next",
    "apps\admin\.next",
    "apps\pdv\.next"
)

foreach ($dir in $nextDirs) {
    if (Test-Path $dir) {
        Write-Host "  🗑️  Removendo $dir..." -ForegroundColor Yellow
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ $dir removido" -ForegroundColor Green
    } else {
        Write-Host "  ✅ $dir não existe" -ForegroundColor Green
    }
}

# 4. Remover .turbo
Write-Host "`n📌 Removendo .turbo..." -ForegroundColor Yellow
if (Test-Path ".turbo") {
    Write-Host "  🗑️  Removendo .turbo..." -ForegroundColor Yellow
    Remove-Item -Path ".turbo" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ .turbo removido" -ForegroundColor Green
} else {
    Write-Host "  ✅ .turbo não existe" -ForegroundColor Green
}

# 5. Remover locks do Next.js se existirem
Write-Host "`n📌 Verificando locks do Next.js..." -ForegroundColor Yellow
$lockFiles = @(
    "apps\web\.next\dev\lock",
    "apps\admin\.next\dev\lock",
    "apps\pdv\.next\dev\lock"
)

foreach ($lock in $lockFiles) {
    if (Test-Path $lock) {
        Write-Host "  🗑️  Removendo $lock..." -ForegroundColor Yellow
        Remove-Item -Path $lock -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ $lock removido" -ForegroundColor Green
    }
}

Write-Host "`n✨ Limpeza concluída! Ambiente pronto para 'pnpm dev'" -ForegroundColor Green

