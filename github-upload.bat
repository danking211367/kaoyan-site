@echo off
chcp 65001 >nul
echo 🎓 考研通 - GitHub 推送工具
echo ════════════════════════════
echo.
echo 当前电脑无法直连 GitHub，为你提供三种方案：
echo.
echo ========================================
echo 方案一：用 GitHub 网页上传（推荐）
echo ========================================
echo.
echo 1. 打开浏览器访问：
echo    https://github.com/danking211367/kaoyan-site
echo.
echo 2. 点击 "Add file" ^> "Upload files"
echo.
echo 3. 把以下文件拖进去上传（不要传 node_modules 文件夹）:
echo.
echo    .github\workflows\update-data.yml
echo    .gitignore
echo    README.md
echo    vercel.json
echo    package.json
echo    package-lock.json
echo    server.js
echo    start.bat
echo    public\index.html
echo    scripts\update-data.js
echo    scripts\update-data-v2.js
echo    data\adjust.json
echo    data\daily-tip.json
echo    data\hot-articles.json
echo    data\last-update.json
echo    data\links.json
echo    data\scores.json
echo    data\timeline.json
echo    data\tips.json
echo.
echo 4. 填写 Commit message，点击 Commit changes
echo.
echo.
echo ========================================
echo 方案二：用代理推送到 GitHub
echo ========================================
echo.
echo 如果你在用 Clash/V2Ray 等代理工具，运行：
echo.
echo    git config --global http.proxy http://127.0.0.1:7890
echo    git config --global https.proxy http://127.0.0.1:7890
echo    git push -u origin main
echo    git config --global --unset http.proxy
echo    git config --global --unset https.proxy
echo.
echo （端口号改成你的代理端口，如 10809、1080 等）
echo.
echo.
echo ========================================
echo 方案三：改用 Gitee（国内版 GitHub）
echo ========================================
echo.
echo 如果 GitHub 实在连不上，可以用码云:
echo https://gitee.com
echo 创建仓库后运行：
echo    git remote remove origin
echo    git remote add origin https://gitee.com/你的用户名/kaoyan-site.git
echo    git push -u origin main
echo.
pause
