@echo off
REM Double-click (or run) to start StoreCraft locally: DB + app + admin.
cd /d "%~dp0"
node scripts\dev-up.mjs %*
pause
