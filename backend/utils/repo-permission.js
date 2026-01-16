const fs = require("fs-extra")
const path = require("path")
const { logOperation } = require("./operation-logger")

const REPO_CONFIG_PATH = path.join(__dirname, "../config/repo-config.json")

/**
 * 初始化仓库配置
 */
function initRepoConfig() {
	if (!fs.existsSync(REPO_CONFIG_PATH)) {
		fs.writeJsonSync(REPO_CONFIG_PATH, { repoList: [] }, { spaces: 2 })
	}
}

/**
 * 获取仓库配置
 */
function getRepoConfig() {
	try {
		initRepoConfig()
		return fs.readJsonSync(REPO_CONFIG_PATH)
	} catch (error) {
		console.error("读取仓库配置失败:", error)
		return { repoList: [] }
	}
}

/**
 * 保存仓库配置
 */
function saveRepoConfig(config) {
	try {
		fs.writeJsonSync(REPO_CONFIG_PATH, config, { spaces: 2 })
	} catch (error) {
		console.error("保存仓库配置失败:", error)
		throw error
	}
}

/**
 * 检查用户是否有权限访问仓库
 */
function canAccessRepo(username, userRole, repoName) {
	// 超级管理员永远可以访问所有仓库
	if (userRole === "super_admin") {
		return true
	}

	const config = getRepoConfig()
	if (!config.repoList || !Array.isArray(config.repoList)) {
		return false
	}
	const repo = config.repoList.find((r) => r.repoName === repoName)

	if (!repo) {
		return false
	}

	// 如果没有白名单或白名单为空，所有人都可以访问
	if (!repo.whitelist || repo.whitelist.length === 0) {
		return true
	}

	// 检查是否在白名单中
	return repo.whitelist.includes(username)
}

/**
 * 检查用户是否有代码查看权限
 */
function canViewCode(username, userRole, repoName) {
	// 超级管理员永远有代码查看权限
	if (userRole === "super_admin") {
		return true
	}

	const config = getRepoConfig()
	if (!config.repoList || !Array.isArray(config.repoList)) {
		return false
	}
	const repo = config.repoList.find((r) => r.repoName === repoName)

	if (!repo) {
		return false
	}

	// 如果没有配置代码查看权限，使用默认规则
	if (!repo.codeViewPermission) {
		// 默认：管理员有权限，普通用户无权限
		return userRole === "admin"
	}

	// 如果未启用代码查看权限控制，使用默认规则
	if (!repo.codeViewPermission.enabled) {
		return userRole === "admin"
	}

	// 检查是否在允许列表中
	const allowedUsers = repo.codeViewPermission.allowedUsers || []

	// 如果允许列表为空，继承仓库访问权限
	if (allowedUsers.length === 0) {
		return canAccessRepo(username, userRole, repoName)
	}

	return allowedUsers.includes(username)
}

/**
 * 获取用户有权限访问的仓库列表
 */
function getAccessibleRepos(username, userRole) {
	const config = getRepoConfig()

	// 超级管理员可以看到所有仓库
	if (userRole === "super_admin") {
		return config.repoList || []
	}

	// 其他用户只能看到有权限的仓库
	if (!config.repoList || !Array.isArray(config.repoList)) {
		return []
	}
	return config.repoList.filter((repo) => {
		// 没有白名单或白名单为空 = 所有人可见
		if (!repo.whitelist || repo.whitelist.length === 0) {
			return true
		}
		// 检查是否在白名单中
		return repo.whitelist.includes(username)
	})
}

/**
 * 设置仓库白名单
 */
function setRepoWhitelist(repoName, whitelist, operator) {
	try {
		const config = getRepoConfig()
		if (!config.repoList || !Array.isArray(config.repoList)) {
			throw new Error("仓库配置异常")
		}
		const repo = config.repoList.find((r) => r.repoName === repoName)

		if (!repo) {
			throw new Error("仓库不存在")
		}

		const oldWhitelist = repo.whitelist || []
		repo.whitelist = whitelist

		saveRepoConfig(config)

		// 记录操作日志
		const details =
			whitelist.length === 0
				? "设置为公开（所有人可见）"
				: `设置白名单：${whitelist.join(", ")}`
		logOperation(operator, "update_whitelist", repoName, details)

		return {
			repoName,
			oldWhitelist,
			newWhitelist: whitelist,
		}
	} catch (error) {
		console.error("设置仓库白名单失败:", error)
		throw error
	}
}

/**
 * 创建仓库时初始化白名单
 */
function initRepoWhitelist(repoName) {
	try {
		const config = getRepoConfig()
		if (!config.repoList || !Array.isArray(config.repoList)) {
			return
		}
		const repo = config.repoList.find((r) => r.repoName === repoName)

		if (repo && !repo.whitelist) {
			repo.whitelist = [] // 默认为空，所有人可见
			saveRepoConfig(config)
		}
	} catch (error) {
		console.error("初始化仓库白名单失败:", error)
	}
}

/**
 * 设置仓库代码查看权限
 */
function setCodeViewPermission(repoName, enabled, allowedUsers, operator) {
	try {
		const config = getRepoConfig()
		if (!config.repoList || !Array.isArray(config.repoList)) {
			throw new Error("仓库配置异常")
		}
		const repo = config.repoList.find((r) => r.repoName === repoName)

		if (!repo) {
			throw new Error("仓库不存在")
		}

		const oldPermission = repo.codeViewPermission || {
			enabled: false,
			allowedUsers: [],
		}

		repo.codeViewPermission = {
			enabled: enabled,
			allowedUsers: allowedUsers || [],
		}

		saveRepoConfig(config)

		// 记录操作日志
		const details = enabled
			? allowedUsers.length === 0
				? "启用代码查看权限（继承仓库访问权限）"
				: `启用代码查看权限：${allowedUsers.join(", ")}`
			: "禁用代码查看权限（使用默认规则）"

		logOperation(operator, "update_code_view_permission", repoName, details)

		return {
			repoName,
			oldPermission,
			newPermission: repo.codeViewPermission,
		}
	} catch (error) {
		console.error("设置代码查看权限失败:", error)
		throw error
	}
}

module.exports = {
	initRepoConfig,
	getRepoConfig,
	saveRepoConfig,
	canAccessRepo,
	canViewCode,
	getAccessibleRepos,
	setRepoWhitelist,
	initRepoWhitelist,
	setCodeViewPermission,
}
