const express = require("express")
const router = express.Router()
const {
	authenticateJWT,
	requireSuperAdmin,
	requireAdmin,
} = require("../utils/jwt-utils")
const {
	getAccessibleRepos,
	setRepoWhitelist,
	setCodeViewPermission,
	canAccessRepo,
} = require("../utils/repo-permission")
const { getUsers } = require("../utils/auth-utils")

/**
 * 获取仓库列表（根据权限过滤）
 */
router.get("/", authenticateJWT, (req, res) => {
	try {
		const repos = getAccessibleRepos(req.user.username, req.user.role)

		res.json({
			code: 200,
			data: repos,
		})
	} catch (error) {
		console.error("获取仓库列表失败:", error)
		res.status(500).json({ error: "获取仓库列表失败" })
	}
})

/**
 * 设置仓库白名单（管理员+超管）
 */
router.put(
	"/:repoName/whitelist",
	authenticateJWT,
	requireAdmin,
	(req, res) => {
		try {
			const { repoName } = req.params
			const { whitelist } = req.body

			if (!Array.isArray(whitelist)) {
				return res.status(400).json({ error: "白名单必须是数组" })
			}

			// 验证白名单中的用户是否存在
			const allUsers = getUsers()
			const usernames = allUsers.map((u) => u.username)

			for (const username of whitelist) {
				if (!usernames.includes(username)) {
					return res
						.status(400)
						.json({ error: `用户 ${username} 不存在` })
				}
			}

			const result = setRepoWhitelist(
				repoName,
				whitelist,
				req.user.username
			)

			res.json({
				code: 200,
				data: result,
				msg: "白名单设置成功",
			})
		} catch (error) {
			console.error("设置白名单失败:", error)
			res.status(400).json({ error: error.message })
		}
	}
)

/**
 * 获取仓库白名单（管理员+超管）
 */
router.get(
	"/:repoName/whitelist",
	authenticateJWT,
	requireAdmin,
	(req, res) => {
		try {
			const { repoName } = req.params
			const { getRepoConfig } = require("../utils/repo-permission")

			const config = getRepoConfig()
			const repo = config.repoList.find((r) => r.repoName === repoName)

			if (!repo) {
				return res.status(404).json({ error: "仓库不存在" })
			}

			res.json({
				code: 200,
				data: {
					repoName,
					whitelist: repo.whitelist || [],
					isPublic: !repo.whitelist || repo.whitelist.length === 0,
				},
			})
		} catch (error) {
			console.error("获取白名单失败:", error)
			res.status(500).json({ error: "获取白名单失败" })
		}
	}
)

/**
 * 设置仓库代码查看权限（管理员+超管）
 */
router.put(
	"/:repoName/code-view-permission",
	authenticateJWT,
	requireAdmin,
	(req, res) => {
		try {
			const { repoName } = req.params
			const { enabled, allowedUsers } = req.body

			if (typeof enabled !== "boolean") {
				return res.status(400).json({ error: "enabled 必须是布尔值" })
			}

			if (allowedUsers && !Array.isArray(allowedUsers)) {
				return res
					.status(400)
					.json({ error: "allowedUsers 必须是数组" })
			}

			// 验证用户是否存在
			if (allowedUsers && allowedUsers.length > 0) {
				const allUsers = getUsers()
				const usernames = allUsers.map((u) => u.username)

				for (const username of allowedUsers) {
					if (!usernames.includes(username)) {
						return res
							.status(400)
							.json({ error: `用户 ${username} 不存在` })
					}
				}
			}

			const result = setCodeViewPermission(
				repoName,
				enabled,
				allowedUsers || [],
				req.user.username
			)

			res.json({
				code: 200,
				data: result,
				msg: "代码查看权限设置成功",
			})
		} catch (error) {
			console.error("设置代码查看权限失败:", error)
			res.status(400).json({ error: error.message })
		}
	}
)

/**
 * 获取仓库代码查看权限（管理员+超管）
 */
router.get(
	"/:repoName/code-view-permission",
	authenticateJWT,
	requireAdmin,
	(req, res) => {
		try {
			const { repoName } = req.params
			const { getRepoConfig } = require("../utils/repo-permission")

			const config = getRepoConfig()
			const repo = config.repoList.find((r) => r.repoName === repoName)

			if (!repo) {
				return res.status(404).json({ error: "仓库不存在" })
			}

			const permission = repo.codeViewPermission || {
				enabled: false,
				allowedUsers: [],
			}

			res.json({
				code: 200,
				data: {
					repoName,
					enabled: permission.enabled,
					allowedUsers: permission.allowedUsers || [],
					useDefault: !permission.enabled,
				},
			})
		} catch (error) {
			console.error("获取代码查看权限失败:", error)
			res.status(500).json({ error: "获取代码查看权限失败" })
		}
	}
)

module.exports = router
