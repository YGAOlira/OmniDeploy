@echo off
setlocal
title Instalador de Pendrive - OmniDeploy v1.0
cd /d "%~dp0"

:: Verifica privilegios de Administrador
openfiles >nul 2>&1
if '%errorlevel%' NEQ '0' (
    echo.
    echo ==========================================================================
    echo   OMNIDEPLOY (v1.0) - ELEVACAO NECESSARIA
    echo ==========================================================================
    echo.
    echo   Solicitando privilegios de Administrador para particionar o pendrive...
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File ".\2_Gravar_Pendrive.ps1"
if '%errorlevel%' NEQ '0' (
    echo.
    echo [OmniDeploy] O processo foi encerrado com codigo de erro %errorlevel%.
    pause
)
