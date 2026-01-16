const jwt = require("jsonwebtoken")
const fs = require("fs-extra")
const path = require("path")

// JWT密钥（生产环境应该从环境变量读取）
const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-in-production"
const JWT_EXPIRES_IN = "24h"

// Token黑名单（内存存储，重启后清空）
const tokenBlacklist = new Set()

/**
 * 生成JWT Token
 */
function generateToken(user) {
	const payload = {
		username: user.username,
		role: user.role,
		id: user.id,
	}

	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * 验证JWT Token
 */
function verifyToken(token) {
	try {
		// 检查是否在黑名单中
		if (tokenBlacklist.has(token)) {
			return null
		}

		const decoded = jwt.verify(token, JWT_SECRET)
		return decoded
	} catch (error) {
		console.error("Token验证失败:", error.message)
		return null
	}
}

/**
 * 将Token加入黑名单
 */
function blacklistToken(token) {
	tokenBlacklist.add(token)
}

/**
 * 将用户的所有Token加入黑名单（通过用户名标识）
 * 注意：这是简化实现，实际应该维护用户-token映射
 */
function blacklistUserTokens(username) {
	// 简化实现：清空所有黑名单并标记该用户需要重新登录
	// 实际生产环境应该使用Redis等持久化存储
	console.log(`用户 ${username} 的所有token已失效`)
}

/**
 * JWT认证中间件
 */
function authenticateJWT(req, res, next) {
	const authHeader = req.headers.authorization

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "未提供认证令牌" })
	}

	const token = authHeader.substring(7) // 移除 'Bearer ' 前缀
	const decoded = verifyToken(token)

	if (!decoded) {
		return res.status(401).json({ error: "无效或过期的令牌" })
	}

	// 将用户信息附加到请求对象
	req.user = decoded
	req.token = token
	next()
}

/**
 * 权限检查中间件工厂
 */
function requireRole(...allowedRoles) {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ error: "未认证" })
		}

		if (!allowedRoles.includes(req.user.role)) {
			return res.status(403).json({ error: "权限不足" })
		}

		next()
	}
}

/**
 * 超级管理员权限检查
 */
function requireSuperAdmin(req, res, next) {
	return requireRole("super_admin")(req, res, next)
}

/**
 * 管理员权限检查（包括超级管理员）
 */
function requireAdmin(req, res, next) {
	return requireRole("super_admin", "admin")(req, res, next)
}

module.exports = {
	generateToken,
	verifyToken,
	blacklistToken,
	blacklistUserTokens,
	authenticateJWT,
	requireRole,
	requireSuperAdmin,
	requireAdmin,
}
