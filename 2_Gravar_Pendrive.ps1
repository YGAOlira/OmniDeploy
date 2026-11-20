<#
.SYNOPSIS
    Instalador Interativo de Pendrive - OmniDeploy v1.0.
.DESCRIPTION
    Formata com segurança a unidade USB selecionada, cria o particionamento
    híbrido compatível com UEFI (GPT) e Legacy (MBR), aplica o setor de boot
    e copia todos os arquivos de OMNI_BOOT e OMNI_DADOS com barra de progresso.
.AUTHOR
    Desenvolvido por Ygor Paes
#>

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = $ScriptDir
$BuildBootDir = Join-Path $ProjectRoot "Build\OMNI_BOOT"
$BuildDadosDir = Join-Path $ProjectRoot "Build\OMNI_DADOS"
$ToolsDir = Join-Path $ProjectRoot "Build\Ferramentas"

function Write-OmniBanner {
    Clear-Host
    Write-Host ""
    Write-Host " ==========================================================================" -ForegroundColor Cyan
    Write-Host "   OMNIDEPLOY (v1.0) - GRAVADOR DE PENDRIVE" -ForegroundColor Yellow
    Write-Host "   Desenvolvido por Ygor Paes" -ForegroundColor White
    Write-Host " ==========================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-IsAdmin {
    $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

Write-OmniBanner

# 1. Validação de privilégios de administrador
if (-not (Test-IsAdmin)) {
    Write-Host " [ERRO] Este script requer privilégios de Administrador para particionar o pendrive." -ForegroundColor Red
    Write-Host " Por favor, execute através do 'Gravar_Pendrive.bat' ou abra o PowerShell como Administrador." -ForegroundColor Yellow
    Write-Host ""
    Read-Host " Pressione ENTER para sair..."
    exit 1
}

# 2. Verificação dos arquivos de Boot
if (-not (Test-Path (Join-Path $BuildBootDir "sources\boot.wim"))) {
    Write-Host " [ERRO] Base de boot não encontrada em '$BuildBootDir'." -ForegroundColor Red
    Write-Host " Execute primeiro o script '1_Gerar_Base_WinPE.bat' para preparar os arquivos de boot." -ForegroundColor Yellow
    Write-Host ""
    Read-Host " Pressione ENTER para sair..."
    exit 1
}

# Localização da imagem do Windows (.wim ou .esd)
$WimFile = Get-ChildItem -Path (Join-Path $BuildDadosDir "01_ISOs_Imagens") -Filter "*.wim" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $WimFile) {
    $WimFile = Get-ChildItem -Path (Join-Path $ProjectRoot "01_ISOs_Imagens") -Filter "*.wim" -ErrorAction SilentlyContinue | Select-Object -First 1
}
if (-not $WimFile) {
    $WimFile = Get-ChildItem -Path (Join-Path $BuildDadosDir "01_ISOs_Imagens") -Filter "*.esd" -ErrorAction SilentlyContinue | Select-Object -First 1
}
if (-not $WimFile) {
    $WimFile = Get-ChildItem -Path (Join-Path $ProjectRoot "01_ISOs_Imagens") -Filter "*.esd" -ErrorAction SilentlyContinue | Select-Object -First 1
}

# Localização do executável
$ExeFile = Join-Path $BuildDadosDir "05_App_Sistema\OmniDeploy.exe"
if (-not (Test-Path $ExeFile)) {
    $CandidateExe = Join-Path $ProjectRoot "src\OmniDeploy\bin\Release\net8.0-windows\win-x64\publish\OmniDeploy.exe"
    if (Test-Path $CandidateExe) { $ExeFile = $CandidateExe }
}

if (-not $WimFile -or -not (Test-Path $ExeFile)) {
    Write-Host " [ERRO] Estrutura de dados incompleta." -ForegroundColor Red
    if (-not $WimFile) { Write-Host "   - Imagem do Windows (.wim ou .esd) ausente em 01_ISOs_Imagens\" -ForegroundColor Red }
    if (-not (Test-Path $ExeFile)) { Write-Host "   - OmniDeploy.exe ausente em 05_App_Sistema\ (ou em bin/publish)" -ForegroundColor Red }
    Write-Host ""
    Read-Host " Pressione ENTER para sair..."
    exit 1
}

# 3. Listagem apenas de discos USB
Write-Host " [*] Buscando unidades USB conectadas..." -ForegroundColor Cyan
$UsbDisks = Get-Disk | Where-Object { $_.BusType -eq 'USB' }

if (-not $UsbDisks -or $UsbDisks.Count -eq 0) {
    Write-Host ""
    Write-Host " [!] NENHUM DISCO USB / PENDRIVE ENCONTRADO." -ForegroundColor Red
    Write-Host " Conecte o pendrive que deseja utilizar e execute novamente o script." -ForegroundColor Yellow
    Write-Host ""
    Read-Host " Pressione ENTER para sair..."
    exit 1
}

Write-Host ""
Write-Host " DISCOS REMOVÍVEIS (USB) DISPONÍVEIS:" -ForegroundColor Green
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host (" {0,-8} | {1,-35} | {2,-12} | {3,-10}" -f "DISCO", "MODELO / DISPOSITIVO", "TAMANHO", "ESTILO") -ForegroundColor White
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkGray

foreach ($d in $UsbDisks) {
    $sizeGb = [Math]::Round($d.Size / 1GB, 2)
    $style = if ($d.PartitionStyle -eq 'RAW') { "Não inic." } else { $d.PartitionStyle }
    Write-Host (" [Disco {0,-2}] | {1,-35} | {2,8} GB  | {3,-10}" -f $d.Number, $d.FriendlyName, $sizeGb, $style) -ForegroundColor Yellow
}
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# 4. Seleção e Confirmação de Segurança
$SelectedDiskNumber = $null
while ($true) {
    $inputNumber = Read-Host " Digite o NÚMERO do disco USB que deseja formatar (ex: 1)"
    if ($inputNumber -match '^\d+$') {
        $found = $UsbDisks | Where-Object { $_.Number -eq [int]$inputNumber }
        if ($found) {
            $SelectedDiskNumber = [int]$inputNumber
            $TargetDisk = $found
            break
        }
    }
    Write-Host " [!] Número inválido. Digite apenas o número de um dos discos USB listados acima." -ForegroundColor Red
}

$DiskSizeGb = [Math]::Round($TargetDisk.Size / 1GB, 2)
Write-Host ""
Write-Host " ================================= ATENÇÃO =================================" -ForegroundColor Red
Write-Host " DISCO ESCOLHIDO: Disco $($TargetDisk.Number) - $($TargetDisk.FriendlyName) ($DiskSizeGb GB)" -ForegroundColor Yellow
Write-Host " TODOS OS DADOS PRESENTES NESTE PENDRIVE SERÃO COMPLETAMENTE APAGADOS!" -ForegroundColor Red
Write-Host " ==========================================================================" -ForegroundColor Red
Write-Host ""
$Confirm = Read-Host " Para confirmar e prosseguir com a gravação, digite exatamente 'SIM'"

if ($Confirm.Trim().ToUpper() -ne "SIM") {
    Write-Host ""
    Write-Host " [*] Operação cancelada pelo usuário. Nenhuma alteração foi feita." -ForegroundColor Yellow
    Write-Host ""
    Read-Host " Pressione ENTER para sair..."
    exit 0
}

# 5. Localização de letras de unidade livres
$UsedLetters = (Get-Volume).DriveLetter | Where-Object { $_ }
$FreeLetters = [char[]](68..90) | Where-Object { $_ -notin $UsedLetters -and $_ -ne 'X' }

if ($FreeLetters.Count -lt 2) {
    Write-Host " [ERRO] Não há letras de unidade disponíveis no sistema para montagem." -ForegroundColor Red
    exit 1
}

$BootLetter = $FreeLetters[0]
$DadosLetter = $FreeLetters[1]

Write-Host ""
Write-Host " [*] Letras temporárias atribuídas:" -ForegroundColor Cyan
Write-Host "     Partição 1 (OMNI_BOOT)  : ${BootLetter}: (1.5 GB FAT32 - Ativa)" -ForegroundColor Gray
Write-Host "     Partição 2 (OMNI_DADOS) : ${DadosLetter}: (Restante NTFS)" -ForegroundColor Gray

# 6. Particionamento e formatação via DiskPart
Write-Host ""
Write-Host " [*] Executando particionamento híbrido MBR/UEFI no Disco $SelectedDiskNumber..." -ForegroundColor Cyan

$DiskpartScript = @"
select disk $SelectedDiskNumber
clean
convert mbr
create partition primary size=1536
format quick fs=fat32 label="OMNI_BOOT"
active
assign letter=$BootLetter
create partition primary
format quick fs=ntfs label="OMNI_DADOS"
assign letter=$DadosLetter
exit
"@

$DiskpartFile = Join-Path $env:TEMP "prep_pendrive.txt"
Set-Content -Path $DiskpartFile -Value $DiskpartScript -Encoding ASCII

$dpProcess = Start-Process -FilePath "diskpart.exe" -ArgumentList "/s `"$DiskpartFile`"" -Wait -NoNewWindow -PassThru
Remove-Item -Path $DiskpartFile -Force -ErrorAction SilentlyContinue

if ($dpProcess.ExitCode -ne 0) {
    Write-Host " [ERRO] Falha no DiskPart (Código de saída: $($dpProcess.ExitCode))." -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# 7. Aplicação do setor de inicialização (bootsect /nt60 /mbr)
Write-Host " [*] Aplicando código de inicialização Legacy MBR..." -ForegroundColor Cyan
$BootsectExe = (Join-Path $ToolsDir "bootsect.exe")
if (-not (Test-Path $BootsectExe)) {
    $BootsectExe = (Join-Path $BuildBootDir "boot\bootsect.exe")
}
if (-not (Test-Path $BootsectExe)) {
    $BootsectExe = "bootsect.exe"
}

if (Test-Path $BootsectExe) {
    & $BootsectExe /nt60 "${BootLetter}:" /mbr | Out-Null
    Write-Host " [+] Código de inicialização aplicado na partição ${BootLetter}:" -ForegroundColor Green
} else {
    Write-Host " [!] bootsect.exe não localizado; o setor padrão do formato foi preservado." -ForegroundColor Yellow
}

# 8. Cópia dos arquivos da partição OMNI_BOOT
Write-Host ""
Write-Host " [*] Copiando arquivos de boot para OMNI_BOOT (${BootLetter}:)..." -ForegroundColor Cyan
$RoboCopy1 = Start-Process -FilePath "robocopy.exe" -ArgumentList "`"$BuildBootDir`" `"${BootLetter}:`" /E /R:2 /W:2 /NP /NFL /NDL" -Wait -NoNewWindow -PassThru

if ($RoboCopy1.ExitCode -ge 8) {
    Write-Host " [ERRO] Falha ao copiar arquivos para OMNI_BOOT." -ForegroundColor Red
    exit 1
}
Write-Host " [+] Base de boot copiada com sucesso!" -ForegroundColor Green

# 9. Cópia dos arquivos da partição OMNI_DADOS
Write-Host ""
Write-Host " [*] Copiando imagens, drivers, scripts e OmniDeploy para OMNI_DADOS (${DadosLetter}:)..." -ForegroundColor Cyan
Write-Host "     (A transferência da imagem do Windows pode levar de 1 a 3 minutos dependendo da velocidade do USB)" -ForegroundColor Gray

$sw = [System.Diagnostics.Stopwatch]::StartNew()

# Se Build\OMNI_DADOS já estiver montado, copia de lá; caso contrário, copia da raiz estruturada
if (Test-Path $BuildDadosDir) {
    $RoboCopy2 = Start-Process -FilePath "robocopy.exe" -ArgumentList "`"$BuildDadosDir`" `"${DadosLetter}:`" /E /R:2 /W:2 /NP" -Wait -NoNewWindow -PassThru
} else {
    # Copia pastas estruturadas individuais
    New-Item -ItemType Directory -Path "${DadosLetter}:\01_ISOs_Imagens" -Force | Out-Null
    Copy-Item $WimFile.FullName -Destination "${DadosLetter}:\01_ISOs_Imagens\" -Force
    if (Test-Path (Join-Path $ProjectRoot "02_Drivers")) {
        Start-Process -FilePath "robocopy.exe" -ArgumentList "`"$(Join-Path $ProjectRoot '02_Drivers')`" `"${DadosLetter}:\02_Drivers`" /E /R:2 /W:2 /NP" -Wait -NoNewWindow | Out-Null
    }
    if (Test-Path (Join-Path $ProjectRoot "03_Scripts")) {
        Start-Process -FilePath "robocopy.exe" -ArgumentList "`"$(Join-Path $ProjectRoot '03_Scripts')`" `"${DadosLetter}:\03_Scripts`" /E /R:2 /W:2 /NP" -Wait -NoNewWindow | Out-Null
    }
    if (Test-Path (Join-Path $ProjectRoot "04_Config")) {
        Start-Process -FilePath "robocopy.exe" -ArgumentList "`"$(Join-Path $ProjectRoot '04_Config')`" `"${DadosLetter}:\04_Config`" /E /R:2 /W:2 /NP" -Wait -NoNewWindow | Out-Null
    }
    New-Item -ItemType Directory -Path "${DadosLetter}:\05_App_Sistema" -Force | Out-Null
    Copy-Item $ExeFile -Destination "${DadosLetter}:\05_App_Sistema\OmniDeploy.exe" -Force
    $RoboCopy2 = [PSCustomObject]@{ ExitCode = 0 }
}
$sw.Stop()

if ($RoboCopy2.ExitCode -ge 8) {
    Write-Host " [ERRO] Falha ao copiar arquivos para OMNI_DADOS." -ForegroundColor Red
    exit 1
}
Write-Host " [+] Dados copiados com sucesso em $($sw.Elapsed.ToString('mm\:ss'))!" -ForegroundColor Green

# 10. Verificação final de integridade
Write-Host ""
Write-Host " [*] Verificando integridade dos arquivos gravados..." -ForegroundColor Cyan
$Checks = @(
    @{ Path = "${BootLetter}:\bootmgr"; Desc = "Gerenciador BIOS (bootmgr)" },
    @{ Path = "${BootLetter}:\boot\bcd"; Desc = "BCD Store BIOS" },
    @{ Path = "${BootLetter}:\efi\boot\bootx64.efi"; Desc = "Gerenciador UEFI x64" },
    @{ Path = "${BootLetter}:\sources\boot.wim"; Desc = "Ambiente WinPE (boot.wim)" },
    @{ Path = "${DadosLetter}:\05_App_Sistema\OmniDeploy.exe"; Desc = "Executável OmniDeploy.exe" }
)

$AllOk = $true
foreach ($chk in $Checks) {
    if (Test-Path $chk.Path) {
        Write-Host "  [OK] $($chk.Desc)" -ForegroundColor Green
    } else {
        Write-Host "  [FALHA] $($chk.Desc)" -ForegroundColor Red
        $AllOk = $false
    }
}

Write-Host ""
if ($AllOk) {
    Write-Host " ==========================================================================" -ForegroundColor Green
    Write-Host "   PENDRIVE OMNIDEPLOY GRAVADO COM SUCESSO E PRONTO PARA USO!" -ForegroundColor Green
    Write-Host "   Compatível com UEFI (GPT) e Legacy (MBR) em qualquer equipamento." -ForegroundColor Green
    Write-Host " ==========================================================================" -ForegroundColor Green
} else {
    Write-Host " [AVISO] Alguns arquivos não puderam ser verificados. Confira as mensagens acima." -ForegroundColor Yellow
}

Write-Host ""
Read-Host " Pressione ENTER para finalizar..."
