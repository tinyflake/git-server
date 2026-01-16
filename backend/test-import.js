// 测试导入功能的各个组件

const fs = require("fs-extra")
const path = require("path")

console.log("🔍 测试导入功能组件...\n")

// 1. 测试 multer
console.log("📦 测试 multer...")
try {
	const multer = require("multer")
	console.log("  ✅ multer 加载成功")

	// 测试创建上传目录
	const uploadDir = path.join(__dirname, "temp/uploads")
	fs.ensureDirSync(uploadDir)
	console.log("  ✅ 上传目录创建成功:", uploadDir)
} catch (e) {
	console.log("  ❌ multer 测试失败:", e.message)
}

// 2. 测试 unzipper
console.log("\n📦 测试 unzipper...")
try {
	const unzipper = require("unzipper")
	console.log("  ✅ unzipper 加载成功")
} catch (e) {
	console.log("  ❌ unzipper 测试失败:", e.message)
}

// 3. 测试 archiver
console.log("\n📦 测试 archiver...")
try {
	const archiver = require("archiver")
	console.log("  ✅ archiver 加载成功")
} catch (e) {
	console.log("  ❌ archiver 测试失败:", e.message)
}

// 4. 测试目录权限
console.log("\n📁 测试目录权限...")
try {
	const testDir = path.join(__dirname, "temp/test")
	fs.ensureDirSync(testDir)

	// 测试写入
	const testFile = path.join(testDir, "test.txt")
	fs.writeFileSync(testFile, "test")
	console.log("  ✅ 目录写入权限正常")

	// 清理
	fs.removeSync(testDir)
	console.log("  ✅ 目录删除权限正常")
} catch (e) {
	console.log("  ❌ 目录权限测试失败:", e.message)
}

// 5. 测试配置文件路径
console.log("\n📋 测试配置文件...")
const configPath = path.join(__dirname, "config")
const usersPath = path.join(configPath, "users.json")
const repoPath = path.join(configPath, "repo-config.json")

if (fs.existsSync(usersPath)) {
	console.log("  ✅ users.json 存在")
	try {
		const users = fs.readJsonSync(usersPath)
		console.log(`     用户数: ${users.users?.length || 0}`)
	} catch (e) {
		console.log("  ⚠️  users.json 读取失败:", e.message)
	}
} else {
	console.log("  ❌ users.json 不存在")
}

if (fs.existsSync(repoPath)) {
	console.log("  ✅ repo-config.json 存在")
	try {
		const repos = fs.readJsonSync(repoPath)
		console.log(`     仓库数: ${repos.repoList?.length || 0}`)
	} catch (e) {
		console.log("  ⚠️  repo-config.json 读取失败:", e.message)
	}
} else {
	console.log("  ❌ repo-config.json 不存在")
}

// 6. 测试仓库目录
console.log("\n📁 测试仓库目录...")
const reposPath = path.join(__dirname, "../repos")
if (fs.existsSync(reposPath)) {
	console.log("  ✅ repos 目录存在")
	const repos = fs.readdirSync(reposPath)
	console.log(`     仓库数: ${repos.length}`)
} else {
	console.log("  ⚠️  repos 目录不存在（首次运行时正常）")
}

console.log("\n✅ 测试完成")
