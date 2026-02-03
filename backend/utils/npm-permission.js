const unifiedAuth = require("./unified-auth")

class NPMPermission {
	// 检查用户是否有NPM登录权限
	async canLogin(username) {
		try {
			const usersData = await unifiedAuth.readUsers()
			const user = usersData.users.find((u) => u.username === username)

			if (!user || !user.npmPermissions) {
				return false
			}

			return user.npmPermissions.canLogin === true
		} catch (error) {
			console.error("检查NPM登录权限失败:", error)
			return false
		}
	}

	// 检查用户是否有发布权限
	async canPublish(username, packageName) {
		try {
			const usersData = await unifiedAuth.readUsers()
			const user = usersData.users.find((u) => u.username === username)

			if (!user || !user.npmPermissions) {
				return false
			}

			// 检查基本发布权限
			if (!user.npmPermissions.canPublish) {
				return false
			}

			// 检查包名权限
			return this.checkPackagePermission(
				user.npmPermissions.allowedPackages,
				packageName,
			)
		} catch (error) {
			console.error("检查NPM发布权限失败:", error)
			return false
		}
	}

	// 检查用户是否有管理权限（删除、废弃包等）
	async canManage(username, packageName) {
		try {
			const usersData = await unifiedAuth.readUsers()
			const user = usersData.users.find((u) => u.username === username)

			if (!user || !user.npmPermissions) {
				return false
			}

			// 只有管理员和超管才有管理权限
			if (!user.npmPermissions.canManage) {
				return false
			}

			// 检查包名权限
			return this.checkPackagePermission(
				user.npmPermissions.allowedPackages,
				packageName,
			)
		} catch (error) {
			console.error("检查NPM管理权限失败:", error)
			return false
		}
	}

	// 检查包名是否在允许列表中
	checkPackagePermission(allowedPackages, packageName) {
		if (!allowedPackages || allowedPackages.length === 0) {
			return false
		}

		// 如果包含通配符 '*'，表示允许所有包
		if (allowedPackages.includes("*")) {
			return true
		}

		// 精确匹配包名
		return allowedPackages.includes(packageName)
	}

	// 获取用户的NPM权限信息
	async getUserNPMPermissions(username) {
		try {
			const usersData = await unifiedAuth.readUsers()
			const user = usersData.users.find((u) => u.username === username)

			if (!user) {
				return null
			}

			return (
				user.npmPermissions ||
				unifiedAuth.getDefaultNPMPermissions(user.role)
			)
		} catch (error) {
			console.error("获取用户NPM权限失败:", error)
			return null
		}
	}
}

module.exports = new NPMPermission()
