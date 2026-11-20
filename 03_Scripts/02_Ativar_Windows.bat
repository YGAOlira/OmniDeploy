@echo off
setlocal
set "PRODUCT_KEY=%~1"

if "%PRODUCT_KEY%"=="" (
    echo [OmniDeploy] Erro: Nenhuma chave de ativacao informada.
    exit /b 1
)

echo [OmniDeploy] Instalando chave de produto do Windows...
cscript //nologo %WINDIR%\System32\slmgr.vbs /ipk %PRODUCT_KEY% >nul 2>&1

echo [OmniDeploy] Solicitando ativacao online silenciosa...
cscript //nologo %WINDIR%\System32\slmgr.vbs /ato >nul 2>&1

exit /b 0
