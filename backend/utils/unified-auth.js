const fs = require("fs").promises
const path = require("path")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const { hashPasswordBcrypt } = require("./auth-utils")
const { getCurrentUTC8Timestamp } = require("./time-utils")

class UnifiedAuth {
	constructor() {
		this.usersPath = path.join(__dirname, "../config/users.json")
		this.htpasswdPath = path.join(__dirname, "../verdaccio-htpasswd")
	}

	// 获取用户默认NPM权限
	getDefaultNPMPermissions(role) {
		switch (role) {
			case "super_admin":
			case "admin":
				return {
					canLogin: true,
					canPublish: true,
					canManage: true,
					allowedPackages: ["*"], // 管理员可以发布任何包
				}
			case "user":
			default:
				return {
					canLogin: true,
					canPublish: false,
					canManage: false,
					allowedPackages: [],
				}
		}
	}

	// 读取用户数据
	async readUsers() {
		try {
			const data = await fs.readFile(this.usersPath, "utf8")
			return JSON.parse(data)
		} catch (error) {
			console.error("读取用户文件失败:", error)
			return { users: [] }
		}
	}

	// 保存用户数据
	async saveUsers(usersData) {
		try {
			await fs.writeFile(
				this.usersPath,
				JSON.stringify(usersData, null, 2),
			)
			return true
		} catch (error) {
			console.error("保存用户文件失败:", error)
			return false
		}
	}

	// 读取htpasswd文件
	async readHtpasswd() {
		try {
			const data = await fs.readFile(this.htpasswdPath, "utf8")
			const users = {}
			data.split("\n").forEach((line) => {
				if (line.trim()) {
					const [username, password] = line.split(":")
					if (username && password) {
						users[username] = password
					}
				}
			})
			return users
		} catch (error) {
			console.log("htpasswd文件不存在或读取失败，将创建新文件")
			return {}
		}
	}
	// 保存htpasswd文件
	async saveHtpasswd(users) {
		try {
			const lines = Object.entries(users).map(
				([username, password]) => `${username}:${password}`,
			)
			await fs.writeFile(this.htpasswdPath, lines.join("\n") + "\n")
			return true
		} catch (error) {
			console.error("保存htpasswd文件失败:", error)
			return false
		}
	}

	// 生成htpasswd格式的密码
	generateHtpasswdPassword(password) {
		// 使用Apache htpasswd兼容的MD5格式
		const salt = crypto.randomBytes(8).toString("hex").substring(0, 8)
		const hash = crypto
			.createHash("md5")
			.update(password + salt)
			.digest("hex")
		return `$apr1$${salt}$${hash}`
	}

	// 迁移现有用户数据，为所有用户添加NPM权限
	async migrateUsersWithNPMPermissions() {
		const usersData = await this.readUsers()
		let hasChanges = false

		// 为现有用户添加NPM权限
		usersData.users.forEach((user) => {
			if (!user.npmPermissions) {
				user.npmPermissions = this.getDefaultNPMPermissions(user.role)
				hasChanges = true
			}
		})

		if (hasChanges) {
			await this.saveUsers(usersData)
			console.log("用户NPM权限迁移完成")
		}

		// 迁移htpasswd中的用户到users.json
		await this.migrateHtpasswdUsers()

		return true
	}

	// 迁移htpasswd中的用户到users.json
	async migrateHtpasswdUsers() {
		const htpasswdUsers = await this.readHtpasswd()
		const usersData = await this.readUsers()
		const existingUsernames = new Set(
			usersData.users.map((u) => u.username),
		)

		let hasNewUsers = false

		// 为htpasswd中存在但users.json中不存在的用户创建记录
		for (const username of Object.keys(htpasswdUsers)) {
			if (!existingUsernames.has(username)) {
				const newUser = {
					id: crypto.randomUUID(),
					username: username,
					password: "", // htpasswd用户密码保持在htpasswd中
					email: "",
					role: "user",
					createdAt: getCurrentUTC8Timestamp(),
					lastLogin: null,
					npmPermissions: this.getDefaultNPMPermissions("user"),
					isMigrated: true, // 标记为迁移用户
				}
				usersData.users.push(newUser)
				hasNewUsers = true
				console.log(`迁移htpasswd用户: ${username}`)
			}
		}

		if (hasNewUsers) {
			await this.saveUsers(usersData)
		}

		return hasNewUsers
	}
	// 同步用户到htpasswd
	async syncUserToHtpasswd(username, password) {
		const htpasswdUsers = await this.readHtpasswd()
		htpasswdUsers[username] = this.generateHtpasswdPassword(password)
		return await this.saveHtpasswd(htpasswdUsers)
	}

	// 从htpasswd删除用户
	async removeUserFromHtpasswd(username) {
		const htpasswdUsers = await this.readHtpasswd()
		delete htpasswdUsers[username]
		return await this.saveHtpasswd(htpasswdUsers)
	}

	// 创建用户（同时创建到users.json和htpasswd）
	async createUser(userData) {
		try {
			const usersData = await this.readUsers()

			// 检查用户名是否已存在
			if (usersData.users.find((u) => u.username === userData.username)) {
				throw new Error("用户名已存在")
			}

			// 创建用户记录
			const newUser = {
				id: crypto.randomUUID(),
				username: userData.username,
				password: await hashPasswordBcrypt(userData.password),
				email: userData.email || "",
				role: userData.role || "user",
				createdAt: getCurrentUTC8Timestamp(),
				lastLogin: null,
				npmPermissions: this.getDefaultNPMPermissions(
					userData.role || "user",
				),
			}

			// 添加到users.json
			usersData.users.push(newUser)
			await this.saveUsers(usersData)

			// 同步到htpasswd
			try {
				const syncResult = await this.syncUserToHtpasswd(
					userData.username,
					userData.password,
				)
				if (syncResult) {
					console.log(`✅ 用户 ${userData.username} 已同步到htpasswd`)
				} else {
					console.error(
						`❌ 用户 ${userData.username} 同步到htpasswd失败`,
					)
				}
			} catch (syncError) {
				console.error(
					`❌ 同步用户 ${userData.username} 到htpasswd时出错:`,
					syncError,
				)
			}

			console.log(`用户创建成功: ${userData.username}`)
			return { success: true, user: newUser }
		} catch (error) {
			console.error("创建用户失败:", error)
			return { success: false, error: error.message }
		}
	}

	// 删除用户（同时从users.json和htpasswd删除）
	async deleteUser(username) {
		try {
			const usersData = await this.readUsers()
			const userIndex = usersData.users.findIndex(
				(u) => u.username === username,
			)

			if (userIndex === -1) {
				throw new Error("用户不存在")
			}

			// 从users.json删除
			usersData.users.splice(userIndex, 1)
			await this.saveUsers(usersData)

			// 从htpasswd删除
			await this.removeUserFromHtpasswd(username)

			console.log(`用户删除成功: ${username}`)
			return { success: true }
		} catch (error) {
			console.error("删除用户失败:", error)
			return { success: false, error: error.message }
		}
	}
	// 修改密码（同时更新users.json和htpasswd）
	async changePassword(username, newPassword) {
		try {
			const usersData = await this.readUsers()
			const user = usersData.users.find((u) => u.username === username)

			if (!user) {
				throw new Error("用户不存在")
			}

			// 更新users.json中的密码
			user.password = await hashPasswordBcrypt(newPassword)
			await this.saveUsers(usersData)

			// 同步到htpasswd
			await this.syncUserToHtpasswd(username, newPassword)

			console.log(`密码修改成功: ${username}`)
			return { success: true }
		} catch (error) {
			console.error("修改密码失败:", error)
			return { success: false, error: error.message }
		}
	}

	// 更新用户角色（同时更新默认NPM权限）
	async updateUserRole(username, newRole) {
		try {
			const usersData = await this.readUsers()
			const user = usersData.users.find((u) => u.username === username)

			if (!user) {
				throw new Error("用户不存在")
			}

			const oldRole = user.role
			user.role = newRole

			// 如果角色发生变化，更新默认NPM权限
			if (oldRole !== newRole) {
				const defaultPermissions =
					this.getDefaultNPMPermissions(newRole)
				user.npmPermissions = {
					...user.npmPermissions,
					...defaultPermissions,
				}
			}

			await this.saveUsers(usersData)

			console.log(
				`用户角色更新成功: ${username} ${oldRole} -> ${newRole}`,
			)
			return { success: true, user }
		} catch (error) {
			console.error("更新用户角色失败:", error)
			return { success: false, error: error.message }
		}
	}

	// 更新用户NPM权限
	async updateUserNPMPermissions(username, npmPermissions) {
		try {
			const usersData = await this.readUsers()
			const user = usersData.users.find((u) => u.username === username)

			if (!user) {
				throw new Error("用户不存在")
			}

			user.npmPermissions = {
				...user.npmPermissions,
				...npmPermissions,
			}

			await this.saveUsers(usersData)

			console.log(`NPM权限更新成功: ${username}`)
			return { success: true, user }
		} catch (error) {
			console.error("更新NPM权限失败:", error)
			return { success: false, error: error.message }
		}
	}
}

module.exports = new UnifiedAuth()
