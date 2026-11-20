<#
.SYNOPSIS
    Gera e prepara a base WinPE (x64) para o OmniDeploy v1.0.
.DESCRIPTION
    Verifica a instalação do Windows ADK e do WinPE Add-on. Caso disponíveis,
    monta o boot.wim, habilita os pacotes recomendados (WMI, NetFX, PowerShell, etc.)
    e configura o winpeshl.ini para executar OmniDeploy.exe automaticamente.
    Caso o ADK não esteja instalado, exibe as instruções exatas de download e
    oferece a preparação imediata utilizando a base da ISO do Windows.
.AUTHOR
    Desenvolvido por Ygor Paes
#>

param (
    [switch]$ForceFromIso
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = $ScriptDir
$BuildBootDir = Join-Path $ProjectRoot "Build\OMNI_BOOT"
$BuildDadosDir = Join-Path $ProjectRoot "Build\OMNI_DADOS"
$ImagesDir = Join-Path $ProjectRoot "01_ISOs_Imagens"

function Write-OmniBanner {
    Write-Host ""
    Write-Host " ==========================================================================" -ForegroundColor Cyan
    Write-Host "   OMNIDEPLOY (v1.0) - GERADOR DE BASE WINPE" -ForegroundColor Yellow
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

# 1. Verificação do Windows ADK
$AdkDeploymentPath = "C:\Program Files (x86)\Windows Kits\10\Assessment and Deployment Kit\Deployment Tools"
$AdkWinPEPath = "C:\Program Files (x86)\Windows Kits\10\Assessment and Deployment Kit\Windows Preinstallation Environment"

$HasADK = (Test-Path $AdkDeploymentPath) -and (Test-Path $AdkWinPEPath)

Write-Host "[*] Verificando ambiente de ferramentas do Windows..." -ForegroundColor Cyan

if (-not $HasADK) {
    Write-Host ""
    Write-Host " [AVISO] Windows ADK ou WinPE Add-on não foram localizados nos caminhos padrão:" -ForegroundColor Yellow
    Write-Host "   - ADK Tools : $AdkDeploymentPath" -ForegroundColor DarkGray
    Write-Host "   - WinPE Addon: $AdkWinPEPath" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host " Para instalar o Windows ADK completo oficial da Microsoft:" -ForegroundColor White
    Write-Host "   1. Windows ADK (Windows 11):" -ForegroundColor Cyan
    Write-Host "      https://go.microsoft.com/fwlink/?linkid=2271337" -ForegroundColor Gray
    Write-Host "   2. WinPE Add-on para Windows ADK:" -ForegroundColor Cyan
    Write-Host "      https://go.microsoft.com/fwlink/?linkid=2271338" -ForegroundColor Gray
    Write-Host ""
    Write-Host " [*] Ativando MODO AUTOMÁTICO VIA ISO DO PROJETO..." -ForegroundColor Green
    Write-Host "     O OmniDeploy utilizará a estrutura WinPE híbrida (UEFI GPT + Legacy MBR)" -ForegroundColor Gray
    Write-Host "     extraída diretamente da ISO oficial do Windows 11." -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host " [+] Windows ADK e WinPE Add-on encontrados com sucesso!" -ForegroundColor Green
}

# 2. Localização da ISO
$CandidateDirs = @($ImagesDir, $ProjectRoot, "C:\Users\YGAO\Desktop\preparaçao projeto")
$IsoPath = $null
foreach ($dir in $CandidateDirs) {
    if (Test-Path $dir) {
        $found = Get-ChildItem -Path $dir -Filter "*.iso" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
        if ($found) { $IsoPath = $found; break }
    }
}

if (-not $IsoPath -or -not (Test-Path $IsoPath)) {
    if (-not $HasADK) {
        Write-Host " [-] Nenhuma ISO do Windows encontrada em '01_ISOs_Imagens/' ou diretórios vizinhos." -ForegroundColor Red
        Write-Host "     Coloque a ISO do Windows 11 na pasta '01_ISOs_Imagens/' ou instale o Windows ADK." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host " [+] ISO localizada: $(Split-Path -Leaf $IsoPath)" -ForegroundColor Green
}

# 3. Preparação das pastas
if (-not (Test-Path $BuildBootDir)) {
    New-Item -ItemType Directory -Path $BuildBootDir -Force | Out-Null
}

# 4. Caso o ADK esteja presente e não forçado via ISO
if ($HasADK -and -not $ForceFromIso) {
    if (-not (Test-IsAdmin)) {
        Write-Host " [!] É necessário executar como Administrador para montar e injetar pacotes no WinPE via ADK." -ForegroundColor Red
        Write-Host "     Execute este script em uma janela do PowerShell com privilégios elevados." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "[*] Construindo base WinPE utilizando Windows ADK..." -ForegroundColor Cyan
    $TempWorkDir = Join-Path $env:TEMP "OmniDeploy_WinPE_Work"
    if (Test-Path $TempWorkDir) { Remove-Item -Path $TempWorkDir -Recurse -Force -ErrorAction SilentlyContinue }
    
    $DandISetEnv = Join-Path $AdkDeploymentPath "DandISetEnv.bat"
    $CopyPeCmd = Join-Path $AdkWinPEPath "copype.cmd"
    
    Write-Host "    Executando copype amd64..." -ForegroundColor Gray
    cmd.exe /c "`"$CopyPeCmd`" amd64 `"$TempWorkDir`"" | Out-Null

    $MountDir = Join-Path $TempWorkDir "mount"
    $BootWim = Join-Path $TempWorkDir "media\sources\boot.wim"
    
    Write-Host "    Montando boot.wim..." -ForegroundColor Gray
    dism.exe /Mount-Wim /WimFile:$BootWim /Index:1 /MountDir:$MountDir

    $WinPE_OCs = Join-Path $AdkWinPEPath "amd64\WinPE_OCs"
    $Packages = @(
        "WinPE-WMI.cab",
        "WinPE-NetFX.cab",
        "WinPE-Scripting.cab",
        "WinPE-PowerShell.cab",
        "WinPE-StorageWMI.cab",
        "WinPE-DismCmdlets.cab"
    )

    foreach ($pkg in $Packages) {
        $pkgPath = Join-Path $WinPE_OCs $pkg
        if (Test-Path $pkgPath) {
            Write-Host "    Adicionando pacote $pkg..." -ForegroundColor Gray
            dism.exe /Image:$MountDir /Add-Package /PackagePath:$pkgPath | Out-Null
        }
    }

    # Configuração do winpeshl.ini
    $WinpeshlContent = @"
[LaunchApps]
"wpeinit.exe"
"cmd.exe", "/c %SYSTEMDRIVE%\Windows\System32\startnet_omnideploy.cmd"
"@
    Set-Content -Path (Join-Path $MountDir "Windows\System32\winpeshl.ini") -Value $WinpeshlContent -Encoding ASCII

    $StartnetOmni = @"
@echo off
title OmniDeploy v1.0
echo [OmniDeploy] Inicializando ambiente WinPE...
echo [OmniDeploy] Localizando particao de dados OMNI_DADOS...
for %%d in (C D E F G H I J K L M N O P Q R S T U V W Y Z) do (
    if exist "%%d:\05_App_Sistema\OmniDeploy.exe" (
        echo [OmniDeploy] Unidade OMNI_DADOS detectada em %%d:
        set "OMNI_DADOS=%%d:"
        start "" "%%d:\05_App_Sistema\OmniDeploy.exe"
        goto :app_started
    )
)
echo [OmniDeploy] AVISO: Particao OMNI_DADOS nao localizada automaticamente.
cmd.exe
:app_started
"@
    Set-Content -Path (Join-Path $MountDir "Windows\System32\startnet_omnideploy.cmd") -Value $StartnetOmni -Encoding ASCII

    Write-Host "    Salvando e desmontando boot.wim..." -ForegroundColor Gray
    dism.exe /Unmount-Wim /MountDir:$MountDir /Commit

    Write-Host "    Copiando arquivos de inicialização para $BuildBootDir..." -ForegroundColor Gray
    Copy-Item -Path "$TempWorkDir\media\*" -Destination $BuildBootDir -Recurse -Force
    Remove-Item -Path $TempWorkDir -Recurse -Force -ErrorAction SilentlyContinue

} else {
    # Preparação direta através da ISO
    Write-Host "[*] Extraindo e configurando componentes de boot a partir da ISO..." -ForegroundColor Cyan

    $MountResult = Mount-DiskImage -ImagePath $IsoPath -PassThru
    $DriveLetter = ($MountResult | Get-Volume).DriveLetter
    $IsoRoot = "$($DriveLetter):\"

    try {
        Write-Host "    ISO montada na unidade $IsoRoot" -ForegroundColor Gray
        
        Write-Host "    Copiando gerenciadores de boot (UEFI + Legacy)..." -ForegroundColor Gray
        Copy-Item (Join-Path $IsoRoot "bootmgr") "$BuildBootDir\" -Force
        if (Test-Path (Join-Path $IsoRoot "bootmgr.efi")) {
            Copy-Item (Join-Path $IsoRoot "bootmgr.efi") "$BuildBootDir\" -Force
        }
        
        Write-Host "    Copiando pastas boot\ e efi\..." -ForegroundColor Gray
        Copy-Item (Join-Path $IsoRoot "boot") "$BuildBootDir\" -Recurse -Force
        Copy-Item (Join-Path $IsoRoot "efi") "$BuildBootDir\" -Recurse -Force

        $BootWimDestDir = Join-Path $BuildBootDir "sources"
        if (-not (Test-Path $BootWimDestDir)) {
            New-Item -ItemType Directory -Path $BootWimDestDir -Force | Out-Null
        }

        Write-Host "    Copiando boot.wim oficial..." -ForegroundColor Gray
        $BootWimDest = Join-Path $BootWimDestDir "boot.wim"
        Copy-Item (Join-Path $IsoRoot "sources\boot.wim") $BootWimDest -Force

        # Injetar winpeshl.ini se estiver rodando com privilégios administrativos
        if (Test-IsAdmin) {
            Write-Host "    Privilégios de Administrador detectados: configurando inicialização automática no boot.wim..." -ForegroundColor Cyan
            $MountDir = Join-Path $env:TEMP "OmniDeploy_BootWim_Mount"
            if (Test-Path $MountDir) { Remove-Item -Path $MountDir -Recurse -Force -ErrorAction SilentlyContinue }
            New-Item -ItemType Directory -Path $MountDir -Force | Out-Null

            try {
                dism.exe /Mount-Wim /WimFile:$BootWimDest /Index:2 /MountDir:$MountDir
                
                $WinpeshlContent = @"
[LaunchApps]
"wpeinit.exe"
"cmd.exe", "/c %SYSTEMDRIVE%\Windows\System32\startnet_omnideploy.cmd"
"@
                Set-Content -Path (Join-Path $MountDir "Windows\System32\winpeshl.ini") -Value $WinpeshlContent -Encoding ASCII

                $StartnetOmni = @"
@echo off
title OmniDeploy v1.0
echo [OmniDeploy] Inicializando ambiente WinPE...
echo [OmniDeploy] Localizando particao de dados OMNI_DADOS...
for %%d in (C D E F G H I J K L M N O P Q R S T U V W Y Z) do (
    if exist "%%d:\05_App_Sistema\OmniDeploy.exe" (
        echo [OmniDeploy] Unidade OMNI_DADOS detectada em %%d:
        set "OMNI_DADOS=%%d:"
        start "" "%%d:\05_App_Sistema\OmniDeploy.exe"
        goto :app_started
    )
)
echo [OmniDeploy] AVISO: Particao OMNI_DADOS nao localizada automaticamente.
cmd.exe
:app_started
"@
                Set-Content -Path (Join-Path $MountDir "Windows\System32\startnet_omnideploy.cmd") -Value $StartnetOmni -Encoding ASCII

                dism.exe /Unmount-Wim /MountDir:$MountDir /Commit
                Write-Host " [+] Inicialização automática injetada com sucesso no boot.wim!" -ForegroundColor Green
            } catch {
                Write-Host " [!] Aviso ao personalizar boot.wim: $_" -ForegroundColor Yellow
                dism.exe /Unmount-Wim /MountDir:$MountDir /Discard -ErrorAction SilentlyContinue
            } finally {
                Remove-Item -Path $MountDir -Recurse -Force -ErrorAction SilentlyContinue
            }
        } else {
            Write-Host " [i] Para injetar o inicializador automático winpeshl.ini no boot.wim, execute este script como Administrador." -ForegroundColor Yellow
        }

    } finally {
        Dismount-DiskImage -ImagePath $IsoPath -ErrorAction SilentlyContinue | Out-Null
    }
}

Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Green
Write-Host " [+] Base WinPE em '$BuildBootDir' pronta para uso!" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Green
Write-Host ""
