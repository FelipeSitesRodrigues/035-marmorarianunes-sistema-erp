@echo off
rem Abre o sistema da Marmoraria Nunes no navegador (http://localhost:3035).
rem Sobe o banco local (porta 5435, janela minimizada) e o sistema (porta 3035, nesta janela).
rem Login da demonstracao: val@nunes.local / nunes-demo-2026
if "%~1"==":abrir" goto abrir_navegador
cd /d "%~dp0"

if not exist node_modules (
  echo Instalando as dependencias, so na primeira vez...
  call npm install
)

netstat -ano | findstr /c:":5435 " | findstr LISTENING >nul
if errorlevel 1 (
  echo Subindo o banco local...
  if exist .db-local.log del .db-local.log
  start "Nunes - banco local" /min cmd /c "npm run db -- --demo > .db-local.log 2>&1"
  call :esperar_banco || goto banco_falhou
)

netstat -ano | findstr /c:":3035 " | findstr LISTENING >nul
if not errorlevel 1 (
  echo O sistema ja estava no ar. Abrindo o navegador...
  start "" http://localhost:3035
  exit /b
)

echo.
echo Sistema da Marmoraria Nunes: http://localhost:3035
echo Login: val@nunes.local   Senha: nunes-demo-2026
echo Para desligar, feche esta janela e a "Nunes - banco local" na barra de tarefas.
echo.
start "" /b cmd /c call "%~f0" :abrir
npm run dev
exit /b

:esperar_banco
for /l %%i in (1,1,90) do (
  findstr /c:"no ar" .db-local.log >nul 2>&1 && exit /b 0
  ping -n 2 127.0.0.1 >nul
)
exit /b 1

:banco_falhou
echo.
echo O banco local nao subiu. O que ele disse:
type .db-local.log
pause
exit /b 1

:abrir_navegador
rem Espera o Next abrir a porta antes de chamar o navegador.
for /l %%i in (1,1,60) do (
  netstat -ano | findstr /c:":3035 " | findstr LISTENING >nul && goto navegador
  ping -n 2 127.0.0.1 >nul
)
:navegador
start "" http://localhost:3035
exit /b
