const express = require("express")
const router = express.Router()
const {
	getUsers,
	createUser,
	deleteUser,
	updateUserRole,
	updateUserInfo,
	resetUserPassword,
	findUserByUsername,
} = require("../utils/auth-utils")
const {
	authenticateJWT,
	requireSuperAdmin,
	requireAdmin,
	blacklistUserTokens,
} = require("../utils/jwt-utils")

/**
 * 获取所有用户列表（管理员+超管）
 */
router.get("/", authenticateJWT, requireAdmin, (req, res) => {
	try {
		const currentUser = req.user
		let users = getUsers()

		// 确保 users 是数组
		if (!users || !Array.isArray(users)) {
			users = []
		}

		// 普通管理员只能看到普通用户
		if (currentUser.role === "admin") {
			users = users.filter((user) => user.role === "user")
		}

		// 移除密码字段
		users = users.map((user) => ({
			id: user.id,
			username: user.username,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
			lastLogin: user.lastLogin,
		}))

		res.json({ code: 200, data: users })
	} catch (error) {
		console.error("获取用户列表失败:", error)
		res.status(500).json({ error: "获取用户列表失败" })
	}
})

/**
 * 创建新用户（管理员+超管）
 */
router.post("/", authenticateJWT, requireAdmin, (req, res) => {
	try {
		const { username, password, email, role } = req.body
		const currentUser = req.user

		if (!username || !password) {
			return res.status(400).json({ error: "用户名和密码不能为空" })
		}

		if (password.length < 6) {
			return res.status(400).json({ error: "密码长度不能少于6位" })
		}

		// 不允许创建超级管理员（超级管理员只有一个）
		if (role === "super_admin") {
			return res
				.status(403)
				.json({ error: "不允许创建超级管理员，超级管理员只有一个" })
		}

		// 普通管理员只能创建普通用户
		if (currentUser.role === "admin" && role && role !== "user") {
			return res.status(403).json({ error: "普通管理员只能创建普通用户" })
		}

		// 验证角色（移除 super_admin）
		const allowedRoles =
			currentUser.role === "super_admin" ? ["admin", "user"] : ["user"]

		const userRole = role || "user"
		if (!allowedRoles.includes(userRole)) {
			return res.status(400).json({ error: "无效的用户角色" })
		}

		const newUser = createUser(
			{
				username,
				password,
				email,
				role: userRole,
			},
			currentUser.username
		)

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

/**
 * 更新用户信息（用户名、邮箱）
 */
router.put("/:username", authenticateJWT, requireAdmin, (req, res) => {
	try {
		const { username } = req.params
		const { username: newUsername, email } = req.body
		const currentUser = req.user

		// 查找目标用户
		const targetUser = findUserByUsername(username)
		if (!targetUser) {
			return res.status(404).json({ error: "用户不存在" })
		}

		// 普通管理员只能修改普通用户
		if (currentUser.role === "admin" && targetUser.role !== "user") {
			return res
				.status(403)
				.json({ error: "普通管理员只能修改普通用户的信息" })
		}

		// 如果修改了用户名，检查新用户名是否已存在
		if (newUsername && newUsername !== username) {
			const existingUser = findUserByUsername(newUsername)
			if (existingUser) {
				return res.status(400).json({ error: "用户名已存在" })
			}
		}

		// 更新用户信息
		const result = updateUserInfo(
			username,
			{ username: newUsername, email },
			currentUser.username
		)

		// 如果修改了用户名，使该用户的所有token失效
		if (newUsername && newUsername !== username) {
			blacklistUserTokens(username)
		}

		res.json({
			code: 200,
			data: result,
			msg: "用户信息修改成功",
		})
	} catch (error) {
		console.error("修改用户信息失败:", error)
		res.status(400).json({ error: error.message })
	}
})

/**
 * 删除用户（管理员+超管）
 */
router.delete("/:username", authenticateJWT, requireAdmin, (req, res) => {
	try {
		const { username } = req.params
		const currentUser = req.user

		// 查找要删除的用户
		const targetUser = findUserByUsername(username)
		if (!targetUser) {
			return res.status(404).json({ error: "用户不存在" })
		}

		// 普通管理员只能删除普通用户
		if (currentUser.role === "admin" && targetUser.role !== "user") {
			return res.status(403).json({ error: "普通管理员只能删除普通用户" })
		}

		deleteUser(username, currentUser.username)

		// 使该用户的所有token失效
		blacklistUserTokens(username)

		res.json({
			code: 200,
			msg: "用户删除成功",
		})
	} catch (error) {
		console.error("删除用户失败:", error)
		res.status(400).json({ error: error.message })
	}
})

/**
 * 修改用户角色（管理员+超管）
 */
router.put("/:username/role", authenticateJWT, requireAdmin, (req, res) => {
	try {
		const { username } = req.params
		const { role } = req.body
		const currentUser = req.user

		if (!role) {
			return res.status(400).json({ error: "角色不能为空" })
		}

		// 不允许修改为超级管理员（超级管理员只有一个）
		if (role === "super_admin") {
			return res
				.status(403)
				.json({ error: "不允许修改为超级管理员，超级管理员只有一个" })
		}

		// 查找目标用户
		const targetUser = findUserByUsername(username)
		if (!targetUser) {
			return res.status(404).json({ error: "用户不存在" })
		}

		// 不允许修改超级管理员的角色
		if (targetUser.role === "super_admin") {
			return res.status(403).json({ error: "不允许修改超级管理员的角色" })
		}

		// 普通管理员只能修改普通用户的角色
		if (currentUser.role === "admin" && targetUser.role !== "user") {
			return res
				.status(403)
				.json({ error: "普通管理员只能修改普通用户的角色" })
		}

		// 普通管理员只能将用户设置为普通用户
		if (currentUser.role === "admin" && role !== "user") {
			return res
				.status(403)
				.json({ error: "普通管理员只能将用户设置为普通用户" })
		}

		// 验证角色
		const allowedRoles = ["admin", "user"]
		if (!allowedRoles.includes(role)) {
			return res.status(400).json({ error: "无效的用户角色" })
		}

		const result = updateUserRole(username, role, currentUser.username)

		// 使该用户的所有token失效（角色变更需要重新登录）
		blacklistUserTokens(username)

		res.json({
			code: 200,
			data: result,
			msg: "角色修改成功，用户需要重新登录",
		})
	} catch (error) {
		console.error("修改用户角色失败:", error)
		res.status(400).json({ error: error.message })
	}
})

/**
 * 重置用户密码（管理员+超管）
 */
router.post(
	"/:username/reset-password",
	authenticateJWT,
	requireAdmin,
	(req, res) => {
		try {
			const { username } = req.params
			const { newPassword } = req.body
			const currentUser = req.user

			if (!newPassword) {
				return res.status(400).json({ error: "新密码不能为空" })
			}

			if (newPassword.length < 6) {
				return res.status(400).json({ error: "新密码长度不能少于6位" })
			}

			// 查找目标用户
			const targetUser = findUserByUsername(username)
			if (!targetUser) {
				return res.status(404).json({ error: "用户不存在" })
			}

			// 普通管理员只能重置普通用户的密码
			if (currentUser.role === "admin" && targetUser.role !== "user") {
				return res
					.status(403)
					.json({ error: "普通管理员只能重置普通用户的密码" })
			}

			resetUserPassword(username, newPassword, currentUser.username)

			// 使该用户的所有token失效（密码重置需要重新登录）
			blacklistUserTokens(username)

			res.json({
				code: 200,
				msg: "密码重置成功，用户需要重新登录",
			})
		} catch (error) {
			console.error("重置密码失败:", error)
			res.status(400).json({ error: error.message })
		}
	}
)

module.exports = router
