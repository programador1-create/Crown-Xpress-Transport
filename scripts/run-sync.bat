@echo off
cd /d "C:\Users\Eduardo Aispuro\CascadeProjects\Crown-Xpress-Transport"
node scripts\sync-nbcw-to-neon.js >> scripts\sync.log 2>&1
echo [%DATE% %TIME%] Script ejecutado >> scripts\sync.log
