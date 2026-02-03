const fs = require("fs-extra")
const path = require("path")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { logOperation } = require("./operation-logger")
const { getCurrentUTC8Timestamp } = require("./time-utils")

// 用户配置文件路径
const USERS_CONFIG_PATH = path.join(__dirname, "../config/users.json")

// 初始化用户配置文件
function initUsersConfig() {
	if (!fs.existsSync(USERS_CONFIG_PATH)) {
		const defaultConfig = {
			users: [
				{
					id: "admin",
					username: "admin",
					password: hashPasswordBcrypt("123456"), // 默认密码 123456
					email: "admin@example.com",
					role: "super_admin",
					createdAt: getCurrentUTC8Timestamp(),
					lastLogin: null,
				},
			],
		}
		fs.writeJsonSync(USERS_CONFIG_PATH, defaultConfig, { spaces: 2 })
		console.log("✅ 已创建默认超级管理员: admin/123456 (请立即修改密码!)")
	}
}

// 旧的密码哈希（兼容旧数据）
function hashPassword(password) {
	return crypto.createHash("sha256").update(password).digest("hex")
}

// 新的密码哈希（使用bcrypt）
function hashPasswordBcrypt(password) {
	const salt = bcrypt.genSaltSync(10)
	return bcrypt.hashSync(password, salt)
}

// 验证密码（兼容新旧两种方式）
function verifyPassword(password, hashedPassword) {
	// 尝试bcrypt验证
	try {
		if (bcrypt.compareSync(password, hashedPassword)) {
			return true
		}
	} catch (e) {
		// 不是bcrypt格式，尝试旧的sha256
	}

	// 尝试旧的sha256验证
	return hashPassword(password) === hashedPassword
}

// 获取所有用户
function getUsers() {
	try {
		initUsersConfig()
		const config = fs.readJsonSync(USERS_CONFIG_PATH)
		return config.users || []
	} catch (error) {
		console.error("读取用户配置失败:", error)
		return []
	}
}

// 根据用户名查找用户
function findUserByUsername(username) {
	const users = getUsers()
	if (!users || !Array.isArray(users)) {
		return null
	}
	return users.find((user) => user.username === username)
}

// 根据ID查找用户
function findUserById(id) {
	const users = getUsers()
	if (!users || !Array.isArray(users)) {
		return null
	}
	return users.find((user) => user.id === id)
}

// 验证用户凭据
function authenticateUser(username, password) {
	const user = findUserByUsername(username)
	if (!user) {
		return null
	}

	if (verifyPassword(password, user.password)) {
		// 更新最后登录时间
		updateUserLastLogin(user.id)
		return {
			id: user.id,
			username: user.username,
			email: user.email,
			role: user.role,
		}
	}

	return null
}

// 更新用户最后登录时间
function updateUserLastLogin(userId) {
	try {
		const config = fs.readJsonSync(USERS_CONFIG_PATH)
		if (!config.users || !Array.isArray(config.users)) {
			return
		}
		const userIndex = config.users.findIndex((user) => user.id === userId)
		if (userIndex !== -1) {
			config.users[userIndex].lastLogin = getCurrentUTC8Timestamp()
			fs.writeJsonSync(USERS_CONFIG_PATH, config, { spaces: 2 })
		}
	} catch (error) {
		console.error("更新用户登录时间失败:", error)
	}
}

// 创建新用户
function createUser(userData, operator) {
	try {
		initUsersConfig()
		const config = fs.readJsonSync(USERS_CONFIG_PATH)

		// 初始化 users 数组
		if (!config.users || !Array.isArray(config.users)) {
			config.users = []
		}

		// 检查用户名是否已存在
		if (config.users.some((user) => user.username === userData.username)) {
			throw new Error("用户名已存在")
		}

		const newUser = {
			id: crypto.randomUUID(),
			username: userData.username,
			password: hashPasswordBcrypt(userData.password),
			email: userData.email || "",
			role: userData.role || "user",
			createdAt: getCurrentUTC8Timestamp(),
			lastLogin: null,
		}

		config.users.push(newUser)
		fs.writeJsonSync(USERS_CONFIG_PATH, config, { spaces: 2 })

		// 记录操作日志
		if (operator) {
			logOperation(
				operator,
				"create_user",
				userData.username,
				`创建用户，角色：${newUser.role}`,
			)
		}

		return {
			id: newUser.id,
			username: newUser.username,
			email: newUser.email,
			role: newUser.role,
		}
	} catch (error) {
		console.error("创建用户失败:", error)
		throw error
	}
}

// 删除用户
function deleteUser(username, operator) {
	try {
		initUsersConfig()
		const config = fs.readJsonSync(USERS_CONFIG_PATH)

		if (!config.users || !Array.isArray(config.users)) {
			throw new Error("用户配置异常")
		}

		const userIndex = config.users.findIndex(
			(user) => user.username === username,
		)
		if (userIndex === -1) {
			throw new Error("用户不存在")
		}

		// 不能删除自己
		if (username === operator) {
			throw new Error("不能删除自己的账号")
		}

		const deletedUser = config.users[userIndex]
		config.users.splice(userIndex, 1)
		fs.writeJsonSync(USERS_CONFIG_PATH, config, { spaces: 2 })

		// 记录操作日志
		logOperation(
			operator,
			"delete_user",
			username,
			`删除用户，角色：${deletedUser.role}`,
		)

		return true
	} catch (error) {
		console.error("删除用户失败:", error)
		throw error
	}
}

// 修改用户角色
function updateUserRole(username, newRole, operator) {
	try {
		initUsersConfig()
		const config = fs.readJsonSync(USERS_CONFIG_PATH)

		if (!config.users || !Array.isArray(config.users)) {
			throw new Error("用户配置异常")
		}

		const userIndex = config.users.findIndex(
			(user) => user.username === username,
		)
		if (userIndex === -1) {
			throw new Error("用户不存在")
		}

		const oldRole = config.users[userIndex].role
		config.users[userIndex].role = newRole
		fs.writeJsonSync(USERS_CONFIG_PATH, config, { spaces: 2 })

		// 记录操作日志
		logOperation(
			operator,
			"update_role",
			username,
			`角色变更：${oldRole} → ${newRole}`,
		)

		return {
			username,
			oldRole,
			newRole,
		}
	} catch (error) {
		console.error("修改用户角色失败:", error)
		throw error
	}
}

// 更新用户信息（用户名、邮箱）
function updateUserInfo(username, updateData, operator) {
	try {
		initUsersConfig()
		const config = fs.readJsonSync(USERS_CONFIG_PATH)

		if (!config.users || !Array.isArray(config.users)) {
			throw new Error("用户配置异常")
		}

		const userIndex = config.users.findIndex(
			(user) => user.username === username,
		)
		if (userIndex === -1) {
			throw new Error("用户不存在")
		}

		const oldUsername = config.users[userIndex].username
		const changes = []

		// 更新用户名
		if (updateData.username && updateData.username !== oldUsername) {
			// 检查新用户名是否已存在
			if (
				config.users.some(
					(user) => user.username === updateData.username,
				)
			) {
				throw new Error("用户名已存在")
			}
			config.users[userIndex].username = updateData.username
			changes.push(`用户名：${oldUsername} → ${updateData.username}`)
		}

		// 更新邮箱
		if (updateData.email !== undefined) {
			const oldEmail = config.users[userIndex].email || "未设置"
			config.users[userIndex].email = updateData.email
			changes.push(`邮箱：${oldEmail} → ${updateData.email || "未设置"}`)
		}

		fs.writeJsonSync(USERS_CONFIG_PATH, config, { spaces: 2 })

		// 记录操作日志
		if (changes.length > 0) {
			logOperation(
				operator,
				"update_user",
				oldUsername,
				`更新用户信息：${changes.join(", ")}`,
			)
		}

		return {
			username: config.users[userIndex].username,
			email: config.users[userIndex].email,
		}
	} catch (error) {
		console.error("更新用户信息失败:", error)
		throw error
	}
}

// 重置用户密码
function resetUserPassword(username, newPassword, operator) {
	try {
		initUsersConfig()
		const config = fs.readJsonSync(USERS_CONFIG_PATH)

		if (!config.users || !Array.isArray(config.users)) {
			throw new Error("用户配置异常")
		}

		const userIndex = config.users.findIndex(
			(user) => user.username === username,
		)
		if (userIndex === -1) {
			throw new Error("用户不存在")
		}

		config.users[userIndex].password = hashPasswordBcrypt(newPassword)
		fs.writeJsonSync(USERS_CONFIG_PATH, config, { spaces: 2 })

		// 记录操作日志
		logOperation(operator, "reset_password", username, "重置用户密码")

		return true
	} catch (error) {
		console.error("重置密码失败:", error)
		throw error
	}
}

// 修改自己的密码
function changePassword(username, oldPassword, newPassword) {
	try {
		initUsersConfig()
		const config = fs.readJsonSync(USERS_CONFIG_PATH)

		if (!config.users || !Array.isArray(config.users)) {
			throw new Error("用户配置异常")
		}

		const userIndex = config.users.findIndex(
			(user) => user.username === username,
		)
		if (userIndex === -1) {
			throw new Error("用户不存在")
		}

		// 验证旧密码
		if (!verifyPassword(oldPassword, config.users[userIndex].password)) {
			throw new Error("原密码错误")
		}

		config.users[userIndex].password = hashPasswordBcrypt(newPassword)
		fs.writeJsonSync(USERS_CONFIG_PATH, config, { spaces: 2 })

		console.log(`用户 ${username} 修改了密码`)

		return true
	} catch (error) {
		console.error("修改密码失败:", error)
		throw error
	}
}

// 解析Basic Auth头
function parseBasicAuth(authHeader) {
	if (!authHeader || !authHeader.startsWith("Basic ")) {
		return null
	}

	try {
		const base64Credentials = authHeader.slice("Basic ".length)
		const credentials = Buffer.from(base64Credentials, "base64").toString(
			"utf8",
		)
		const [username, password] = credentials.split(":")
		return { username, password }
	} catch (error) {
		console.error("解析Basic Auth失败:", error)
		return null
	}
}

// 中间件：验证Git操作权限
function requireGitAuth(req, res, next) {
	const authHeader = req.headers.authorization

	console.log(`🔐 Git Auth check for ${req.path}`)
	console.log(
		`   Authorization header: ${authHeader ? "present" : "missing"}`,
	)

	if (!authHeader) {
		console.log(`❌ No authorization header, sending 401`)
		res.setHeader("WWW-Authenticate", 'Basic realm="Git Repository"')
		return res
			.status(401)
			.send("Authentication required for push operations")
	}

	const credentials = parseBasicAuth(authHeader)
	if (!credentials) {
		console.log(`❌ Invalid auth format`)
		return res.status(401).send("Invalid authentication format")
	}

	console.log(`🔍 Authenticating user: ${credentials.username}`)
	const user = authenticateUser(credentials.username, credentials.password)
	if (!user) {
		console.log(
			`❌ Authentication failed for user: ${credentials.username}`,
		)
		return res.status(401).send("Invalid username or password")
	}

	console.log(
		`✅ Authentication successful for user: ${user.username} (${user.role})`,
	)
	// 将用户信息附加到请求对象
	req.user = user
	next()
}

// 检查用户是否有代码查看权限
function checkCodeViewPermission(username, repoPath) {
	try {
		const user = findUserByUsername(username)
		if (!user) {
			return false
		}

		// 使用 repo-permission 中的 canViewCode 函数
		const { canViewCode, getRepoConfig } = require("./repo-permission")

		// 通过 repoPath 找到 repoName
		const config = getRepoConfig()
		if (!config.repoList || !Array.isArray(config.repoList)) {
			return false
		}
		const repo = config.repoList.find((r) => r.repoPath === repoPath)

		if (!repo) {
			return false
		}

		return canViewCode(username, user.role, repo.repoName)
	} catch (error) {
		console.error("检查代码查看权限失败:", error)
		return false
	}
}

module.exports = {
	initUsersConfig,
	hashPassword,
	hashPasswordBcrypt,
	verifyPassword,
	getUsers,
	findUserByUsername,
	findUserById,
	authenticateUser,
	createUser,
	deleteUser,
	updateUserRole,
	updateUserInfo,
	resetUserPassword,
	changePassword,
	parseBasicAuth,
	requireGitAuth,
	checkCodeViewPermission,
}
