@echo off
set SQLSERVER_PASSWORD=Roncen810#
set PATH=%PATH%;C:\Program Files (x86)\cloudflared
cd /d "C:\Users\Eduardo Aispuro\CascadeProjects\Crown-Xpress-Transport\sqlproxy"

:: Matar procesos previos en puerto 3099 si existen
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3099 " 2^>nul') do taskkill /PID %%a /F >nul 2>&1

timeout /t 2 /nobreak >nul

:: Iniciar proxy Node.js
start "" /B "C:\Program Files\nodejs\node.exe" server.js

timeout /t 4 /nobreak >nul

:: Iniciar tunel Cloudflare permanente
start "" /B cloudflared tunnel --config "C:\Users\Eduardo Aispuro\.cloudflared\config.yml" run
