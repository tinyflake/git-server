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
		'path.join(__dirname, "./dist")'
	)

	const obfuscatedApp = JavaScriptObfuscator.obfuscate(
		appJsContent,
		obfuscationOptions
	)
	fs.writeFileSync(
		path.join(backendRelease, "app.js"),
		obfuscatedApp.getObfuscatedCode()
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
					obfuscationOptions
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

	// 创建干净的 users.json（只包含 admin 账号）
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
			},
		],
	}
	fs.writeJsonSync(
		path.join(backendRelease, "config", "users.json"),
		cleanUsers,
		{ spaces: 2 }
	)

	// 创建空的 repo-config.json
	console.log("  Creating clean repo-config.json...")
	const cleanRepoConfig = {
		repos: {},
	}
	fs.writeJsonSync(
		path.join(backendRelease, "config", "repo-config.json"),
		cleanRepoConfig,
		{ spaces: 2 }
	)

	// 复制 .env 文件（如果存在）
	const envPath = path.join(BACKEND_DIR, "config", ".env")
	if (fs.existsSync(envPath)) {
		fs.copySync(envPath, path.join(backendRelease, "config", ".env"))
	}

	// 创建空的 repos 目录
	console.log("  Creating empty repos directory...")
	fs.mkdirSync(path.join(backendRelease, "repos"), { recursive: true })

	// 创建空的 logs 目录
	console.log("  Creating empty logs directory...")
	fs.mkdirSync(path.join(backendRelease, "logs"), { recursive: true })

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
		{ spaces: 2 }
	)

	// 复制根目录的config文件
	if (fs.existsSync("config.json")) {
		fs.copySync("config.json", path.join(RELEASE_DIR, "config.json"))
	}
	if (fs.existsSync("config.example.json")) {
		fs.copySync(
			"config.example.json",
			path.join(RELEASE_DIR, "config.example.json")
		)
	}

	console.log("✓ Configuration files copied\n")
}

// 创建启动脚本和说明文档
function createStartupFiles() {
	console.log("[6/6] Creating startup files...")

	// 创建启动脚本
	const startScript = `@echo off
title Git Server
echo Starting Git Server...
echo.

cd backend
node app.js`

	fs.writeFileSync(path.join(RELEASE_DIR, "start.bat"), startScript)

	// 创建README
	const readme = `# Git Server - Release Package

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

双击 \`start.bat\` 或运行：

\`\`\`bash
cd backend
node app.js
\`\`\`

## 访问

浏览器访问：http://localhost:9001

默认管理员账号：admin / 123456

## 注意事项

- 需要安装 Node.js (https://nodejs.org/)
- 首次启动前请先安装依赖
- 修改配置后需要重启服务
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
		console.log("\nNext steps:")
		console.log("1. cd release/backend")
		console.log("2. npm install")
		console.log("3. cd ..")
		console.log("4. Double-click start.bat to run\n")
	} catch (error) {
		console.error("\n✗ Build failed:", error.message)
		process.exit(1)
	}
}

main()
