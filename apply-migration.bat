@echo off
echo ========================================
echo Applying Section Distribution Migration
echo ========================================
echo.
echo This will add two new columns to the exams table:
echo   - enable_section_distribution
echo   - section_distribution
echo.
echo Please enter your PostgreSQL password when prompted.
echo.
pause
psql -U postgres -d uiges_db -f backend\database\migrations\RUN_THIS_MIGRATION.sql
echo.
echo ========================================
if %errorlevel% == 0 (
    echo SUCCESS! Migration applied successfully.
    echo.
    echo Next step: Your backend server will automatically reload.
    echo If it doesn't, restart it manually.
) else (
    echo FAILED! Please check the error message above.
    echo.
    echo Common issues:
    echo   1. Wrong password
    echo   2. Database name is different (not uiges_db)
    echo   3. PostgreSQL service not running
)
echo ========================================
pause

