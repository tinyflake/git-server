// 诊断脚本 - 检查数据迁移功能是否正确配置

console.log("🔍 开始诊断数据迁移功能...\n")

let hasError = false

// 1. 检查依赖包
console.log("📦 检查依赖包...")
try {
	require("archiver")
	console.log("  ✅ archiver 已安装")
} catch (e) {
	console.log("  ❌ archiver 未安装")
	hasError = true
}

try {
	require("multer")
	console.log("  ✅ multer 已安装")
} catch (e) {
	console.log("  ❌ multer 未安装")
	hasError = true
}

try {
	require("unzipper")
	console.log("  ✅ unzipper 已安装")
} catch (e) {
	console.log("  ❌ unzipper 未安装")
	hasError = true
}

// 2. 检查路由文件
console.log("\n📄 检查路由文件...")
try {
	const dataMigrationRoutes = require("./routes/data-migration-routes")
	console.log("  ✅ data-migration-routes.js 加载成功")

	if (dataMigrationRoutes.stack) {
		console.log(`  ✅ 找到 ${dataMigrationRoutes.stack.length} 个路由`)
	}
} catch (e) {
	console.log("  ❌ data-migration-routes.js 加载失败:", e.message)
	hasError = true
}

// 3. 检查 app.js 配置
console.log("\n⚙️  检查 app.js 配置...")
const fs = require("fs")
const appContent = fs.readFileSync("./app.js", "utf8")

if (appContent.includes('require("./routes/data-migration-routes")')) {
	console.log("  ✅ 已导入 data-migration-routes")
} else {
	console.log("  ❌ 未导入 data-migration-routes")
	hasError = true
}

if (appContent.includes('app.use("/api/migration"')) {
	console.log("  ✅ 已注册 /api/migration 路由")
} else {
	console.log("  ❌ 未注册 /api/migration 路由")
	hasError = true
}

// 4. 检查必要的目录
console.log("\n📁 检查目录结构...")
const path = require("path")

const configPath = path.join(__dirname, "config")
if (fs.existsSync(configPath)) {
	console.log("  ✅ config 目录存在")
} else {
	console.log("  ❌ config 目录不存在")
	hasError = true
}

const reposPath = path.join(__dirname, "../repos")
if (fs.existsSync(reposPath)) {
	console.log("  ✅ repos 目录存在")
} else {
	console.log("  ⚠️  repos 目录不存在（首次运行时正常）")
}

// 5. 检查配置文件
console.log("\n📋 检查配置文件...")
const usersConfigPath = path.join(configPath, "users.json")
if (fs.existsSync(usersConfigPath)) {
	console.log("  ✅ users.json 存在")
} else {
	console.log("  ❌ users.json 不存在")
	hasError = true
}

const repoConfigPath = path.join(configPath, "repo-config.json")
if (fs.existsSync(repoConfigPath)) {
	console.log("  ✅ repo-config.json 存在")
} else {
	console.log("  ❌ repo-config.json 不存在")
	hasError = true
}

// 总结
console.log("\n" + "=".repeat(50))
if (hasError) {
	console.log("❌ 诊断发现问题，请根据上述提示修复")
	console.log("\n💡 常见解决方案：")
	console.log("  1. 安装依赖：cd backend && npm install")
	console.log("  2. 重启后端服务器")
	console.log("  3. 检查 app.js 中的路由注册")
	process.exit(1)
} else {
	console.log("✅ 所有检查通过！")
	console.log("\n💡 如果仍然遇到 404 错误：")
	console.log("  1. 确保后端服务器已重启")
	console.log("  2. 检查前端连接的后端地址")
	console.log("  3. 清除浏览器缓存")
	process.exit(0)
}
