@echo off
setlocal
title Preparar Base WinPE - OmniDeploy v1.0
cd /d "%~dp0"

:: Verifica se esta executando como Administrador
openfiles >nul 2>&1
if '%errorlevel%' NEQ '0' (
    echo [OmniDeploy] Solicitando elevacao de Administrador...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File ".\1_Gerar_Base_WinPE.ps1"
echo.
pause
