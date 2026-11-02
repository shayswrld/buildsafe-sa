@echo off
set "PATH=%~dp0bin\node-v22.14.0-win-x64;%PATH%"
echo Starting BuildSafe SA local server on http://localhost:3000 ...
npm.cmd run dev
