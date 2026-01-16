const express = require("express")
const router = express.Router()
const {
	getUsers,
	createUser,
	findUserByUsername,
	authenticateUser,
	requireGitAuth,
} = require("../utils/auth-utils")
const {
	getGitLogs,
	getRepositoryStats,
	getUserStats,
} = require("../utils/git-logger")

// 获取所有用户（需要管理员权限）
router.get("/users", requireGitAuth, (req, res) => {
	try {
		if (req.user.role !== "admin") {
			return res.status(403).json({ error: "需要管理员权限" })
		}

		const users = getUsers()
		// 确保 users 是数组
		if (!users || !Array.isArray(users)) {
			return res.json({ code: 200, data: [] })
		}

		const mappedUsers = users.map((user) => ({
			id: user.id,
			username: user.username,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
			lastLogin: user.lastLogin,
		}))

		res.json({ code: 200, data: mappedUsers })
	} catch (error) {
		console.error("获取用户列表失败:", error)
		res.status(500).json({ error: "获取用户列表失败" })
	}
})

// 创建新用户（需要管理员权限）
router.post("/users", requireGitAuth, (req, res) => {
	try {
		if (req.user.role !== "admin") {
			return res.status(403).json({ error: "需要管理员权限" })
		}

		const { username, password, email, role } = req.body

		if (!username || !password) {
			return res.status(400).json({ error: "用户名和密码不能为空" })
		}

		const newUser = createUser({
			username,
			password,
			email,
			role: role || "user",
		})

		res.json({
			code: 200,
			data: newUser,
			msg: "用户创建成功",
		})
	} catch (error) {
		console.error("创建用户失败:", error)
		res.status(400).json({ error: error.message })
	}
})

// 用户登录
router.post("/login", (req, res) => {
	try {
		const { username, password } = req.body

		if (!username || !password) {
			return res.status(400).json({ error: "用户名和密码不能为空" })
		}

		const user = authenticateUser(username, password)
		if (!user) {
			return res.status(401).json({ error: "用户名或密码错误" })
		}

		res.json({
			code: 200,
			data: user,
			msg: "登录成功",
		})
	} catch (error) {
		console.error("用户登录失败:", error)
		res.status(500).json({ error: "登录失败" })
	}
})

// 获取当前用户信息
router.get("/profile", requireGitAuth, (req, res) => {
	try {
		res.json({
			code: 200,
			data: req.user,
		})
	} catch (error) {
		console.error("获取用户信息失败:", error)
		res.status(500).json({ error: "获取用户信息失败" })
	}
})

// 获取Git操作日志
router.get("/logs", requireGitAuth, (req, res) => {
	try {
		const { repository, user, operation, limit } = req.query

		// 普通用户只能查看自己的日志
		const filterOptions = {
			repository,
			operation,
			limit: limit ? parseInt(limit) : 50,
		}

		if (req.user.role !== "admin") {
			filterOptions.user = req.user.username
		} else if (user) {
			filterOptions.user = user
		}

		const logs = getGitLogs(filterOptions)

		res.json({
			code: 200,
			data: logs,
		})
	} catch (error) {
		console.error("获取日志失败:", error)
		res.status(500).json({ error: "获取日志失败" })
	}
})

// 获取仓库统计信息
router.get("/stats/repository/:repoName", requireGitAuth, (req, res) => {
	try {
		const { repoName } = req.params
		const stats = getRepositoryStats(repoName)

		if (!stats) {
			return res.status(404).json({ error: "仓库不存在" })
		}

		res.json({
			code: 200,
			data: stats,
		})
	} catch (error) {
		console.error("获取仓库统计失败:", error)
		res.status(500).json({ error: "获取仓库统计失败" })
	}
})

// 获取用户统计信息
router.get("/stats/user/:username", requireGitAuth, (req, res) => {
	try {
		const username = req.params.username

		// 普通用户只能查看自己的统计
		if (req.user.role !== "admin" && username !== req.user.username) {
			return res.status(403).json({ error: "权限不足" })
		}

		const stats = getUserStats(username)

		if (!stats) {
			return res.status(404).json({ error: "用户不存在" })
		}

		res.json({
			code: 200,
			data: stats,
		})
	} catch (error) {
		console.error("获取用户统计失败:", error)
		res.status(500).json({ error: "获取用户统计失败" })
	}
})

// 获取当前用户统计信息
router.get("/stats/user", requireGitAuth, (req, res) => {
	try {
		const stats = getUserStats(req.user.username)

		if (!stats) {
			return res.status(404).json({ error: "用户不存在" })
		}

		res.json({
			code: 200,
			data: stats,
		})
	} catch (error) {
		console.error("获取用户统计失败:", error)
		res.status(500).json({ error: "获取用户统计失败" })
	}
})

// 获取系统统计信息（管理员专用）
router.get("/stats/system", requireGitAuth, (req, res) => {
	try {
		if (req.user.role !== "admin") {
			return res.status(403).json({ error: "需要管理员权限" })
		}

		const allLogs = getGitLogs({ limit: 1000 })
		const users = getUsers()

		const stats = {
			totalUsers: users.length,
			totalOperations: allLogs.length,
			operationsByType: {
				push: allLogs.filter((log) => log.operation === "push").length,
				clone: allLogs.filter((log) => log.operation === "clone")
					.length,
				pull: allLogs.filter((log) => log.operation === "pull").length,
			},
			activeUsers: [
				...new Set(
					allLogs
						.filter((log) => log.user)
						.map((log) => log.user.username)
				),
			].length,
			recentActivity: allLogs.slice(0, 10),
		}

		res.json({
			code: 200,
			data: stats,
		})
	} catch (error) {
		console.error("获取系统统计失败:", error)
		res.status(500).json({ error: "获取系统统计失败" })
	}
})

module.exports = router
