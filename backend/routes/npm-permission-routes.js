const express = require("express")
const router = express.Router()
const { authenticateJWT, requireAdmin } = require("../utils/jwt-utils")
const unifiedAuth = require("../utils/unified-auth")
const npmPermission = require("../utils/npm-permission")

// 获取所有用户的NPM权限
router.get(
	"/users/npm-permissions",
	authenticateJWT,
	requireAdmin,
	async (req, res) => {
		try {
			const usersData = await unifiedAuth.readUsers()
			const usersWithPermissions = usersData.users.map((user) => ({
				id: user.id,
				username: user.username,
				email: user.email,
				role: user.role,
				npmPermissions:
					user.npmPermissions ||
					unifiedAuth.getDefaultNPMPermissions(user.role),
				isMigrated: user.isMigrated || false,
			}))

			res.json({
				success: true,
				users: usersWithPermissions,
			})
		} catch (error) {
			console.error("获取NPM权限列表失败:", error)
			res.status(500).json({
				success: false,
				message: "获取NPM权限列表失败",
			})
		}
	},
)

// 获取单个用户的NPM权限
router.get(
	"/users/:username/npm-permissions",
	authenticateJWT,
	requireAdmin,
	async (req, res) => {
		try {
			const { username } = req.params
			const permissions =
				await npmPermission.getUserNPMPermissions(username)

			if (!permissions) {
				return res.status(404).json({
					success: false,
					message: "用户不存在",
				})
			}

			res.json({
				success: true,
				permissions,
			})
		} catch (error) {
			console.error("获取用户NPM权限失败:", error)
			res.status(500).json({
				success: false,
				message: "获取用户NPM权限失败",
			})
		}
	},
)

// 更新用户NPM权限
router.put(
	"/users/:username/npm-permissions",
	authenticateJWT,
	requireAdmin,
	async (req, res) => {
		try {
			const { username } = req.params
			const { canLogin, canPublish, canManage, allowedPackages } =
				req.body

			// 验证输入
			if (
				typeof canLogin !== "boolean" ||
				typeof canPublish !== "boolean" ||
				typeof canManage !== "boolean"
			) {
				return res.status(400).json({
					success: false,
					message: "权限参数必须是布尔值",
				})
			}

			if (!Array.isArray(allowedPackages)) {
				return res.status(400).json({
					success: false,
					message: "allowedPackages必须是数组",
				})
			}

			const npmPermissions = {
				canLogin,
				canPublish,
				canManage,
				allowedPackages,
			}

			const result = await unifiedAuth.updateUserNPMPermissions(
				username,
				npmPermissions,
			)

			if (!result.success) {
				return res.status(400).json({
					success: false,
					message: result.error,
				})
			}

			res.json({
				success: true,
				message: "NPM权限更新成功",
				user: result.user,
			})
		} catch (error) {
			console.error("更新NPM权限失败:", error)
			res.status(500).json({
				success: false,
				message: "更新NPM权限失败",
			})
		}
	},
)

// 检查用户NPM权限状态
router.get(
	"/check-permissions/:username",
	authenticateJWT,
	async (req, res) => {
		try {
			const { username } = req.params
			const { packageName } = req.query

			const canLogin = await npmPermission.canLogin(username)
			const canPublish = packageName
				? await npmPermission.canPublish(username, packageName)
				: false
			const canManage = packageName
				? await npmPermission.canManage(username, packageName)
				: false

			res.json({
				success: true,
				permissions: {
					canLogin,
					canPublish,
					canManage,
				},
			})
		} catch (error) {
			console.error("检查NPM权限失败:", error)
			res.status(500).json({
				success: false,
				message: "检查NPM权限失败",
			})
		}
	},
)

module.exports = router
