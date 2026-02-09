const JavaScriptObfuscator = require("javascript-obfuscator")
const fs = require("fs-extra")
const path = require("path")
const { execSync } = require("child_process")

console.log("========================================")
console.log("  Building Release Package")
console.log("========================================\n")

const RELEASE_DIR = "release"
const BACKEND_DIR = "backend"
const FRONTEND_DIR = "frontend"

// 混淆配置
const obfuscationOptions = {
	compact: true,
	controlFlowFlattening: true,
	controlFlowFlatteningThreshold: 0.75,
	deadCodeInjection: true,
	deadCodeInjectionThreshold: 0.4,
	debugProtection: false,
	debugProtectionInterval: 0,
	disableConsoleOutput: false,
	identifierNamesGenerator: "hexadecimal",
	log: false,
	numbersToExpressions: true,
	renameGlobals: false,
	selfDefending: true,
	simplify: true,
	splitStrings: true,
	splitStringsChunkLength: 10,
	stringArray: true,
	stringArrayCallsTransform: true,
	stringArrayEncoding: ["base64"],
	stringArrayIndexShift: true,
	stringArrayRotate: true,
	stringArrayShuffle: true,
	stringArrayWrappersCount: 2,
	stringArrayWrappersChainedCalls: true,
	stringArrayWrappersParametersMaxCount: 4,
	stringArrayWrappersType: "function",
	stringArrayThreshold: 0.75,
	transformObjectKeys: true,
	unicodeEscapeSequence: false,
}

// 清理并创建release目录
function setupReleaseDir() {
	console.log("[1/6] Setting up release directory...")
	if (fs.existsSync(RELEASE_DIR)) {
		fs.removeSync(RELEASE_DIR)
	}
	fs.mkdirSync(RELEASE_DIR)
	fs.mkdirSync(path.join(RELEASE_DIR, "backend"))
	console.log("✓ Release directory created\n")
}

// 构建前端
function buildFrontend() {
	console.log("[2/6] Building frontend...")
	try {
		process.chdir(FRONTEND_DIR)
		console.log("  Installing frontend dependencies...")
		execSync("npm install", { stdio: "inherit" })
		console.log("  Building frontend project...")
		execSync("npm run build", { stdio: "inherit" })
		process.chdir("..")
		console.log("✓ Frontend built successfully\n")
	} catch (error) {
		console.error("✗ Frontend build failed:", error.message)
		process.exit(1)
	}
}

// 复制前端构建文件
function copyFrontend() {
	console.log("[3/6] Copying frontend files...")
	const frontendDist = path.join(FRONTEND_DIR, "dist")
	const targetDist = path.join(RELEASE_DIR, "backend", "dist")

	if (!fs.existsSync(frontendDist)) {
		console.error("✗ Frontend dist directory not found!")
		process.exit(1)
	}

	fs.copySync(frontendDist, targetDist)

	// 复制 config.json 到前端 dist 目录（运行时加载）
	const rootConfigPath = "config.json"
	if (fs.existsSync(rootConfigPath)) {
		console.log("  Copying config.json to frontend dist...")
		fs.copySync(rootConfigPath, path.join(targetDist, "config.json"))
	}

	console.log("✓ Frontend files copied\n")
}

// 混淆后端代码
function obfuscateBackend() {
	console.log("[4/6] Obfuscating backend code...")

	const backendRelease = path.join(RELEASE_DIR, "backend")

	// 需要混淆的目录
	const dirsToObfuscate = ["routes", "utils"]

	// 混淆主文件
	console.log("  Obfuscating app.js...")
	const appJsPath = path.join(BACKEND_DIR, "app.js")
	let appJsContent = fs.readFileSync(appJsPath, "utf8")

	// 修改静态文件路径：从 ../frontend/dist 改为 ./dist
	appJsContent = appJsContent.replace(
		'path.join(__dirname, "../frontend/dist")',
		'path.join(__dirname, "./dist")',
	)

	const obfuscatedApp = JavaScriptObfuscator.obfuscate(
		appJsContent,
		obfuscationOptions,
	)
	fs.writeFileSync(
		path.join(backendRelease, "app.js"),
		obfuscatedApp.getObfuscatedCode(),
	)

	// 混淆各个目录
	dirsToObfuscate.forEach((dir) => {
		console.log(`  Obfuscating ${dir}/...`)
		const sourceDir = path.join(BACKEND_DIR, dir)
		const targetDir = path.join(backendRelease, dir)

		if (!fs.existsSync(sourceDir)) {
			console.log(`  Skipping ${dir} (not found)`)
			return
		}

		fs.mkdirSync(targetDir, { recursive: true })

		const files = fs.readdirSync(sourceDir)
		files.forEach((file) => {
			if (file.endsWith(".js")) {
				const sourceFile = path.join(sourceDir, file)
				const targetFile = path.join(targetDir, file)
				const content = fs.readFileSync(sourceFile, "utf8")
				const obfuscated = JavaScriptObfuscator.obfuscate(
					content,
					obfuscationOptions,
				)
				fs.writeFileSync(targetFile, obfuscated.getObfuscatedCode())
			}
		})
	})

	console.log("✓ Backend code obfuscated\n")
}

// 复制配置文件和其他必要文件
function copyConfigFiles() {
	console.log("[5/6] Copying configuration files...")

	const backendRelease = path.join(RELEASE_DIR, "backend")

	// 创建 config 目录
	fs.mkdirSync(path.join(backendRelease, "config"), { recursive: true })

	// 创建干净的 users.json（只包含 admin 账号，包含 NPM 权限）
	console.log("  Creating clean users.json...")
	const cleanUsers = {
		users: [
			{
				id: "admin",
				username: "admin",
				password:
					"$2a$10$MEnfXL45l/UC2j3OWuT/mODv8p/tOIjp5TQG/1L/3ddWHLLcOE7hW", // 123456
				email: "admin@example.com",
				role: "super_admin",
				createdAt: new Date().toISOString(),
				lastLogin: null,
				npmPermissions: {
					canLogin: true,
					canPublish: true,
					canManage: true,
					allowedPackages: ["*"],
				},
			},
		],
	}
	fs.writeJsonSync(
		path.join(backendRelease, "config", "users.json"),
		cleanUsers,
		{ spaces: 2 },
	)

	// 创建空的 repo-config.json
	console.log("  Creating clean repo-config.json...")
	const cleanRepoConfig = {
		repos: {},
	}
	fs.writeJsonSync(
		path.join(backendRelease, "config", "repo-config.json"),
		cleanRepoConfig,
		{ spaces: 2 },
	)

	// 复制 .env 文件（如果存在）
	const envPath = path.join(BACKEND_DIR, "config", ".env")
	if (fs.existsSync(envPath)) {
		fs.copySync(envPath, path.join(backendRelease, "config", ".env"))
	}

	// 复制 Verdaccio 配置文件
	console.log("  Copying Verdaccio configuration files...")
	const verdaccioConfigPath = path.join(BACKEND_DIR, "verdaccio-config.yaml")
	if (fs.existsSync(verdaccioConfigPath)) {
		fs.copySync(
			verdaccioConfigPath,
			path.join(backendRelease, "verdaccio-config.yaml"),
		)
	}

	// 创建空的 verdaccio-htpasswd 文件
	console.log("  Creating empty verdaccio-htpasswd...")
	fs.writeFileSync(path.join(backendRelease, "verdaccio-htpasswd"), "")

	// 创建空的 verdaccio-storage 目录
	console.log("  Creating empty verdaccio-storage directory...")
	fs.mkdirSync(path.join(backendRelease, "verdaccio-storage"), {
		recursive: true,
	})

	// 创建空的 repos 目录
	console.log("  Creating empty repos directory...")
	fs.mkdirSync(path.join(backendRelease, "repos"), { recursive: true })

	// 创建空的 logs 目录
	console.log("  Creating empty logs directory...")
	fs.mkdirSync(path.join(backendRelease, "logs"), { recursive: true })

	// 创建空的 temp 目录（用于数据迁移）
	console.log("  Creating empty temp directory...")
	fs.mkdirSync(path.join(backendRelease, "temp"), { recursive: true })

	// 创建空的 backup 目录（用于数据迁移）
	console.log("  Creating empty backup directory...")
	fs.mkdirSync(path.join(backendRelease, "backup"), { recursive: true })

	// 复制 nodemon.json（如果存在）
	const nodemonPath = path.join(BACKEND_DIR, "nodemon.json")
	if (fs.existsSync(nodemonPath)) {
		console.log("  Copying nodemon.json...")
		fs.copySync(nodemonPath, path.join(backendRelease, "nodemon.json"))
	}

	// 复制package.json（只包含dependencies）
	const packageJson = fs.readJsonSync(path.join(BACKEND_DIR, "package.json"))
	const releasePackageJson = {
		name: packageJson.name,
		version: packageJson.version,
		description: packageJson.description,
		main: packageJson.main,
		scripts: {
			start: "node app.js",
		},
		dependencies: packageJson.dependencies,
	}
	fs.writeJsonSync(
		path.join(backendRelease, "package.json"),
		releasePackageJson,
		{ spaces: 2 },
	)

	// 复制根目录的config文件
	if (fs.existsSync("config.json")) {
		fs.copySync("config.json", path.join(RELEASE_DIR, "config.json"))
	}
	if (fs.existsSync("config.example.json")) {
		fs.copySync(
			"config.example.json",
			path.join(RELEASE_DIR, "config.example.json"),
		)
	}

	// 复制 PM2 配置文件
	if (fs.existsSync("ecosystem.config.js")) {
		console.log("  Copying PM2 configuration...")
		fs.copySync(
			"ecosystem.config.js",
			path.join(RELEASE_DIR, "ecosystem.config.js"),
		)
	}

	// 复制 Docker Compose 配置文件
	if (fs.existsSync("docker-compose.yml")) {
		console.log("  Copying docker-compose.yml...")
		fs.copySync(
			"docker-compose.yml",
			path.join(RELEASE_DIR, "docker-compose.yml"),
		)
	}

	// 复制 Nginx 配置文件
	if (fs.existsSync("nginx.conf")) {
		console.log("  Copying nginx.conf...")
		fs.copySync("nginx.conf", path.join(RELEASE_DIR, "nginx.conf"))
	}

	// 复制部署文档
	if (fs.existsSync("DEPLOYMENT-SERVER.md")) {
		console.log("  Copying deployment guide...")
		fs.copySync(
			"DEPLOYMENT-SERVER.md",
			path.join(RELEASE_DIR, "DEPLOYMENT-SERVER.md"),
		)
	}

	console.log("✓ Configuration files copied\n")
}

// 创建启动脚本和说明文档
function createStartupFiles() {
	console.log("[6/6] Creating startup files...")

	// ========== Windows 启动脚本 ==========

	// 创建启动脚本（同时启动 Verdaccio 和主服务）
	const startScript = `@echo off
title Git Server with NPM Registry
echo ========================================
echo   Starting Git Server with NPM Registry
echo ========================================
echo.

cd backend

echo [1/2] Starting Verdaccio NPM Server...
start "Verdaccio NPM Server" cmd /k "npx verdaccio --config verdaccio-config.yaml"

echo Waiting for Verdaccio to start...
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting Git Server...
node app.js`

	fs.writeFileSync(path.join(RELEASE_DIR, "start.bat"), startScript)

	// 创建单独启动 Verdaccio 的脚本
	const startVerdaccioScript = `@echo off
title Verdaccio NPM Server
echo Starting Verdaccio NPM Server...
echo.

cd backend
npx verdaccio --config verdaccio-config.yaml`

	fs.writeFileSync(
		path.join(RELEASE_DIR, "start-verdaccio.bat"),
		startVerdaccioScript,
	)

	// 创建单独启动主服务的脚本
	const startMainScript = `@echo off
title Git Server
echo Starting Git Server...
echo.
echo Note: Make sure Verdaccio is running first!
echo.

cd backend
node app.js`

	fs.writeFileSync(path.join(RELEASE_DIR, "start-main.bat"), startMainScript)

	// ========== Linux 启动脚本 ==========

	// Linux 版本：一键启动所有服务
	const startShScript = `#!/bin/bash
echo "========================================"
echo "  Starting Git Server with NPM Registry"
echo "========================================"
echo ""

cd backend

echo "[1/2] Starting Verdaccio NPM Server..."
nohup npx verdaccio --config verdaccio-config.yaml > ../logs/verdaccio.log 2>&1 &
VERDACCIO_PID=$!
echo "Verdaccio started with PID: $VERDACCIO_PID"

echo "Waiting for Verdaccio to start..."
sleep 3

echo ""
echo "[2/2] Starting Git Server..."
node app.js`

	fs.writeFileSync(path.join(RELEASE_DIR, "start.sh"), startShScript)
	fs.chmodSync(path.join(RELEASE_DIR, "start.sh"), "755")

	// Linux 版本：单独启动 Verdaccio
	const startVerdaccioShScript = `#!/bin/bash
echo "Starting Verdaccio NPM Server..."
echo ""

cd backend
npx verdaccio --config verdaccio-config.yaml`

	fs.writeFileSync(
		path.join(RELEASE_DIR, "start-verdaccio.sh"),
		startVerdaccioShScript,
	)
	fs.chmodSync(path.join(RELEASE_DIR, "start-verdaccio.sh"), "755")

	// Linux 版本：单独启动主服务
	const startMainShScript = `#!/bin/bash
echo "Starting Git Server..."
echo ""
echo "Note: Make sure Verdaccio is running first!"
echo ""

cd backend
node app.js`

	fs.writeFileSync(path.join(RELEASE_DIR, "start-main.sh"), startMainShScript)
	fs.chmodSync(path.join(RELEASE_DIR, "start-main.sh"), "755")

	console.log("  ✓ Windows scripts created (.bat)")
	console.log("  ✓ Linux scripts created (.sh)")

	// 创建README
	const readme = `# Git Server - Release Package

## 版本信息

版本：v2.2.0
发布日期：2026-02-06

## 新功能

### NPM 私有仓库（集成 Verdaccio）
- ✨ 完整的 NPM 包管理功能
- ✨ 支持发布、下载、删除私有包
- ✨ 细粒度的 NPM 权限控制
- ✨ 与 Git 仓库统一的用户管理
- ✨ 包详情查看、版本历史、依赖分析

### 数据迁移（超级管理员专属）
- ✨ 一键导出所有数据（用户、仓库、代码、NPM 包）
- ✨ 一键导入备份数据
- ✨ 实时进度显示
- ✨ 自动备份和回滚
- ✨ 支持版本升级时的数据迁移

## 安装依赖

首次使用前，需要安装依赖：

\`\`\`bash
cd backend
npm install
cd ..
\`\`\`

## 配置

编辑 \`config.json\` 文件来配置服务器：

\`\`\`json
{
  "server": {
    "host": "localhost",
    "port": 9001
  },
  "git": {
    "defaultRepoPath": "./repos"
  }
}
\`\`\`

## 启动服务

### Windows 服务器

#### 方式一：一键启动（推荐）

双击 \`start.bat\` 会自动启动：
1. Verdaccio NPM 服务器（端口 4873）
2. Git 主服务（端口 9001）

两个服务会在独立的窗口中运行。

#### 方式二：分别启动

如果需要分别控制两个服务：

1. 启动 Verdaccio：双击 \`start-verdaccio.bat\`
2. 启动主服务：双击 \`start-main.bat\`

### Linux 服务器

#### 方式一：直接运行脚本

\`\`\`bash
# 一键启动所有服务
./start.sh

# 或分别启动
./start-verdaccio.sh  # 终端 1
./start-main.sh       # 终端 2
\`\`\`

#### 方式二：使用 PM2（推荐生产环境）

\`\`\`bash
# 安装 PM2
npm install -g pm2

# 启动所有服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 设置开机自启
pm2 save
pm2 startup
\`\`\`

#### 方式三：使用 Docker Compose

\`\`\`bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
\`\`\`

### 开发环境

如果需要自动重启功能：

\`\`\`bash
cd backend
npm install -g nodemon
nodemon app.js
\`\`\`

注意：nodemon.json 已配置忽略 temp、backup、logs、verdaccio-storage 等目录，避免数据变化时自动重启。

## 访问

- Web 界面：http://localhost:9001
- NPM 仓库：http://localhost:9001/api/npm
- Verdaccio Web UI：http://localhost:4873

如果使用 Nginx 反向代理：
- Web 界面：https://git.tinyflake.top
- 后端 API：https://git.tinyflake.top/api/
- Verdaccio：https://git.tinyflake.top/verdaccio/

默认管理员账号：admin / 123456

**⚠️ 重要：首次登录后请立即修改密码！**

## Nginx 反向代理配置

项目已包含 \`nginx.conf\` 配置文件，可直接使用：

### 宝塔面板配置

1. 在宝塔面板创建网站（域名：git.tinyflake.top）
2. 申请 SSL 证书
3. 将 \`nginx.conf\` 内容复制到网站配置中
4. 重启 Nginx

### 手动配置

\`\`\`bash
# 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/git-server

# 创建软链接
sudo ln -s /etc/nginx/sites-available/git-server /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
\`\`\`

**注意**：需要先申请 SSL 证书并修改 \`nginx.conf\` 中的证书路径。

## Docker 部署

项目已包含 \`docker-compose.yml\` 配置文件：

\`\`\`bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f git-service

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
\`\`\`

**注意**：Docker 部署使用 \`host\` 网络模式，直接使用宿主机的端口。

## NPM 私有仓库使用

### 配置 NPM 客户端

\`\`\`bash
# 设置私有仓库地址
npm config set registry http://localhost:9001/api/npm

# 登录（使用 Git Server 的账号密码）
npm login

# 发布包
npm publish

# 安装包
npm install your-package
\`\`\`

### NPM 权限管理

管理员可以在"权限管理"页面为用户配置 NPM 权限：
- **登录权限**：是否可以访问 NPM 仓库
- **发布权限**：是否可以发布包
- **管理权限**：是否可以删除包
- **包权限**：可以访问哪些包（支持通配符 *）

### 包管理

在"包管理"页面可以：
- 查看所有已发布的包
- 查看包详情、版本历史、依赖关系
- 删除不需要的包（需要管理权限）

## 数据迁移使用

### 导出数据

1. 使用超级管理员账户登录
2. 点击用户菜单 → "数据迁移"
3. 点击"导出所有数据"
4. 等待导出完成并下载 ZIP 文件（包含 Git 仓库和 NPM 包）

### 导入数据

1. 使用超级管理员账户登录
2. 点击用户菜单 → "数据迁移"
3. 上传之前导出的 ZIP 文件
4. 点击"开始导入"并确认
5. 等待导入完成
6. 使用备份中的账户密码重新登录

**⚠️ 警告：导入会覆盖所有现有数据，请谨慎操作！**

## 目录结构

\`\`\`
release/
├── backend/
│   ├── app.js                  # 主程序（已混淆）
│   ├── routes/                 # 路由（已混淆）
│   ├── utils/                  # 工具函数（已混淆）
│   ├── config/                 # 配置文件
│   │   ├── users.json          # 用户数据
│   │   └── repo-config.json    # 仓库配置
│   ├── dist/                   # 前端静态文件
│   ├── repos/                  # Git 仓库存储目录
│   ├── verdaccio-storage/      # NPM 包存储目录
│   ├── verdaccio-config.yaml   # Verdaccio 配置
│   ├── verdaccio-htpasswd      # Verdaccio 用户文件
│   ├── logs/                   # 日志目录
│   ├── temp/                   # 临时文件目录（数据迁移用）
│   ├── backup/                 # 备份目录（数据迁移用）
│   ├── nodemon.json            # Nodemon 配置
│   └── package.json            # 依赖配置
├── config.json                 # 服务器配置
├── start.bat                   # Windows 一键启动脚本
├── start-verdaccio.bat         # Windows Verdaccio 启动脚本
├── start-main.bat              # Windows 主服务启动脚本
├── start.sh                    # Linux 一键启动脚本
├── start-verdaccio.sh          # Linux Verdaccio 启动脚本
├── start-main.sh               # Linux 主服务启动脚本
├── docker-compose.yml          # Docker Compose 配置
├── nginx.conf                  # Nginx 反向代理配置
├── ecosystem.config.js         # PM2 配置
└── README.md                   # 部署说明
\`\`\`

## 注意事项

- 需要安装 Node.js v16+ (https://nodejs.org/)
- 需要安装 Git (https://git-scm.com/)
- 首次启动前请先安装依赖
- 修改配置后需要重启服务
- 定期导出数据作为备份
- temp 和 backup 目录会自动清理旧文件
- verdaccio-storage 目录存储所有 NPM 包数据

## 故障排除

### 端口被占用

修改 \`config.json\` 中的端口号，或关闭占用端口的程序。

如果 Verdaccio 端口（4873）被占用，需要修改 \`backend/verdaccio-config.yaml\` 中的端口配置。

### Verdaccio 未启动

如果前端显示"NPM 服务未运行"：

1. 检查 Verdaccio 窗口是否正常运行
2. 访问 http://localhost:4873 确认 Verdaccio 是否可访问
3. 如果使用 \`start.bat\`，确保两个窗口都在运行
4. 手动启动：\`cd backend && npx verdaccio --config verdaccio-config.yaml\`

### NPM 登录失败

1. 确保 Verdaccio 服务正在运行
2. 确保使用的是 Git Server 的账号密码
3. 确保账号有 NPM 登录权限
4. 检查 NPM registry 配置是否正确

### 数据迁移失败

1. 检查磁盘空间是否足够
2. 检查备份文件是否完整
3. 查看 backend/logs 目录中的日志文件
4. 如果使用 nodemon，确保 nodemon.json 配置正确

### 无法访问

1. 检查防火墙设置
2. 确保端口已开放（9001 和 4873）
3. 检查 config.json 配置是否正确
4. 确保两个服务都在运行

## 服务管理

### 停止服务

- 关闭 Verdaccio 窗口
- 关闭 Git Server 窗口
- 或在各自窗口中按 Ctrl+C

### 重启服务

1. 停止所有服务
2. 重新运行 \`start.bat\`

### 查看日志

- Verdaccio 日志：在 Verdaccio 窗口中查看
- Git Server 日志：在 Git Server 窗口中查看
- 操作日志：\`backend/logs/\` 目录

## 技术支持

如有问题，请查看：
- 完整文档：README.md
- NPM 集成指南：NPM-INTEGRATION-GUIDE.md
- 数据迁移指南：docs/DATA-MIGRATION-GUIDE.md
- 更新日志：CHANGELOG.md
`

	fs.writeFileSync(path.join(RELEASE_DIR, "README.md"), readme)

	console.log("✓ Startup files created\n")
}

// 主函数
async function main() {
	try {
		setupReleaseDir()
		buildFrontend()
		copyFrontend()
		obfuscateBackend()
		copyConfigFiles()
		createStartupFiles()

		console.log("========================================")
		console.log("  Build Completed Successfully!")
		console.log("========================================")
		console.log("\nRelease package created in: ./release/")
		console.log("\n📦 启动脚本说明：")
		console.log("  Windows:")
		console.log("    - start.bat: 一键启动所有服务（推荐）")
		console.log("    - start-verdaccio.bat: 单独启动 Verdaccio")
		console.log("    - start-main.bat: 单独启动主服务")
		console.log("  Linux:")
		console.log("    - start.sh: 一键启动所有服务")
		console.log("    - start-verdaccio.sh: 单独启动 Verdaccio")
		console.log("    - start-main.sh: 单独启动主服务")
		console.log("\n🐳 部署配置文件：")
		console.log("  - docker-compose.yml: Docker Compose 配置")
		console.log("  - nginx.conf: Nginx 反向代理配置")
		console.log("  - ecosystem.config.js: PM2 进程管理配置")
		console.log("\nNext steps:")
		console.log("1. cd release/backend")
		console.log("2. npm install")
		console.log("3. cd ..")
		console.log("4. Windows: 双击 start.bat")
		console.log("   Linux: ./start.sh 或 pm2 start ecosystem.config.js")
		console.log(
			"\n⚠️  注意：需要同时运行 Verdaccio 和主服务才能使用 NPM 功能\n",
		)
	} catch (error) {
		console.error("\n✗ Build failed:", error.message)
		process.exit(1)
	}
}

main()
