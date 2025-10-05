@echo off
REM pnpm-only repository guard
REM Place this as npm.cmd in a directory earlier in PATH than the real npm

echo.
echo ⛔ This project is pnpm-only.
echo.
echo Please use pnpm instead:
echo   pnpm install
echo   pnpm add ^<package^>
echo   pnpm run ^<script^>
echo.
echo For more info: https://pnpm.io/
echo.
exit /b 1
