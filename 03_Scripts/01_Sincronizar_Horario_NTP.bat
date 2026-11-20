@echo off
setlocal
set "NTP_SERVER=%~1"
if "%NTP_SERVER%"=="" set "NTP_SERVER=a.ntp.br"

echo [OmniDeploy] Configurando fuso horario para "E. South America Standard Time"...
tzutil /s "E. South America Standard Time"

echo [OmniDeploy] Iniciando e configurando servico de horario do Windows (w32time)...
sc config w32time start= auto >nul 2>&1
net start w32time >nul 2>&1

echo [OmniDeploy] Apontando servidor NTP para %NTP_SERVER%...
w32tm /config /manualpeerlist:"%NTP_SERVER%,0x8 b.ntp.br,0x8 pool.ntp.org,0x8" /syncfromflags:manual /reliable:YES /update >nul 2>&1

echo [OmniDeploy] Forcando ressincronizacao de horario...
w32tm /resync /force >nul 2>&1

echo [OmniDeploy] Horario local atualizado: %DATE% %TIME%
exit /b 0
