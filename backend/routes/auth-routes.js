const express = require("express")
const router = express.Router()
const { authenticateUser, changePassword } = require("../utils/auth-utils")
const {
	generateToken,
	authenticateJWT,
	blacklistToken,
	blacklistUserTokens,
} = require("../utils/jwt-utils")

// 测试路由
router.get("/test", (req, res) => {
	res.json({ message: "认证路由工作正常" })
})

/**
 * 用户登录
 */
router.post("/login", (req, res) => {
	console.log("/login", req)

	try {
		const { username, password } = req.body

		if (!username || !password) {
			return res.status(400).json({ error: "用户名和密码不能为空" })
		}

		const user = authenticateUser(username, password)
		if (!user) {
			return res.status(401).json({ error: "用户名或密码错误" })
		}

		// 生成JWT token
		const token = generateToken(user)

		res.json({
			code: 200,
			data: {
				user,
				token,
			},
			msg: "登录成功",
		})
	} catch (error) {
		console.error("用户登录失败:", error)
		res.status(500).json({ error: "登录失败" })
	}
})

/**
 * 用户登出
 */
router.post("/logout", authenticateJWT, (req, res) => {
	try {
		// 将当前token加入黑名单
		blacklistToken(req.token)

		res.json({
			code: 200,
			msg: "登出成功",
		})
	} catch (error) {
		console.error("用户登出失败:", error)
		res.status(500).json({ error: "登出失败" })
	}
})

/**
 * 修改自己的密码
 */
router.post("/change-password", authenticateJWT, (req, res) => {
	try {
		const { oldPassword, newPassword } = req.body

		if (!oldPassword || !newPassword) {
			return res.status(400).json({ error: "旧密码和新密码不能为空" })
		}

		if (newPassword.length < 6) {
			return res.status(400).json({ error: "新密码长度不能少于6位" })
		}

		changePassword(req.user.username, oldPassword, newPassword)

		res.json({
			code: 200,
			msg: "密码修改成功，下次登录时生效",
		})
	} catch (error) {
		console.error("修改密码失败:", error)
		res.status(400).json({ error: error.message })
	}
})

/**
 * 获取当前用户信息
 */
router.get("/profile", authenticateJWT, (req, res) => {
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

module.exports = router
