@echo off
REM C-COS - Upload deployment scripts to VPS
REM Windows batch script

echo ====================================
echo Upload Deployment Scripts to VPS
echo ====================================
echo.

REM Get VPS IP from user
set /p VPS_IP="Enter your VPS IP address: "
set /p VPS_USER="Enter SSH username (default: root): "

REM Default to root if empty
if "%VPS_USER%"=="" set VPS_USER=root

echo.
echo Uploading scripts to %VPS_USER%@%VPS_IP%...
echo.

REM Check if we're in the right directory
if not exist "deploy-scripts" (
    echo Error: deploy-scripts folder not found!
    echo Please run this from the project root directory.
    pause
    exit /b 1
)

REM Upload scripts using scp
scp -r deploy-scripts %VPS_USER%@%VPS_IP%:~/

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================
    echo Upload Successful!
    echo ====================================
    echo.
    echo Scripts uploaded to: /root/deploy-scripts or /home/%VPS_USER%/deploy-scripts
    echo.
    echo Next steps:
    echo 1. Connect to VPS: ssh %VPS_USER%@%VPS_IP%
    echo 2. Run setup: cd deploy-scripts ^&^& chmod +x vps-setup.sh ^&^& ./vps-setup.sh
    echo.
) else (
    echo.
    echo ====================================
    echo Upload Failed!
    echo ====================================
    echo.
    echo Please check:
    echo - VPS IP address is correct
    echo - SSH is accessible
    echo - You have SSH key configured or can enter password
    echo.
    echo You can also manually upload using FileZilla or WinSCP
    echo.
)

pause
