const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")
const repoRoutes = require("./routes/repo-routes")
const gitHttpRoutes = require("./routes/git-http")
const authRoutes = require("./routes/auth-routes")
const userManagementRoutes = require("./routes/user-management-routes")
const repoManagementRoutes = require("./routes/repo-management-routes")
const operationLogRoutes = require("./routes/operation-log-routes")
const dataMigrationRoutes = require("./routes/data-migration-routes")

// 导入工具模块
const { initUsersConfig } = require("./utils/auth-utils")
const { initGitLogs } = require("./utils/git-logger")
const { initOperationLogs } = require("./utils/operation-logger")
const { initRepoConfig } = require("./utils/repo-permission")

// 加载环境变量
dotenv.config({ path: path.join(__dirname, "./config/.env") })

// 加载配置管理器
const configManager = require("./utils/config-manager")

const app = express()
const PORT = configManager.get("server.port")

// 初始化配置
initUsersConfig()
initGitLogs()
initOperationLogs()
initRepoConfig()

// 中间件
app.use(cors())

// 请求日志
app.use((req, res, next) => {
	console.log(`📨 ${req.method} ${req.path}`)
	if (req.path.startsWith("/git/")) {
		console.log(`🔍 Git request detected: ${req.method} ${req.path}`)
		console.log(`📊 Headers:`, req.headers)
	}
	next()
})

// 超时设置
app.use((req, res, next) => {
	req.setTimeout(configManager.get("server.timeout")) // 可配置超时时间
	res.setTimeout(configManager.get("server.timeout"))
	next()
})

// Body parser - 对/git路径使用raw，其他路径使用json
app.use((req, res, next) => {
	if (req.path.startsWith("/git/")) {
		console.log(`🔧 Using raw body parser for ${req.path}`)
		const maxGitUploadSize = configManager.get("server.maxGitUploadSize")
		console.log(`📦 Max upload size: ${maxGitUploadSize}`)
		return express.raw({
			type: () => true,
			limit: maxGitUploadSize,
		})(req, res, next)
	}
	next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 挂载路由
console.log("🔧 正在挂载路由...")
console.log("  - /api/auth ->", typeof authRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/users", userManagementRoutes)
app.use("/api/repos", repoManagementRoutes)
app.use("/api/logs", operationLogRoutes)
app.use("/api/migration", dataMigrationRoutes)
app.use("/api/repo", repoRoutes)
// app.use("/api/users", userRoutes) // 旧的用户路由，已被userManagementRoutes替代
app.use("/git", gitHttpRoutes)
console.log("✅ 路由挂载完成")

// API根路径处理（用于API文档，放在静态文件之后作为fallback）
app.get("/api", (req, res) => {
	res.json({
		message: "Git Server API",
		version: "2.0.0",
		endpoints: {
			// 认证相关
			"POST /api/auth/login": "用户登录",
			"POST /api/auth/logout": "用户登出",
			"POST /api/auth/change-password": "修改自己的密码",
			"GET /api/auth/profile": "获取当前用户信息",

			// 用户管理（管理员+超管）
			"GET /api/users": "获取用户列表",
			"POST /api/users": "创建新用户",
			"DELETE /api/users/:username": "删除用户",
			"PUT /api/users/:username/role": "修改用户角色",
			"POST /api/users/:username/reset-password": "重置用户密码",

			// 仓库管理
			"GET /api/repos": "获取有权限的仓库列表",
			"GET /api/repos/:repoName/whitelist": "获取仓库白名单",
			"PUT /api/repos/:repoName/whitelist": "设置仓库白名单",
			"POST /api/repo/create": "创建新仓库（仅超管）",
			"POST /api/repo/update-path": "修改仓库路径",
			"GET /api/repo/log": "获取提交记录",
			"GET /api/repo/files": "获取文件列表",
			"GET /api/repo/status": "检查仓库状态",

			// 操作日志（管理员+超管）
			"GET /api/logs": "获取操作日志",

			// Git HTTP协议
			"GET /git/:repo/info/refs": "Git HTTP Smart Protocol",
			"POST /git/:repo/git-upload-pack": "Git clone/fetch",
			"POST /git/:repo/git-receive-pack": "Git push",
		},
	})
})

// 静态资源托管（前端打包后的文件）- 必须在API路由之后
app.use(express.static(path.join(__dirname, "../frontend/dist")))

// 错误处理中间件
app.use((error, req, res, next) => {
	console.error("服务器错误:", error)
	res.status(500).json({
		error: "服务器内部错误",
		message:
			process.env.NODE_ENV === "development" ? error.message : undefined,
	})
})

// 启动服务
app.listen(PORT, () => {
	const serverUrl = configManager.getServerUrl()
	console.log(`🚀 Git服务器启动成功！`)
	console.log(`📡 HTTP服务: ${serverUrl}`)
	console.log(`🔧 Git HTTP服务: ${serverUrl}/git/`)
	console.log(`👤 用户管理: ${serverUrl}/api/users/`)
	console.log(`📊 操作日志: ${serverUrl}/api/logs`)
	console.log(`💡 提示: 默认超级管理员账号 admin/123456 (请立即修改密码!)`)
}).on("error", (err) => {
	console.error("❌ 服务器启动失败:", err.message)
	if (err.code === "EADDRINUSE") {
		console.error(`端口 ${PORT} 已被占用，请检查是否有其他服务在使用该端口`)
	}
	process.exit(1)
})

console.log(`⏳ 正在启动服务器，监听端口 ${PORT}...`)
