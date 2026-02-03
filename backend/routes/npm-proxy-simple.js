const express = require("express")
const { authenticateJWT } = require("../utils/jwt-utils")
const { logOperation } = require("../utils/operation-logger")
const npmPermission = require("../utils/npm-permission")
const { authenticateUser } = require("../utils/auth-utils")
const axios = require("axios")

const router = express.Router()

// Verdaccio 服务地址
const VERDACCIO_URL = "http://127.0.0.1:4873"

// NPM 包列表 API（用于管理界面）- 需要NPM登录权限
router.get("/packages", authenticateJWT, async (req, res) => {
	try {
		// 检查用户是否有NPM登录权限
		const canLogin = await npmPermission.canLogin(req.user.username)
		if (!canLogin) {
			return res.status(403).json({
				code: 403,
				msg: "您没有访问NPM仓库的权限，请联系管理员",
			})
		}

		console.log("📦 获取 NPM 包列表请求")

		const fs = require("fs-extra")
		const path = require("path")

		const storageDir = path.join(__dirname, "../verdaccio-storage")
		const dbPath = path.join(storageDir, ".verdaccio-db.json")

		const packages = []

		// 只根据 Verdaccio 的索引文件返回「本私服真正存在的包」
		if (!fs.existsSync(dbPath)) {
			console.log("⚠️ 索引文件不存在，返回空列表")
			return res.json({ code: 200, data: [] })
		}

		let db
		try {
			db = fs.readJsonSync(dbPath)
		} catch (e) {
			console.error("❌ 读取 Verdaccio 索引文件失败:", e)
			return res.json({
				code: 500,
				msg: "读取包索引失败",
				error: e.message,
			})
		}

		const packageNames = Array.isArray(db.list) ? db.list : []

		for (const packageName of packageNames) {
			const primaryPath = path.join(
				storageDir,
				...packageName.split("/"),
				"package.json",
			)
			const legacyPath = path.join(
				storageDir,
				"packages",
				packageName,
				"package.json",
			)

			const packageJsonPath = fs.existsSync(primaryPath)
				? primaryPath
				: legacyPath

			if (!fs.existsSync(packageJsonPath)) {
				continue
			}

			try {
				const packageData = fs.readJsonSync(packageJsonPath)
				const versions = Object.keys(packageData.versions || {})
				if (!versions.length) continue

				const latestVersion =
					packageData["dist-tags"]?.latest ||
					versions[versions.length - 1]
				const latestVersionData =
					packageData.versions?.[latestVersion] || {}

				const publishTime =
					latestVersionData._publishedAt ||
					(packageData.time && packageData.time[latestVersion]) ||
					"未知"

				packages.push({
					name: packageData.name || packageName,
					description:
						latestVersionData.description ||
						packageData.description ||
						"",
					version: latestVersion || "未知",
					author:
						latestVersionData.author ||
						packageData.author ||
						"未知",
					publishTime,
					versions,
					keywords: latestVersionData.keywords || [],
					license: latestVersionData.license || "MIT",
				})
			} catch (error) {
				console.error(`❌ 解析包信息失败: ${packageName}`, error)
			}
		}

		// 按发布时间排序
		packages.sort((a, b) => {
			if (a.publishTime === "未知") return 1
			if (b.publishTime === "未知") return -1
			return new Date(b.publishTime) - new Date(a.publishTime)
		})

		res.json({ code: 200, data: packages })
	} catch (error) {
		console.error("❌ 获取 NPM 包列表失败:", error)
		res.json({ code: 500, msg: "获取包列表失败", error: error.message })
	}
})

// 获取包详情 - 需要NPM登录权限
router.get("/package/:packageName", authenticateJWT, async (req, res) => {
	try {
		// 检查用户是否有NPM登录权限
		const canLogin = await npmPermission.canLogin(req.user.username)
		if (!canLogin) {
			return res.status(403).json({
				code: 403,
				msg: "您没有访问NPM仓库的权限，请联系管理员",
			})
		}

		const { packageName } = req.params
		const fs = require("fs-extra")
		const path = require("path")

		console.log(`📦 获取包详情: ${packageName}`)

		// 从本地存储读取包信息（优先 Verdaccio 根目录，其次兼容旧的 packages 子目录）
		const storageDir = path.join(__dirname, "../verdaccio-storage")
		const primaryPath = path.join(
			storageDir,
			...packageName.split("/"),
			"package.json",
		)
		const legacyPath = path.join(
			storageDir,
			"packages",
			packageName,
			"package.json",
		)

		const packagePath = fs.existsSync(primaryPath)
			? primaryPath
			: legacyPath

		if (!fs.existsSync(packagePath)) {
			return res.json({ code: 404, msg: "包不存在" })
		}

		const packageData = fs.readJsonSync(packagePath)

		// 获取最新版本信息（发布时间与 Verdaccio UI 保持一致）
		const versions = Object.keys(packageData.versions || {})
		const latestVersion =
			packageData["dist-tags"]?.latest || versions[versions.length - 1]
		const latestVersionData = packageData.versions?.[latestVersion] || {}

		const publishTime =
			latestVersionData._publishedAt ||
			(packageData.time && packageData.time[latestVersion]) ||
			"未知"

		const result = {
			name: packageData.name || packageName,
			description:
				latestVersionData.description || packageData.description || "",
			version: latestVersion || "未知",
			author: latestVersionData.author || packageData.author || "未知",
			publishTime,
			versions: versions,
			keywords: latestVersionData?.keywords || [],
			license: latestVersionData?.license || "MIT",
			dependencies: latestVersionData?.dependencies || {},
			devDependencies: latestVersionData?.devDependencies || {},
			homepage: latestVersionData?.homepage || packageData.homepage,
			repository: latestVersionData?.repository || packageData.repository,
		}

		res.json({ code: 200, data: result })
	} catch (error) {
		console.error("获取包详情失败:", error)
		res.json({ code: 500, msg: "获取包详情失败", error: error.message })
	}
})

// 获取包的README（通过 Verdaccio 内置 API，保证内容与 Verdaccio Web UI 一致）
router.get(
	"/package/:packageName/readme",
	authenticateJWT,
	async (req, res) => {
		try {
			const { packageName } = req.params

			console.log(`📖 获取包README: ${packageName}`)

			const url = `${VERDACCIO_URL}/-/verdaccio/data/package/readme/${encodeURIComponent(
				packageName,
			)}`

			const response = await axios.get(url, {
				timeout: 5000,
			})

			// Verdaccio 这里直接返回 markdown 字符串
			res.json({ code: 200, data: response.data || "" })
		} catch (error) {
			console.error("获取README失败:", error.message || error)

			// Verdaccio 未返回 README 时，返回空字符串而不是报错，让前端友好展示
			if (error.response && error.response.status === 404) {
				return res.json({ code: 200, data: "" })
			}

			res.json({ code: 500, msg: "获取README失败", error: error.message })
		}
	},
)

// 获取包的版本历史
router.get(
	"/package/:packageName/versions",
	authenticateJWT,
	async (req, res) => {
		try {
			const { packageName } = req.params
			const fs = require("fs-extra")
			const path = require("path")

			console.log(`📋 获取包版本历史: ${packageName}`)

			const storageDir = path.join(__dirname, "../verdaccio-storage")
			const primaryPath = path.join(
				storageDir,
				...packageName.split("/"),
				"package.json",
			)
			const legacyPath = path.join(
				storageDir,
				"packages",
				packageName,
				"package.json",
			)

			const packagePath = fs.existsSync(primaryPath)
				? primaryPath
				: legacyPath

			if (!fs.existsSync(packagePath)) {
				return res.json({ code: 404, msg: "包不存在" })
			}

			const packageData = fs.readJsonSync(packagePath)
			const versions = []

			// 遍历所有版本，发布时间与 Verdaccio UI 保持一致
			for (const [version, versionData] of Object.entries(
				packageData.versions || {},
			)) {
				const publishTime =
					versionData._publishedAt ||
					(packageData.time && packageData.time[version]) ||
					"未知"

				versions.push({
					version: version,
					publishTime,
					description: versionData.description || "",
					author: versionData.author || "未知",
				})
			}

			// 按版本号排序（最新的在前面）
			versions.sort((a, b) => {
				if (a.publishTime === "未知") return 1
				if (b.publishTime === "未知") return -1
				return (
					new Date(b.publishTime).getTime() -
					new Date(a.publishTime).getTime()
				)
			})

			res.json({ code: 200, data: versions })
		} catch (error) {
			console.error("获取版本历史失败:", error)
			res.json({
				code: 500,
				msg: "获取版本历史失败",
				error: error.message,
			})
		}
	},
)

// 删除包 - 需要NPM管理权限
router.delete("/package/:packageName", authenticateJWT, async (req, res) => {
	try {
		const { packageName } = req.params

		// 检查用户是否有NPM管理权限
		const canManage = await npmPermission.canManage(
			req.user.username,
			packageName,
		)
		if (!canManage) {
			return res.status(403).json({
				code: 403,
				msg: "您没有删除此包的权限",
			})
		}

		const fs = require("fs-extra")
		const path = require("path")

		console.log(`🗑️ 删除包: ${packageName}`)

		// 删除本地存储的包文件（优先 Verdaccio 根目录，其次兼容旧的 packages 子目录）
		const storageDir = path.join(__dirname, "../verdaccio-storage")
		const primaryPath = path.join(storageDir, ...packageName.split("/"))
		const legacyPath = path.join(storageDir, "packages", packageName)

		const packagePath = fs.existsSync(primaryPath)
			? primaryPath
			: legacyPath

		if (fs.existsSync(packagePath)) {
			// 删除包目录
			fs.removeSync(packagePath)

			// 从 Verdaccio 索引文件中移除包
			const dbPath = path.join(storageDir, ".verdaccio-db.json")
			if (fs.existsSync(dbPath)) {
				try {
					const db = fs.readJsonSync(dbPath)
					if (Array.isArray(db.list)) {
						const index = db.list.indexOf(packageName)
						if (index > -1) {
							db.list.splice(index, 1)
							fs.writeJsonSync(dbPath, db, { spaces: 2 })
							console.log(`✅ 从索引中移除包: ${packageName}`)
						}
					}
				} catch (error) {
					console.error("❌ 更新索引文件失败:", error)
				}
			}

			// 记录操作日志
			logOperation(
				req.user.username,
				"npm_unpublish",
				packageName,
				"删除 NPM 包",
			)

			console.log(`✅ 包删除成功: ${packageName}`)
			res.json({ code: 200, msg: "包删除成功" })
		} else {
			console.log(`⚠️ 包不存在: ${packageName}`)
			res.json({ code: 404, msg: "包不存在" })
		}
	} catch (error) {
		console.error("❌ 删除包失败:", error)
		res.json({ code: 500, msg: "删除包失败", error: error.message })
	}
})
router.get("/status", authenticateJWT, async (req, res) => {
	try {
		// 尝试访问 Verdaccio
		await axios.get(`${VERDACCIO_URL}/-/ping`, { timeout: 5000 })

		res.json({
			code: 200,
			data: {
				status: "running",
				url: VERDACCIO_URL,
				message: "Verdaccio 服务正常运行",
			},
		})
	} catch (error) {
		res.json({
			code: 500,
			data: {
				status: "stopped",
				url: VERDACCIO_URL,
				message: "Verdaccio 服务未运行或无法访问",
			},
		})
	}
})

// NPM登录专用路由 - 使用我们自己的认证系统
router.put(/^\/\-\/user\/.*/, async (req, res) => {
	try {
		const fullPath = req.path
		console.log(`🔐 NPM登录请求`)
		console.log(`📝 完整路径: ${fullPath}`)

		// 检查是否是登录请求
		if (req.body && req.body.name && req.body.password) {
			const username = req.body.name
			const password = req.body.password

			console.log(`🔍 验证用户: ${username}`)

			// 使用我们的认证系统验证用户
			const user = authenticateUser(username, password)

			if (!user) {
				console.log(`❌ 用户认证失败: ${username}`)
				return res.status(401).json({
					error: "unauthorized access",
				})
			}

			console.log(`✅ 用户认证成功: ${username}`)

			// 检查用户是否有NPM登录权限
			const canLogin = await npmPermission.canLogin(username)
			if (!canLogin) {
				console.log(`❌ 用户 ${username} 没有NPM登录权限`)
				return res.status(403).json({
					error: "您没有访问NPM仓库的权限，请联系管理员",
				})
			}

			console.log(`✅ 用户 ${username} 有NPM登录权限`)

			// 返回成功响应（模拟verdaccio的响应格式）
			const response = {
				ok: true,
				id: req.body._id,
				rev: "1-" + Date.now(),
				token: Buffer.from(`${username}:${password}`).toString(
					"base64",
				),
			}

			console.log(`📝 返回成功响应`)
			return res.status(201).json(response)
		}

		// 如果不是标准的登录请求，转发给verdaccio
		console.log(`🔄 转发非登录请求到verdaccio`)
		const response = await axios.put(
			`${VERDACCIO_URL}${fullPath}`,
			req.body,
			{
				headers: {
					...req.headers,
					host: undefined,
				},
				timeout: 30000,
			},
		)

		console.log(`✅ 请求转发成功`)
		res.status(response.status).json(response.data)
	} catch (error) {
		console.error("❌ NPM请求失败:", error.message)
		if (error.response) {
			console.error("❌ 错误状态:", error.response.status)
			console.error("❌ 错误响应:", error.response.data)
			res.status(error.response.status).json(error.response.data)
		} else {
			res.status(500).json({ error: "请求失败" })
		}
	}
})

// NPM登出专用路由
router.delete(/^\/\-\/user\/token\/.*/, async (req, res) => {
	try {
		console.log(`🚪 NPM登出请求`)
		console.log(`✅ NPM登出成功`)

		res.status(200).json({
			ok: true,
			message: "Logged out successfully",
		})
	} catch (error) {
		console.error("❌ NPM登出失败:", error.message)
		res.status(500).json({ error: "登出请求失败" })
	}
})

// 直接处理所有其他NPM请求
router.use("/", async (req, res) => {
	try {
		console.log(`🔄 处理NPM请求: ${req.method} ${req.originalUrl}`)

		// 检查是否需要权限验证
		const needsPermissionCheck =
			(req.method === "PUT" && !req.path.includes("/-/user/")) || // publish (但排除用户登录)
			(req.method === "DELETE" && !req.path.includes("/-/user/token/")) // unpublish (但排除用户登出)

		if (needsPermissionCheck) {
			console.log(`🔐 执行权限检查`)

			const authHeader = req.headers.authorization
			if (!authHeader) {
				return res.status(401).json({ error: "NPM认证失败" })
			}

			let username, password
			if (authHeader.startsWith("Bearer ")) {
				const token = authHeader.split(" ")[1]
				try {
					const credentials = Buffer.from(token, "base64").toString(
						"ascii",
					)
					const parts = credentials.split(":")
					if (parts.length >= 2) {
						username = parts[0]
						password = parts.slice(1).join(":")
					} else {
						return res.status(401).json({ error: "NPM认证失败" })
					}
				} catch (error) {
					return res.status(401).json({ error: "NPM认证失败" })
				}
			} else if (authHeader.startsWith("Basic ")) {
				const base64Credentials = authHeader.split(" ")[1]
				const credentials = Buffer.from(
					base64Credentials,
					"base64",
				).toString("ascii")
				const parts = credentials.split(":")
				if (parts.length >= 2) {
					username = parts[0]
					password = parts.slice(1).join(":")
				} else {
					return res.status(401).json({ error: "NPM认证失败" })
				}
			} else {
				return res.status(401).json({ error: "NPM认证失败" })
			}

			// 验证用户凭据
			const user = authenticateUser(username, password)
			if (!user) {
				console.log(`❌ 用户认证失败: ${username}`)
				return res.status(401).json({ error: "NPM认证失败" })
			}

			// 检查NPM权限
			const canLogin = await npmPermission.canLogin(username)
			if (!canLogin) {
				console.log(`❌ 用户 ${username} 没有NPM登录权限`)
				return res.status(403).json({
					error: "您没有访问NPM仓库的权限，请联系管理员",
				})
			}

			console.log(`✅ 用户 ${username} 权限检查通过`)
		}

		// 构建转发URL
		const targetUrl = `${VERDACCIO_URL}${req.originalUrl.replace("/api/npm", "")}`
		console.log(`📤 转发到: ${targetUrl}`)

		// 准备请求头（移除认证头，因为verdaccio配置为允许匿名发布）
		const headers = { ...req.headers }
		delete headers.authorization
		delete headers.host
		delete headers["content-length"] // 让axios自动计算

		// 使用axios直接转发请求
		const axiosConfig = {
			method: req.method.toLowerCase(),
			url: targetUrl,
			headers,
			timeout: 120000, // 2分钟超时
			maxContentLength: 50 * 1024 * 1024, // 50MB
			maxBodyLength: 50 * 1024 * 1024, // 50MB
		}

		// 对于有body的请求，添加数据
		if (
			req.method === "PUT" ||
			req.method === "POST" ||
			req.method === "PATCH"
		) {
			axiosConfig.data = req.body
		}

		console.log(`📋 请求配置:`, {
			method: axiosConfig.method,
			url: axiosConfig.url,
			hasData: !!axiosConfig.data,
			timeout: axiosConfig.timeout,
		})

		const response = await axios(axiosConfig)

		console.log(`✅ 请求成功: ${response.status}`)
		res.status(response.status).json(response.data)
	} catch (error) {
		console.error("❌ NPM请求失败:", error.message)
		if (error.response) {
			console.error("❌ 错误状态:", error.response.status)
			console.error("❌ 错误响应:", error.response.data)
			res.status(error.response.status).json(error.response.data)
		} else {
			console.error("❌ 网络错误:", error.code)
			res.status(500).json({
				error: "NPM服务请求失败",
				message: error.message,
				code: error.code,
			})
		}
	}
})

module.exports = router
