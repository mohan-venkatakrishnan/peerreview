@echo off
rem PeerReview dev server with auto-restart (this box reaps node processes).
rem Run this instead of `npm run dev`. Logs to .vite-dev.log. Port 5180.
cd /d %~dp0
:loop
echo [%date% %time%] starting vite >> .vite-dev.log
call npx vite >> .vite-dev.log 2>&1
echo [%date% %time%] vite exited (code %errorlevel%), restarting in 2s >> .vite-dev.log
timeout /t 2 /nobreak > nul
goto loop
