const express = require("express")
const router = express.Router()
const gitUtils = require("../utils/git-utils")
const fs = require("fs-extra")
const path = require("path")
const configManager = require("../utils/config-manager")
const {
	authenticateJWT,
	requireSuperAdmin,
	requireAdmin,
} = require("../utils/jwt-utils")
const { initRepoWhitelist } = require("../utils/repo-permission")
const { logOperation } = require("../utils/operation-logger")
const authUtils = require("../utils/auth-utils")

// 配置文件路径
const REPO_CONFIG_PATH = path.join(__dirname, "../config/repo-config.json")

// 0. 获取服务器配置信息
router.get("/config", (req, res) => {
	res.json({
		code: 200,
		data: {
			serverUrl: configManager.getServerUrl(),
			defaultRepoPath: configManager.get("git.defaultRepoPath"),
			serverIP: configManager.get("server.host"),
			serverPort: configManager.get("server.port"),
		},
	})
})

// 0.5 保存服务器配置（仅超管）
router.post("/config", authenticateJWT, requireSuperAdmin, (req, res) => {
	try {
		const { serverIP, serverPort, defaultRepoPath } = req.body

		console.log("保存配置请求:", { serverIP, serverPort, defaultRepoPath })

		// 验证参数
		if (!serverIP || !serverPort) {
			return res.json({ code: 400, msg: "服务器IP和端口不能为空" })
		}

		// 构建新配置（不允许修改 defaultRepoPath，避免数据丢失风险）
		const newConfig = {
			server: {
				host: serverIP,
				port: parseInt(serverPort),
				timeout: configManager.get("server.timeout"),
			},
			frontend: {
				host: configManager.get("frontend.host"),
				port: configManager.get("frontend.port"),
			},
			git: {
				// 保持原有的 defaultRepoPath，不允许修改
				defaultRepoPath: configManager.get("git.defaultRepoPath"),
			},
			deployment: {
				mode: configManager.get("deployment.mode"),
			},
		}

		// 保存配置
		const success = configManager.saveConfig(newConfig)

		if (success) {
			// 记录操作日志
			logOperation(
				req.user.username,
				"update_config",
				"系统配置",
				`服务器: ${serverIP}:${serverPort}`,
			)

			res.json({
				code: 200,
				msg: "配置保存成功，需要重启服务器后生效",
				data: newConfig,
			})
		} else {
			res.json({ code: 500, msg: "配置保存失败" })
		}
	} catch (error) {
		console.error("保存配置失败:", error)
		res.json({ code: 500, msg: `保存配置失败：${error.message}` })
	}
})

// 1. 获取所有仓库列表（含路径信息）
router.get("/list", (req, res) => {
	const config = fs.readJsonSync(REPO_CONFIG_PATH)
	res.json({ code: 200, data: config.repoList })
})

// 2. 创建新仓库（超管和管理员）
router.post("/create", authenticateJWT, requireAdmin, (req, res) => {
	const { repoName, desc } = req.body

	console.log("创建仓库请求:", { repoName, desc, creator: req.user.username })

	// 验证必需参数
	if (!repoName || !repoName.trim()) {
		return res.json({ code: 400, msg: "仓库名称不能为空" })
	}

	if (!desc || !desc.trim()) {
		return res.json({ code: 400, msg: "仓库描述不能为空" })
	}

	// 验证仓库名称格式（只允许字母、数字、下划线和横线）
	if (!/^[a-zA-Z0-9_-]+$/.test(repoName)) {
		return res.json({
			code: 400,
			msg: "仓库名称只能包含字母、数字、下划线和横线",
		})
	}

	const config = fs.readJsonSync(REPO_CONFIG_PATH)

	// 检查仓库是否已存在
	if (!config.repoList || !Array.isArray(config.repoList)) {
		config.repoList = []
	}
	const exists = config.repoList.some((repo) => repo.repoName === repoName)
	if (exists) return res.json({ code: 400, msg: "仓库已存在" })

	// 使用默认路径：项目根目录/repos/仓库名（不再允许自定义路径）
	const defaultRepoDir = configManager.get("git.defaultRepoPath")
	// 如果是相对路径，相对于项目根目录解析（backend 的上一级）
	const reposDir = path.isAbsolute(defaultRepoDir)
		? defaultRepoDir
		: path.resolve(__dirname, "../..", defaultRepoDir)
	const finalRepoPath = path.join(reposDir, repoName)

	// 确保repos目录存在
	fs.ensureDirSync(reposDir)

	console.log("最终仓库路径:", finalRepoPath)

	// 执行创建命令
	const result = gitUtils.createRepo(finalRepoPath)
	if (!result.success) {
		console.error("创建仓库失败:", result.error)
		return res.json({ code: 500, msg: result.error })
	}

	console.log("Git仓库创建成功")

	// 更新配置文件
	config.repoList.push({
		repoName,
		repoPath: finalRepoPath,
		desc,
		creator: req.user.username, // 记录创建者
		whitelist: [], // 初始化白名单为空（所有人可见）
	})
	fs.writeJsonSync(REPO_CONFIG_PATH, config, { spaces: 2 })

	console.log("配置文件已更新")

	// 初始化仓库权限
	try {
		initRepoWhitelist(repoName)
		console.log("仓库权限初始化成功")
	} catch (error) {
		console.warn("初始化仓库权限失败:", error)
	}

	// 记录操作日志
	logOperation(
		req.user.username,
		"create_repo",
		repoName,
		`创建仓库，路径: ${finalRepoPath}`,
	)

	// 构建Git服务URL
	const gitUrl = configManager.getGitUrl(repoName)

	console.log("仓库创建完成:", { repoName, finalRepoPath, gitUrl })

	res.json({
		code: 200,
		msg: "仓库创建成功",
		data: {
			repoName,
			repoPath: finalRepoPath,
			gitUrl,
		},
	})
})

// 2.5 删除仓库（超管和管理员）
router.delete(
	"/delete/:repoName",
	authenticateJWT,
	requireAdmin,
	(req, res) => {
		try {
			const { repoName } = req.params
			const { password } = req.body

			// 验证密码
			if (!password) {
				return res.json({ code: 400, msg: "请输入管理员密码" })
			}

			// 获取当前用户信息并验证密码
			const {
				findUserByUsername,
				verifyPassword,
			} = require("../utils/auth-utils")
			const currentUser = findUserByUsername(req.user.username)

			if (!currentUser) {
				return res.json({ code: 401, msg: "用户不存在" })
			}

			if (!verifyPassword(password, currentUser.password)) {
				return res.json({ code: 401, msg: "密码错误" })
			}

			const config = fs.readJsonSync(REPO_CONFIG_PATH)

			// 查找仓库
			if (!config.repoList || !Array.isArray(config.repoList)) {
				return res.json({ code: 404, msg: "仓库配置异常" })
			}
			const repoIndex = config.repoList.findIndex(
				(repo) => repo.repoName === repoName,
			)

			if (repoIndex === -1) {
				return res.json({ code: 404, msg: "仓库不存在" })
			}

			const repo = config.repoList[repoIndex]
			const repoPath = repo.repoPath

			// 权限检查：管理员只能删除自己创建的仓库，超管可以删除所有仓库
			if (req.user.role === "admin") {
				if (repo.creator !== req.user.username) {
					return res.json({
						code: 403,
						msg: "您只能删除自己创建的仓库",
					})
				}
			}

			console.log(
				`删除仓库: ${repoName}, 路径: ${repoPath}, 操作者: ${req.user.username}, 创建者: ${repo.creator}`,
			)

			// 删除仓库文件夹
			if (fs.existsSync(repoPath)) {
				fs.removeSync(repoPath)
				console.log(`仓库文件夹已删除: ${repoPath}`)
			}

			// 从配置中移除
			config.repoList.splice(repoIndex, 1)
			fs.writeJsonSync(REPO_CONFIG_PATH, config, { spaces: 2 })

			console.log(`仓库配置已更新，${repoName} 已从列表中移除`)

			// 记录操作日志
			logOperation(
				req.user.username,
				"delete_repo",
				repoName,
				`删除仓库，路径: ${repoPath}, 创建者: ${repo.creator || "未知"}`,
			)

			res.json({
				code: 200,
				msg: "仓库删除成功",
				data: {
					repoName,
					repoPath,
				},
			})
		} catch (error) {
			console.error("删除仓库失败:", error)
			res.json({ code: 500, msg: `删除仓库失败：${error.message}` })
		}
	},
)

// 3. 修改仓库存储路径（核心！实现地址自定义切换）
router.post("/update-path", authenticateJWT, requireSuperAdmin, (req, res) => {
	const { repoName, newPath } = req.body
	const config = fs.readJsonSync(REPO_CONFIG_PATH)
	if (!config.repoList || !Array.isArray(config.repoList)) {
		return res.json({ code: 400, msg: "仓库配置异常" })
	}
	const repoIndex = config.repoList.findIndex(
		(repo) => repo.repoName === repoName,
	)

	if (repoIndex === -1) return res.json({ code: 400, msg: "仓库不存在" })

	try {
		// 1. 复制原仓库文件到新路径
		const oldPath = config.repoList[repoIndex].repoPath
		fs.copySync(oldPath, newPath)

		// 2. 更新配置文件中的路径
		config.repoList[repoIndex].repoPath = newPath
		fs.writeJsonSync(REPO_CONFIG_PATH, config, { spaces: 2 })

		// 记录操作日志
		logOperation(
			req.user.username,
			"update_repo_path",
			repoName,
			`修改仓库路径: ${oldPath} -> ${newPath}`,
		)

		res.json({ code: 200, msg: "路径修改成功" })
	} catch (error) {
		res.json({ code: 500, msg: `路径修改失败：${error.message}` })
	}
})

// 4. 获取仓库提交记录
router.get("/log", (req, res) => {
	const repoPath = String(req.query.repoPath || "")
	const result = gitUtils.getCommitLog(repoPath)
	res.json({ code: 200, data: result })
})

// 5. 获取仓库文件列表
router.get("/files", (req, res) => {
	const repoPath = String(req.query.repoPath || "")
	const result = gitUtils.getRepoFiles(repoPath)
	res.json({ code: 200, data: result })
})

// 6. 检查仓库状态
router.get("/status", (req, res) => {
	const repoPath = String(req.query.repoPath || "")

	if (!repoPath) {
		return res.json({
			code: 400,
			msg: "缺少仓库路径参数",
		})
	}

	try {
		const exists = fs.existsSync(repoPath)

		if (!exists) {
			return res.json({
				code: 200,
				data: {
					exists: false,
					isBare: false,
					path: repoPath,
				},
			})
		}

		const isBare = gitUtils.isBareRepo(repoPath)

		res.json({
			code: 200,
			data: {
				exists,
				isBare,
				path: repoPath,
			},
		})
	} catch (error) {
		console.error("检查仓库状态失败:", error)
		res.status(500).json({
			code: 500,
			msg: `检查失败：${error.message}`,
			error: error.stack,
		})
	}
})

// 获取仓库文件内容
router.get("/file-content", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")
		const filePath = String(req.query.filePath || "")

		if (!repoPath || !filePath) {
			return res.status(400).json({
				code: 400,
				msg: "缺少必要参数",
			})
		}

		// 检查仓库是否存在
		if (!fs.existsSync(repoPath)) {
			return res.status(404).json({
				code: 404,
				msg: "仓库不存在",
			})
		}

		// 使用git show命令获取文件内容，先尝试main分支，再尝试master分支
		const { spawn } = require("child_process")

		return new Promise((resolve) => {
			// 先尝试main分支
			const tryGetFile = (branch) => {
				const gitProcess = spawn(
					"git",
					["show", `${branch}:${filePath}`],
					{
						cwd: repoPath,
						stdio: ["pipe", "pipe", "pipe"],
					},
				)

				let stdout = ""
				let stderr = ""

				gitProcess.stdout.on("data", (data) => {
					stdout += data.toString()
				})

				gitProcess.stderr.on("data", (data) => {
					stderr += data.toString()
				})

				gitProcess.on("close", (code) => {
					if (code === 0) {
						res.json({
							code: 200,
							data: {
								content: stdout,
								filePath: filePath,
							},
						})
						resolve()
					} else if (branch === "main") {
						// main分支失败，尝试master分支
						tryGetFile("master")
					} else {
						// 两个分支都失败
						res.json({
							code: 404,
							msg: "文件不存在或仓库为空",
							error: stderr,
						})
						resolve()
					}
				})

				gitProcess.on("error", (error) => {
					res.status(500).json({
						code: 500,
						msg: "Git操作失败",
						error: error.message,
					})
					resolve()
				})
			}

			tryGetFile("main")
		})
	} catch (error) {
		console.error("获取文件内容失败:", error)
		res.status(500).json({
			code: 500,
			msg: "获取文件内容失败",
			error: error.message,
		})
	}
})

// 获取仓库文件列表
router.get("/file-list", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")
		const dirPath = String(req.query.path || "")

		if (!repoPath) {
			return res.status(400).json({
				code: 400,
				msg: "缺少仓库路径参数",
			})
		}

		// 检查仓库是否存在
		if (!fs.existsSync(repoPath)) {
			return res.status(404).json({
				code: 404,
				msg: "仓库不存在",
			})
		}

		// 使用git ls-tree命令获取文件列表
		const { spawn } = require("child_process")

		return new Promise((resolve) => {
			// 先尝试main分支，再尝试master分支
			const tryListFiles = (branch) => {
				const gitProcess = spawn(
					"git",
					["ls-tree", "-l", branch, dirPath],
					{
						cwd: repoPath,
						stdio: ["pipe", "pipe", "pipe"],
					},
				)

				let stdout = ""
				let stderr = ""

				gitProcess.stdout.on("data", (data) => {
					stdout += data.toString()
				})

				gitProcess.stderr.on("data", (data) => {
					stderr += data.toString()
				})

				gitProcess.on("close", (code) => {
					if (code === 0) {
						// 解析git ls-tree输出
						const files = stdout
							.trim()
							.split("\n")
							.filter((line) => line.trim())
							.map((line) => {
								const parts = line.split(/\s+/)
								const mode = parts[0]
								const type = parts[1]
								const hash = parts[2]
								const size =
									parts[3] === "-" ? null : parseInt(parts[3])
								const name = parts.slice(4).join(" ")

								return {
									name,
									type:
										type === "tree" ? "directory" : "file",
									mode,
									hash,
									size,
									path: dirPath ? `${dirPath}/${name}` : name,
								}
							})
							// 排序：文件夹在前，文件在后，同类型按名称排序
							.sort((a, b) => {
								// 先按类型排序（directory < file）
								if (a.type !== b.type) {
									return a.type === "directory" ? -1 : 1
								}
								// 同类型按名称排序
								return a.name.localeCompare(b.name)
							})

						res.json({
							code: 200,
							data: files,
						})
						resolve()
					} else if (branch === "main") {
						// main分支失败，尝试master分支
						tryListFiles("master")
					} else {
						// 两个分支都失败
						res.json({
							code: 404,
							msg: "目录不存在或仓库为空",
							error: stderr,
						})
						resolve()
					}
				})

				gitProcess.on("error", (error) => {
					res.status(500).json({
						code: 500,
						msg: "Git操作失败",
						error: error.message,
					})
					resolve()
				})
			}

			tryListFiles("main")
		})
	} catch (error) {
		console.error("获取文件列表失败:", error)
		res.status(500).json({
			code: 500,
			msg: "获取文件列表失败",
			error: error.message,
		})
	}
})

// 获取仓库最新提交信息
router.get("/latest-commit", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")

		if (!repoPath) {
			return res.status(400).json({
				code: 400,
				msg: "缺少仓库路径参数",
			})
		}

		// 检查仓库是否存在
		if (!fs.existsSync(repoPath)) {
			return res.status(404).json({
				code: 404,
				msg: "仓库不存在",
			})
		}

		const { spawn } = require("child_process")

		// 获取仓库名称（用于查找操作日志）
		const config = fs.readJsonSync(REPO_CONFIG_PATH)
		const repo = config.repoList.find((r) => r.repoPath === repoPath)
		const repoName = repo ? repo.repoName : null

		return new Promise((resolve) => {
			// 先尝试main分支，再尝试master分支
			const tryGetCommit = (branch) => {
				const gitProcess = spawn(
					"git",
					[
						"log",
						"-1",
						"--format=%H|%an|%ae|%ad|%s|%ct",
						"--date=iso",
						branch,
					],
					{
						cwd: repoPath,
						stdio: ["pipe", "pipe", "pipe"],
					},
				)

				let stdout = ""
				let stderr = ""

				gitProcess.stdout.on("data", (data) => {
					stdout += data.toString()
				})

				gitProcess.stderr.on("data", (data) => {
					stderr += data.toString()
				})

				gitProcess.on("close", async (code) => {
					if (code === 0 && stdout.trim()) {
						const commitInfo = stdout.trim().split("|")
						if (commitInfo.length >= 6) {
							const commitHash = commitInfo[0]
							const gitAuthor = commitInfo[1]
							const gitEmail = commitInfo[2]
							const commitDate = commitInfo[3]
							const commitMessage = commitInfo[4]
							const commitTimestamp =
								parseInt(commitInfo[5]) * 1000 // 转换为毫秒

							// 尝试从操作日志中找到对应的push操作
							let systemUser = null
							if (repoName) {
								try {
									const logPath = path.join(
										__dirname,
										"../logs/git-operations.json",
									)
									if (fs.existsSync(logPath)) {
										const logData = fs.readJsonSync(logPath)

										// 查找最近的push操作，时间范围在提交时间前后5分钟内
										const pushLogs = logData.logs
											.filter(
												(log) =>
													log.operation === "push" &&
													log.repository ===
														repoName &&
													log.success === true &&
													log.user &&
													Math.abs(
														new Date(
															log.timestamp,
														).getTime() -
															commitTimestamp,
													) <
														5 * 60 * 1000, // 5分钟内
											)
											.sort(
												(a, b) =>
													new Date(
														b.timestamp,
													).getTime() -
													new Date(
														a.timestamp,
													).getTime(),
											) // 按时间倒序

										if (pushLogs.length > 0) {
											systemUser = pushLogs[0].user
										}
									}
								} catch (error) {
									console.warn("查找push操作日志失败:", error)
								}
							}

							// 构建响应数据
							const responseData = {
								hash: commitHash,
								date: commitDate,
								message: commitMessage,
								gitAuthor: gitAuthor,
								gitEmail: gitEmail,
							}

							// 如果找到了系统用户，使用系统用户信息
							if (systemUser) {
								responseData.author = systemUser.username
								responseData.email = systemUser.email || ""
								responseData.authorType = "system" // 标记为系统用户
								responseData.systemUser = systemUser
							} else {
								// 否则使用git配置的用户信息
								responseData.author = gitAuthor
								responseData.email = gitEmail
								responseData.authorType = "git" // 标记为git配置用户
							}

							res.json({
								code: 200,
								data: responseData,
							})
						} else {
							res.json({
								code: 404,
								msg: "无法解析提交信息",
							})
						}
						resolve()
					} else if (branch === "main") {
						// main分支失败，尝试master分支
						tryGetCommit("master")
					} else {
						// 两个分支都失败
						res.json({
							code: 404,
							msg: "仓库为空或无提交记录",
							error: stderr,
						})
						resolve()
					}
				})

				gitProcess.on("error", (error) => {
					res.status(500).json({
						code: 500,
						msg: "Git操作失败",
						error: error.message,
					})
					resolve()
				})
			}

			tryGetCommit("main")
		})
	} catch (error) {
		console.error("获取最新提交失败:", error)
		res.status(500).json({
			code: 500,
			msg: "获取最新提交失败",
			error: error.message,
		})
	}
})

// 获取仓库版本列表（从package.json获取版本号）
router.get("/versions", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")

		if (!repoPath) {
			return res.status(400).json({
				code: 400,
				msg: "缺少仓库路径参数",
			})
		}

		// 检查仓库是否存在
		if (!fs.existsSync(repoPath)) {
			return res.status(404).json({
				code: 404,
				msg: "仓库不存在",
			})
		}

		const { spawn } = require("child_process")

		// 获取仓库名称（用于查找操作日志）
		const config = fs.readJsonSync(REPO_CONFIG_PATH)
		const repo = config.repoList.find((r) => r.repoPath === repoPath)
		const repoName = repo ? repo.repoName : null

		// 预加载操作日志
		let pushLogs = []
		if (repoName) {
			try {
				const logPath = path.join(
					__dirname,
					"../logs/git-operations.json",
				)
				if (fs.existsSync(logPath)) {
					const logData = fs.readJsonSync(logPath)
					pushLogs = logData.logs
						.filter(
							(log) =>
								log.operation === "push" &&
								log.repository === repoName &&
								log.success === true &&
								log.user,
						)
						.sort(
							(a, b) =>
								new Date(b.timestamp).getTime() -
								new Date(a.timestamp).getTime(),
						)
				}
			} catch (error) {
				console.warn("加载push操作日志失败:", error)
			}
		}

		return new Promise((resolve) => {
			// 先尝试main分支，再尝试master分支
			const tryGetVersions = (branch) => {
				// 获取所有提交记录，限制数量避免过多，添加时间戳
				const gitProcess = spawn(
					"git",
					[
						"log",
						"--format=%H|%an|%ae|%ad|%s|%ct",
						"--date=iso",
						branch,
						"-20",
					],
					{
						cwd: repoPath,
						stdio: ["pipe", "pipe", "pipe"],
					},
				)

				let stdout = ""
				let stderr = ""

				gitProcess.stdout.on("data", (data) => {
					stdout += data.toString()
				})

				gitProcess.stderr.on("data", (data) => {
					stderr += data.toString()
				})

				gitProcess.on("close", async (code) => {
					if (code === 0 && stdout.trim()) {
						const commits = stdout
							.trim()
							.split("\n")
							.map((line, index) => {
								const commitInfo = line.split("|")
								if (commitInfo.length >= 6) {
									const commitTimestamp =
										parseInt(commitInfo[5]) * 1000 // 转换为毫秒

									// 查找对应的push操作
									let systemUser = null
									const matchingPushLog = pushLogs.find(
										(log) =>
											Math.abs(
												new Date(
													log.timestamp,
												).getTime() - commitTimestamp,
											) <
											5 * 60 * 1000, // 5分钟内
									)

									if (matchingPushLog) {
										systemUser = matchingPushLog.user
									}

									const commitData = {
										hash: commitInfo[0],
										shortHash: commitInfo[0].substring(
											0,
											7,
										),
										gitAuthor: commitInfo[1],
										gitEmail: commitInfo[2],
										date: commitInfo[3],
										message: commitInfo[4],
										isLatest: index === 0,
									}

									// 设置显示的用户信息
									if (systemUser) {
										commitData.author = systemUser.username
										commitData.email =
											systemUser.email || ""
										commitData.authorType = "system"
										commitData.systemUser = systemUser
									} else {
										commitData.author = commitInfo[1]
										commitData.email = commitInfo[2]
										commitData.authorType = "git"
									}

									return commitData
								}
								return null
							})
							.filter(Boolean)

						// 为每个提交获取对应的package.json版本号
						const versionsWithPackageInfo = await Promise.all(
							commits.map(async (commit) => {
								try {
									// 尝试获取该提交的package.json文件
									const packageProcess = spawn(
										"git",
										["show", `${commit.hash}:package.json`],
										{
											cwd: repoPath,
											stdio: ["pipe", "pipe", "pipe"],
										},
									)

									let packageContent = ""
									let packageError = ""

									packageProcess.stdout.on("data", (data) => {
										packageContent += data.toString()
									})

									packageProcess.stderr.on("data", (data) => {
										packageError += data.toString()
									})

									return new Promise((packageResolve) => {
										packageProcess.on(
											"close",
											(packageCode) => {
												let version = "未知"

												if (
													packageCode === 0 &&
													packageContent.trim()
												) {
													try {
														const packageJson =
															JSON.parse(
																packageContent,
															)
														version =
															packageJson.version ||
															"未知"
													} catch (parseError) {
														console.warn(
															"解析package.json失败:",
															parseError,
														)
													}
												}

												packageResolve({
													...commit,
													version: version,
												})
											},
										)

										packageProcess.on("error", () => {
											packageResolve({
												...commit,
												version: "未知",
											})
										})
									})
								} catch (error) {
									return {
										...commit,
										version: "未知",
									}
								}
							}),
						)

						res.json({
							code: 200,
							data: versionsWithPackageInfo,
						})
						resolve()
					} else if (branch === "main") {
						// main分支失败，尝试master分支
						tryGetVersions("master")
					} else {
						// 两个分支都失败
						res.json({
							code: 404,
							msg: "仓库为空或无提交记录",
							error: stderr,
						})
						resolve()
					}
				})

				gitProcess.on("error", (error) => {
					res.status(500).json({
						code: 500,
						msg: "Git操作失败",
						error: error.message,
					})
					resolve()
				})
			}

			tryGetVersions("main")
		})
	} catch (error) {
		console.error("获取版本列表失败:", error)
		res.status(500).json({
			code: 500,
			msg: "获取版本列表失败",
			error: error.message,
		})
	}
})

// 获取指定版本的文件内容
router.get("/file-content-by-version", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")
		const filePath = String(req.query.filePath || "")
		const version = String(req.query.version || "") // commit hash

		if (!repoPath || !filePath || !version) {
			return res.status(400).json({
				code: 400,
				msg: "缺少必要参数",
			})
		}

		// 检查仓库是否存在
		if (!fs.existsSync(repoPath)) {
			return res.status(404).json({
				code: 404,
				msg: "仓库不存在",
			})
		}

		const { spawn } = require("child_process")

		return new Promise((resolve) => {
			const gitProcess = spawn(
				"git",
				["show", `${version}:${filePath}`],
				{
					cwd: repoPath,
					stdio: ["pipe", "pipe", "pipe"],
				},
			)

			let stdout = ""
			let stderr = ""

			gitProcess.stdout.on("data", (data) => {
				stdout += data.toString()
			})

			gitProcess.stderr.on("data", (data) => {
				stderr += data.toString()
			})

			gitProcess.on("close", (code) => {
				if (code === 0) {
					res.json({
						code: 200,
						data: {
							content: stdout,
							filePath: filePath,
							version: version,
						},
					})
				} else {
					res.json({
						code: 404,
						msg: "文件在该版本中不存在",
						error: stderr,
					})
				}
				resolve()
			})

			gitProcess.on("error", (error) => {
				res.status(500).json({
					code: 500,
					msg: "Git操作失败",
					error: error.message,
				})
				resolve()
			})
		})
	} catch (error) {
		console.error("获取版本文件内容失败:", error)
		res.status(500).json({
			code: 500,
			msg: "获取版本文件内容失败",
			error: error.message,
		})
	}
})

// 获取仓库的package.json信息
router.get("/package-info", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")

		if (!repoPath) {
			return res.status(400).json({
				code: 400,
				msg: "缺少仓库路径参数",
			})
		}

		// 检查仓库是否存在
		if (!fs.existsSync(repoPath)) {
			return res.status(404).json({
				code: 404,
				msg: "仓库不存在",
			})
		}

		const { spawn } = require("child_process")

		return new Promise((resolve) => {
			// 先尝试main分支，再尝试master分支
			const tryGetPackageInfo = (branch) => {
				const gitProcess = spawn(
					"git",
					["show", `${branch}:package.json`],
					{
						cwd: repoPath,
						stdio: ["pipe", "pipe", "pipe"],
					},
				)

				let stdout = ""
				let stderr = ""

				gitProcess.stdout.on("data", (data) => {
					stdout += data.toString()
				})

				gitProcess.stderr.on("data", (data) => {
					stderr += data.toString()
				})

				gitProcess.on("close", (code) => {
					if (code === 0 && stdout.trim()) {
						try {
							const packageJson = JSON.parse(stdout)
							res.json({
								code: 200,
								data: {
									version: packageJson.version || "未知",
									name: packageJson.name || "",
									description: packageJson.description || "",
									license: packageJson.license || "MIT",
									keywords: packageJson.keywords || [],
									author: packageJson.author || "未知",
									dependencies:
										packageJson.dependencies || {},
									devDependencies:
										packageJson.devDependencies || {},
									peerDependencies:
										packageJson.peerDependencies || {},
									optionalDependencies:
										packageJson.optionalDependencies || {},
								},
							})
						} catch (parseError) {
							res.json({
								code: 404,
								msg: "无法解析package.json文件",
							})
						}
						resolve()
					} else if (branch === "main") {
						// main分支失败，尝试master分支
						tryGetPackageInfo("master")
					} else {
						// 两个分支都失败，返回默认值
						res.json({
							code: 200,
							data: {
								version: "未知",
								name: "",
								description: "",
								license: "MIT",
								keywords: [],
								author: "未知",
								dependencies: {},
								devDependencies: {},
								peerDependencies: {},
								optionalDependencies: {},
							},
						})
						resolve()
					}
				})

				gitProcess.on("error", (error) => {
					res.status(500).json({
						code: 500,
						msg: "Git操作失败",
						error: error.message,
					})
					resolve()
				})
			}

			tryGetPackageInfo("main")
		})
	} catch (error) {
		console.error("获取package.json信息失败:", error)
		res.status(500).json({
			code: 500,
			msg: "获取package.json信息失败",
			error: error.message,
		})
	}
})

// 下载指定版本的仓库压缩包
router.get("/download-version", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")
		const version = String(req.query.version || "") // commit hash
		const repoName = String(req.query.repoName || "repository")

		if (!repoPath || !version) {
			return res.status(400).json({
				code: 400,
				msg: "缺少必要参数",
			})
		}

		// 检查仓库是否存在
		if (!fs.existsSync(repoPath)) {
			return res.status(404).json({
				code: 404,
				msg: "仓库不存在",
			})
		}

		const { spawn } = require("child_process")
		const path = require("path")

		// 设置响应头
		const filename = `${repoName}-${version.substring(0, 7)}.zip`
		res.setHeader("Content-Type", "application/zip")
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${filename}"`,
		)

		// 使用git archive命令创建压缩包
		const gitProcess = spawn("git", ["archive", "--format=zip", version], {
			cwd: repoPath,
			stdio: ["pipe", "pipe", "pipe"],
		})

		// 将git archive的输出直接管道到响应
		gitProcess.stdout.pipe(res)

		let stderr = ""
		gitProcess.stderr.on("data", (data) => {
			stderr += data.toString()
		})

		gitProcess.on("close", (code) => {
			if (code !== 0) {
				console.error("Git archive失败:", stderr)
				if (!res.headersSent) {
					res.status(500).json({
						code: 500,
						msg: "创建压缩包失败",
						error: stderr,
					})
				}
			}
		})

		gitProcess.on("error", (error) => {
			console.error("Git archive错误:", error)
			if (!res.headersSent) {
				res.status(500).json({
					code: 500,
					msg: "Git操作失败",
					error: error.message,
				})
			}
		})
	} catch (error) {
		console.error("下载版本失败:", error)
		if (!res.headersSent) {
			res.status(500).json({
				code: 500,
				msg: "下载版本失败",
				error: error.message,
			})
		}
	}
})

// ==================== 文件浏览相关 API ====================

// 获取文件树（支持懒加载）
router.get("/file-tree", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")
		const branch = String(req.query.branch || "")
		const dirPath = String(req.query.path || "")

		console.log(`\n${"=".repeat(80)}`)
		console.log(`📁 File-tree request`)
		console.log(`   Repo path: ${repoPath}`)
		console.log(`   Branch: ${branch}`)
		console.log(`   Dir path: ${dirPath}`)
		console.log(`${"=".repeat(80)}\n`)

		if (!repoPath) {
			return res.status(400).json({
				code: 400,
				msg: "缺少仓库路径参数",
			})
		}

		if (!fs.existsSync(repoPath)) {
			console.log(`❌ Repository not found: ${repoPath}`)
			return res.status(404).json({
				code: 404,
				msg: "仓库不存在",
			})
		}

		const { spawn } = require("child_process")

		// 如果没有指定分支，先获取默认分支
		const getDefaultBranch = () => {
			return new Promise((resolve) => {
				const gitProcess = spawn("git", ["symbolic-ref", "HEAD"], {
					cwd: repoPath,
					stdio: ["pipe", "pipe", "pipe"],
				})

				let stdout = ""

				gitProcess.stdout.on("data", (data) => {
					stdout += data.toString()
				})

				gitProcess.on("close", (code) => {
					if (code === 0 && stdout.trim()) {
						// 输出格式: refs/heads/main
						const branchName = stdout
							.trim()
							.replace("refs/heads/", "")
						resolve(branchName)
					} else {
						// 如果获取失败，尝试常见的分支名
						resolve("main")
					}
				})

				gitProcess.on("error", () => {
					resolve("main")
				})
			})
		}

		const actualBranch = branch || (await getDefaultBranch())

		console.log(`🔍 Using branch: ${actualBranch}`)

		return new Promise((resolve) => {
			const tryListFiles = (branchName, fallbackBranches = []) => {
				console.log(`🔍 Trying to list files on branch: ${branchName}`)

				// 构建 Git 参数
				// 如果有 dirPath，使用 branch:path 格式来获取目录内容
				// 否则直接使用 branch 来获取根目录内容
				const treeRef = dirPath
					? `${branchName}:${dirPath}`
					: branchName
				const gitArgs = ["ls-tree", "-l", treeRef]

				console.log(`🔧 Git command: git ${gitArgs.join(" ")}`)
				console.log(`📂 Working directory: ${repoPath}`)

				const gitProcess = spawn("git", gitArgs, {
					cwd: repoPath,
					stdio: ["pipe", "pipe", "pipe"],
				})

				let stdout = ""
				let stderr = ""

				gitProcess.stdout.on("data", (data) => {
					stdout += data.toString()
				})

				gitProcess.stderr.on("data", (data) => {
					stderr += data.toString()
					console.error(`🔴 Git stderr: ${data.toString()}`)
				})

				gitProcess.on("close", (code) => {
					console.log(`📊 Git ls-tree exit code: ${code}`)

					if (code === 0) {
						console.log(
							`✅ Successfully listed files on branch: ${branchName}`,
						)

						const files = stdout
							.trim()
							.split("\n")
							.filter((line) => line.trim())
							.map((line) => {
								const parts = line.split(/\s+/)
								const mode = parts[0]
								const type = parts[1]
								const hash = parts[2]
								const size =
									parts[3] === "-" ? null : parseInt(parts[3])
								const name = parts.slice(4).join(" ")

								return {
									name,
									type:
										type === "tree" ? "directory" : "file",
									mode,
									hash,
									size,
									path: dirPath ? `${dirPath}/${name}` : name,
									isLeaf: type !== "tree",
								}
							})
							// 排序：文件夹在前，文件在后，同类型按名称排序
							.sort((a, b) => {
								// 先按类型排序（directory < file）
								if (a.type !== b.type) {
									return a.type === "directory" ? -1 : 1
								}
								// 同类型按名称排序
								return a.name.localeCompare(b.name)
							})

						console.log(`📁 Found ${files.length} items`)

						res.json({
							code: 200,
							data: files,
						})
						resolve()
					} else if (fallbackBranches.length > 0) {
						// 尝试下一个备选分支
						console.log(
							`⚠️ Branch ${branchName} failed, trying fallback...`,
						)
						const nextBranch = fallbackBranches[0]
						const remainingBranches = fallbackBranches.slice(1)
						tryListFiles(nextBranch, remainingBranches)
					} else {
						console.log(
							`❌ All branches failed. Last error: ${stderr}`,
						)
						res.json({
							code: 404,
							msg: "目录不存在或仓库为空",
							error: stderr,
						})
						resolve()
					}
				})

				gitProcess.on("error", (error) => {
					console.error(`💥 Git process error: ${error.message}`)
					res.status(500).json({
						code: 500,
						msg: "Git操作失败",
						error: error.message,
					})
					resolve()
				})
			}

			// 只在没有指定分支或分支失败时才使用 fallback
			// 如果用户指定了分支，只尝试该分支和一个 fallback
			let fallbackBranches = []
			if (actualBranch === "main") {
				fallbackBranches = ["master"]
			} else if (actualBranch === "master") {
				fallbackBranches = ["main"]
			} else {
				// 对于其他分支名，不使用 fallback
				fallbackBranches = []
			}

			console.log(
				`🔄 Fallback branches: ${fallbackBranches.join(", ") || "none"}`,
			)
			tryListFiles(actualBranch, fallbackBranches)
		})
	} catch (error) {
		console.error("获取文件树失败:", error)
		res.status(500).json({
			code: 500,
			msg: "获取文件树失败",
			error: error.message,
		})
	}
})

// 获取文件内容（支持代码查看权限）
router.get(
	"/file-content-with-permission",
	authenticateJWT,
	async (req, res) => {
		try {
			const repoPath = String(req.query.repoPath || "")
			const filePath = String(req.query.filePath || "")
			const branch = String(req.query.branch || "main")
			const download = req.query.download === "true" // 是否为下载请求

			if (!repoPath || !filePath) {
				return res.status(400).json({
					code: 400,
					msg: "缺少必要参数",
				})
			}

			if (!fs.existsSync(repoPath)) {
				return res.status(404).json({
					code: 404,
					msg: "仓库不存在",
				})
			}

			// 检查代码查看权限
			const config = fs.readJsonSync(REPO_CONFIG_PATH)
			const repo = config.repoList.find((r) => r.repoPath === repoPath)

			if (repo) {
				const { canViewCode } = require("../utils/repo-permission")
				const hasPermission = canViewCode(
					req.user.username,
					req.user.role,
					repo.repoName,
				)

				if (!hasPermission) {
					return res.status(403).json({
						code: 403,
						msg: "您没有查看此仓库代码的权限",
					})
				}
			}

			const { spawn } = require("child_process")

			return new Promise((resolve) => {
				const tryGetFile = (branchName) => {
					const gitProcess = spawn(
						"git",
						["show", `${branchName}:${filePath}`],
						{
							cwd: repoPath,
							stdio: ["pipe", "pipe", "pipe"],
						},
					)

					let stdout = ""
					let stderr = ""
					let isBinary = false
					const chunks = []

					gitProcess.stdout.on("data", (data) => {
						chunks.push(data)
						// 检测是否为二进制文件
						if (!isBinary && data.includes(0)) {
							isBinary = true
						}
						stdout += data.toString("utf8")
					})

					gitProcess.stderr.on("data", (data) => {
						stderr += data.toString()
					})

					gitProcess.on("close", (code) => {
						if (code === 0) {
							// 如果是下载请求，直接返回文件内容
							if (download) {
								const fileName = path.basename(filePath)
								const buffer = Buffer.concat(chunks)

								res.setHeader(
									"Content-Disposition",
									`attachment; filename="${encodeURIComponent(
										fileName,
									)}"`,
								)
								res.setHeader(
									"Content-Type",
									"application/octet-stream",
								)
								res.send(buffer)
								resolve()
								return
							}

							// 否则返回 JSON 格式（用于预览）
							const ext = path.extname(filePath).toLowerCase()
							const imageExts = [
								".jpg",
								".jpeg",
								".png",
								".gif",
								".bmp",
								".svg",
								".webp",
							]
							const isImage = imageExts.includes(ext)

							// 计算文件大小（字节）
							const fileSize = Buffer.byteLength(stdout, "utf8")
							const maxSize = 5 * 1024 * 1024 // 5MB

							res.json({
								code: 200,
								data: {
									content: stdout,
									filePath: filePath,
									isBinary: isBinary,
									isImage: isImage,
									size: fileSize,
									tooLarge: fileSize > maxSize,
									extension: ext,
								},
							})
							resolve()
						} else if (branchName === "main") {
							tryGetFile("master")
						} else {
							res.json({
								code: 404,
								msg: "文件不存在或仓库为空",
								error: stderr,
							})
							resolve()
						}
					})

					gitProcess.on("error", (error) => {
						res.status(500).json({
							code: 500,
							msg: "Git操作失败",
							error: error.message,
						})
						resolve()
					})
				}

				tryGetFile(branch)
			})
		} catch (error) {
			console.error("获取文件内容失败:", error)
			res.status(500).json({
				code: 500,
				msg: "获取文件内容失败",
				error: error.message,
			})
		}
	},
)

// 检查代码查看权限
router.get("/check-code-permission", authenticateJWT, async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")

		if (!repoPath) {
			return res.json({
				code: 400,
				msg: "缺少仓库路径参数",
			})
		}

		const username = req.user?.username
		if (!username) {
			return res.json({
				code: 401,
				msg: "未登录",
			})
		}

		// 检查代码查看权限
		const hasPermission = await authUtils.checkCodeViewPermission(
			username,
			repoPath,
		)

		res.json({
			code: 200,
			data: {
				hasPermission: hasPermission,
			},
		})
	} catch (error) {
		console.error("检查代码查看权限失败:", error)
		res.json({
			code: 500,
			msg: "检查权限失败",
			error: error.message,
		})
	}
})

// 获取分支列表
router.get("/branches", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")

		if (!repoPath) {
			return res.status(400).json({
				code: 400,
				msg: "缺少仓库路径参数",
			})
		}

		if (!fs.existsSync(repoPath)) {
			return res.status(404).json({
				code: 404,
				msg: "仓库不存在",
			})
		}

		const { spawn } = require("child_process")

		return new Promise((resolve) => {
			const gitProcess = spawn("git", ["branch", "-a"], {
				cwd: repoPath,
				stdio: ["pipe", "pipe", "pipe"],
			})

			let stdout = ""
			let stderr = ""

			gitProcess.stdout.on("data", (data) => {
				stdout += data.toString()
			})

			gitProcess.stderr.on("data", (data) => {
				stderr += data.toString()
			})

			gitProcess.on("close", (code) => {
				if (code === 0 && stdout.trim()) {
					const branches = stdout
						.trim()
						.split("\n")
						.map((line) => {
							const isCurrent = line.startsWith("*")
							const branchName = line
								.replace(/^\*?\s+/, "")
								.replace(/^remotes\/origin\//, "")
								.trim()
							return {
								name: branchName,
								isCurrent: isCurrent,
							}
						})
						.filter(
							(branch) =>
								branch.name &&
								branch.name !== "HEAD" &&
								!branch.name.includes("->"),
						)
						// 去重
						.filter(
							(branch, index, self) =>
								index ===
								self.findIndex((b) => b.name === branch.name),
						)

					res.json({
						code: 200,
						data: branches,
					})
				} else {
					res.json({
						code: 404,
						msg: "仓库为空或无分支",
						error: stderr,
					})
				}
				resolve()
			})

			gitProcess.on("error", (error) => {
				res.status(500).json({
					code: 500,
					msg: "Git操作失败",
					error: error.message,
				})
				resolve()
			})
		})
	} catch (error) {
		console.error("获取分支列表失败:", error)
		res.status(500).json({
			code: 500,
			msg: "获取分支列表失败",
			error: error.message,
		})
	}
})

// 获取提交历史（支持分页和分支）
router.get("/commits", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")
		const branch = String(req.query.branch || "main")
		const page = parseInt(req.query.page || "1")
		const pageSize = parseInt(req.query.pageSize || "20")
		const skip = (page - 1) * pageSize

		if (!repoPath) {
			return res.status(400).json({
				code: 400,
				msg: "缺少仓库路径参数",
			})
		}

		if (!fs.existsSync(repoPath)) {
			return res.status(404).json({
				code: 404,
				msg: "仓库不存在",
			})
		}

		const { spawn } = require("child_process")

		// 获取仓库名称（用于查找操作日志）
		const config = fs.readJsonSync(REPO_CONFIG_PATH)
		const repo = config.repoList.find((r) => r.repoPath === repoPath)
		const repoName = repo ? repo.repoName : null

		// 预加载操作日志
		let pushLogs = []
		if (repoName) {
			try {
				const logPath = path.join(
					__dirname,
					"../logs/git-operations.json",
				)
				if (fs.existsSync(logPath)) {
					const logData = fs.readJsonSync(logPath)
					pushLogs = logData.logs
						.filter(
							(log) =>
								log.operation === "push" &&
								log.repository === repoName &&
								log.success === true &&
								log.user,
						)
						.sort(
							(a, b) =>
								new Date(b.timestamp).getTime() -
								new Date(a.timestamp).getTime(),
						)
				}
			} catch (error) {
				console.warn("加载push操作日志失败:", error)
			}
		}

		return new Promise((resolve) => {
			const tryGetCommits = (branchName) => {
				// 获取提交历史，包含分支信息
				const gitProcess = spawn(
					"git",
					[
						"log",
						"--all",
						"--format=%H|%h|%an|%ae|%ad|%s|%D|%ct",
						"--date=iso",
						`--skip=${skip}`,
						`-n`,
						`${pageSize}`,
					],
					{
						cwd: repoPath,
						stdio: ["pipe", "pipe", "pipe"],
					},
				)

				let stdout = ""
				let stderr = ""

				gitProcess.stdout.on("data", (data) => {
					stdout += data.toString()
				})

				gitProcess.stderr.on("data", (data) => {
					stderr += data.toString()
				})

				gitProcess.on("close", async (code) => {
					if (code === 0 && stdout.trim()) {
						const commits = stdout
							.trim()
							.split("\n")
							.map((line) => {
								const parts = line.split("|")
								if (parts.length >= 7) {
									const refs = parts[6] || ""
									const commitTimestamp = parts[7]
										? parseInt(parts[7]) * 1000
										: null
									const branches = []
									const tags = []

									// 解析分支和标签
									if (refs) {
										const refParts = refs.split(",")
										refParts.forEach((ref) => {
											ref = ref.trim()
											if (ref.includes("HEAD")) {
												// 跳过 HEAD
											} else if (
												ref.startsWith("tag: ")
											) {
												tags.push(
													ref.replace("tag: ", ""),
												)
											} else {
												// 移除 origin/ 前缀
												const branchName = ref.replace(
													/^origin\//,
													"",
												)
												if (
													branchName &&
													!branches.includes(
														branchName,
													)
												) {
													branches.push(branchName)
												}
											}
										})
									}

									// 查找对应的push操作
									let systemUser = null
									if (commitTimestamp) {
										const matchingPushLog = pushLogs.find(
											(log) =>
												Math.abs(
													new Date(
														log.timestamp,
													).getTime() -
														commitTimestamp,
												) <
												5 * 60 * 1000, // 5分钟内
										)

										if (matchingPushLog) {
											systemUser = matchingPushLog.user
										}
									}

									const commitData = {
										hash: parts[0],
										shortHash: parts[1],
										gitAuthor: parts[2],
										gitEmail: parts[3],
										date: parts[4],
										message: parts[5],
										branches: branches,
										tags: tags,
									}

									// 设置显示的用户信息
									if (systemUser) {
										commitData.author = systemUser.username
										commitData.email =
											systemUser.email || ""
										commitData.authorType = "system"
										commitData.systemUser = systemUser
									} else {
										commitData.author = parts[2]
										commitData.email = parts[3]
										commitData.authorType = "git"
									}

									return commitData
								}
								return null
							})
							.filter(Boolean)

						res.json({
							code: 200,
							data: {
								commits: commits,
								page: page,
								pageSize: pageSize,
								hasMore: commits.length === pageSize,
							},
						})
						resolve()
					} else if (branchName === "main") {
						tryGetCommits("master")
					} else {
						res.json({
							code: 404,
							msg: "仓库为空或无提交记录",
							error: stderr,
						})
						resolve()
					}
				})

				gitProcess.on("error", (error) => {
					res.status(500).json({
						code: 500,
						msg: "Git操作失败",
						error: error.message,
					})
					resolve()
				})
			}

			tryGetCommits(branch)
		})
	} catch (error) {
		console.error("获取提交历史失败:", error)
		res.status(500).json({
			code: 500,
			msg: "获取提交历史失败",
			error: error.message,
		})
	}
})

module.exports = router
