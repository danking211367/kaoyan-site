@echo off
chcp 65001 >nul
echo 🎓 考研通 - 手动上传工具
echo ════════════════════════════
echo.
echo 电脑无法直连 GitHub，先本地构建，再网页上传。
echo.
echo ========================================
echo 第一步：本地构建（嵌入最新数据）
echo ========================================
echo.
echo    node scripts\build-static.js
echo.
echo.
echo ========================================
echo 第二步：用 GitHub 网页上传
echo ========================================
echo.
echo 1. 打开浏览器访问：
echo    https://github.com/danking211367/kaoyan-site
echo.
echo 2. 点击 "Add file" ^> "Upload files"
echo.
echo 3. 把以下文件拖进去上传（不要传 node_modules）:
echo.
echo    .gitignore
echo    README.md
echo    vercel.json
echo    package.json
echo    package-lock.json
echo    server.js
echo    start.bat
echo    index.html
echo    public\index.html
echo    scripts\build-static.js
echo    scripts\update-data.js
echo    scripts\update-data-v2.js
echo    data\*.json
echo.
echo 4. 填写 Commit message，点击 Commit changes
echo.
echo.
echo ========================================
echo ⚠️ 注意
echo ========================================
echo.
echo 已删除 GitHub Actions 自动更新，
echo 以后每次更新数据后手动执行一次本流程即可。
echo.
pause
