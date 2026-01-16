const express = require("express")
const router = express.Router()
const { spawn } = require("child_process")
const fs = require("fs-extra")
const path = require("path")
const {
	requireGitAuth,
	parseBasicAuth,
	authenticateUser,
} = require("../utils/auth-utils")
const { logGitOperation } = require("../utils/git-logger")

// 配置文件路径
const REPO_CONFIG_PATH = path.join(__dirname, "../config/repo-config.json")

// 获取仓库路径
function getRepoPath(repoName) {
	try {
		const config = fs.readJsonSync(REPO_CONFIG_PATH)
		const repo = config.repoList.find((r) => r.repoName === repoName)
		return repo ? repo.repoPath : null
	} catch (error) {
		return null
	}
}

// 获取客户端IP
function getClientIP(req) {
	return (
		req.headers["x-forwarded-for"] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		(req.connection.socket ? req.connection.socket.remoteAddress : null)
	)
}

// 身份验证中间件（对于需要认证的操作）
function optionalAuth(req, res, next) {
	const authHeader = req.headers.authorization

	if (authHeader) {
		const credentials = parseBasicAuth(authHeader)
		if (credentials) {
			const user = authenticateUser(
				credentials.username,
				credentials.password
			)
			if (user) {
				req.user = user
			}
		}
	}

	next()
}

// Git HTTP Smart Protocol 处理
router.get("/:repo/info/refs", optionalAuth, (req, res) => {
	const repoName = String(req.params.repo).replace(".git", "")
	const service = String(req.query.service || "")
	const repoPath = getRepoPath(repoName)
	const startTime = Date.now()

	console.log(`\n${"=".repeat(80)}`)
	console.log(`🔍 Git info/refs request`)
	console.log(`   Repository: ${repoName}`)
	console.log(`   Service: ${service}`)
	console.log(`   Path: ${repoPath}`)
	console.log(`   User: ${req.user?.username || "anonymous"}`)
	console.log(`   Client IP: ${getClientIP(req)}`)
	console.log(`${"=".repeat(80)}\n`)

	if (!repoPath || !fs.existsSync(repoPath)) {
		console.log("❌ Repository not found:", repoName)

		// 记录失败的操作
		logGitOperation({
			type: service === "git-receive-pack" ? "push" : "clone",
			repository: repoName,
			user: req.user,
			userAgent: req.headers["user-agent"],
			clientIP: getClientIP(req),
			success: false,
			error: "Repository not found",
			duration: Date.now() - startTime,
		})

		return res.status(404).send("Repository not found")
	}

	if (
		!service ||
		!["git-upload-pack", "git-receive-pack"].includes(service)
	) {
		console.log("❌ Invalid service:", service)
		return res.status(400).send("Invalid service")
	}

	// 对于推送操作，需要身份验证
	if (service === "git-receive-pack" && !req.user) {
		res.setHeader("WWW-Authenticate", 'Basic realm="Git Repository"')
		return res
			.status(401)
			.send("Authentication required for push operations")
	}

	try {
		// 设置响应头
		res.setHeader("Content-Type", `application/x-${service}-advertisement`)
		res.setHeader("Cache-Control", "no-cache")

		// 构建服务头
		const serviceHeader = `# service=${service}\n`
		const serviceHeaderLength = serviceHeader.length + 4
		const packetLine =
			serviceHeaderLength.toString(16).padStart(4, "0") +
			serviceHeader +
			"0000"

		console.log(`📡 Sending service header for ${service}`)
		// 发送服务头
		res.write(Buffer.from(packetLine))

		// 执行git命令
		console.log(`🚀 Spawning ${service} for ${repoPath}`)
		const gitProcess = spawn(service, [
			"--stateless-rpc",
			"--advertise-refs",
			repoPath,
		])

		let stderr = ""

		gitProcess.stdout.on("data", (data) => {
			res.write(data)
		})

		gitProcess.stderr.on("data", (data) => {
			stderr += data.toString()
			console.error(`🔴 Git stderr (${service}):`, data.toString())
		})

		gitProcess.on("close", (code) => {
			const duration = Date.now() - startTime
			const success = code === 0

			if (!success) {
				console.error(
					`❌ Git ${service} 执行失败，代码：${code}，错误：${stderr}`
				)
			} else {
				console.log(`✅ Git ${service} 执行成功`)
			}

			// 记录操作日志
			logGitOperation({
				type:
					service === "git-receive-pack"
						? "push"
						: service === "git-upload-pack"
						? "clone"
						: "unknown",
				repository: repoName,
				user: req.user,
				userAgent: req.headers["user-agent"],
				clientIP: getClientIP(req),
				success: success,
				error: success ? null : stderr,
				duration: duration,
				details: {
					service: service,
					phase: "info/refs",
				},
			})

			res.end()
		})

		gitProcess.on("error", (error) => {
			console.error(`💥 Git操作异常 (${service}):`, error.message)

			// 记录错误日志
			logGitOperation({
				type: service === "git-receive-pack" ? "push" : "clone",
				repository: repoName,
				user: req.user,
				userAgent: req.headers["user-agent"],
				clientIP: getClientIP(req),
				success: false,
				error: error.message,
				duration: Date.now() - startTime,
			})

			if (!res.headersSent) {
				res.status(500).send(`Git操作失败: ${error.message}`)
			}
		})
	} catch (error) {
		console.error("💥 Git info/refs 异常:", error.message)

		// 记录异常日志
		logGitOperation({
			type: service === "git-receive-pack" ? "push" : "clone",
			repository: repoName,
			user: req.user,
			userAgent: req.headers["user-agent"],
			clientIP: getClientIP(req),
			success: false,
			error: error.message,
			duration: Date.now() - startTime,
		})

		res.status(500).send(`Git操作失败: ${error.message}`)
	}
})

// Git upload-pack (用于git clone, git fetch)
router.post("/:repo/git-upload-pack", (req, res) => {
	const repoName = String(req.params.repo).replace(".git", "")
	const repoPath = getRepoPath(repoName)

	console.log(
		`🔍 Git upload-pack request: repo=${repoName}, path=${repoPath}`
	)

	if (!repoPath || !fs.existsSync(repoPath)) {
		console.log("❌ Repository not found for upload-pack:", repoName)
		return res.status(404).send("Repository not found")
	}

	res.setHeader("Content-Type", "application/x-git-upload-pack-result")
	res.setHeader("Cache-Control", "no-cache")

	try {
		console.log(`🚀 Spawning git-upload-pack for ${repoPath}`)
		const gitProcess = spawn("git-upload-pack", [
			"--stateless-rpc",
			repoPath,
		])

		let stderr = ""

		gitProcess.stderr.on("data", (data) => {
			stderr += data.toString()
			console.error(`🔴 Git错误 (upload-pack): ${data.toString()}`)
		})

		req.on("error", (error) => {
			console.error(`💥 Request error (upload-pack): ${error.message}`)
			gitProcess.kill("SIGTERM")
		})

		res.on("error", (error) => {
			console.error(`💥 Response error (upload-pack): ${error.message}`)
			gitProcess.kill("SIGTERM")
		})

		// 简单的管道连接
		req.pipe(gitProcess.stdin)
		gitProcess.stdout.pipe(res)

		gitProcess.on("error", (error) => {
			console.error(`💥 Git操作异常 (upload-pack): ${error.message}`)
			if (!res.headersSent) {
				res.status(500).send(`Git操作失败: ${error.message}`)
			}
		})

		gitProcess.on("close", (code, signal) => {
			console.log(
				`🔚 Git process closed with code: ${code}, signal: ${signal}`
			)
			if (code !== 0) {
				console.error(
					`❌ git upload-pack 执行失败，代码：${code}，错误：${stderr}`
				)
			} else {
				console.log(`✅ git upload-pack 执行成功`)
			}
		})
	} catch (error) {
		console.error(`💥 Git操作异常 (upload-pack): ${error.message}`)
		res.status(500).send(`Git操作失败: ${error.message}`)
	}
})

// Git receive-pack (用于git push) - 需要身份验证
router.post("/:repo/git-receive-pack", requireGitAuth, (req, res) => {
	const repoName = String(req.params.repo).replace(".git", "")
	const repoPath = getRepoPath(repoName)
	const startTime = Date.now()

	console.log(`\n${"=".repeat(80)}`)
	console.log(`🚀 Git RECEIVE-PACK (PUSH) request`)
	console.log(`   Repository: ${repoName}`)
	console.log(`   Path: ${repoPath}`)
	console.log(`   User: ${req.user.username}`)
	console.log(`   Content-Type: ${req.headers["content-type"]}`)
	console.log(`   Content-Length: ${req.headers["content-length"]}`)
	console.log(`   Body is Buffer: ${Buffer.isBuffer(req.body)}`)
	console.log(`   Body length: ${req.body ? req.body.length : 0}`)
	console.log(`${"=".repeat(80)}\n`)

	if (!repoPath || !fs.existsSync(repoPath)) {
		console.log("❌ Repository not found for receive-pack:", repoName)

		// 记录失败的推送操作
		logGitOperation({
			type: "push",
			repository: repoName,
			user: req.user,
			userAgent: req.headers["user-agent"],
			clientIP: getClientIP(req),
			success: false,
			error: "Repository not found",
			duration: Date.now() - startTime,
		})

		return res.status(404).send("Repository not found")
	}

	// 设置响应头
	res.setHeader("Content-Type", "application/x-git-receive-pack-result")
	res.setHeader("Cache-Control", "no-cache")
	res.setHeader("Connection", "keep-alive")

	try {
		console.log(
			`🚀 Spawning git-receive-pack for ${repoPath} by user ${req.user.username}`
		)
		const gitProcess = spawn(
			"git-receive-pack",
			["--stateless-rpc", repoPath],
			{
				stdio: ["pipe", "pipe", "pipe"],
				env: {
					...process.env,
					GIT_HTTP_EXPORT_ALL: "1",
					GIT_COMMITTER_NAME: req.user.username,
					GIT_COMMITTER_EMAIL:
						req.user.email || `${req.user.username}@localhost`,
				},
			}
		)

		let stderr = ""
		let dataReceived = 0
		let dataSent = 0
		let processEnded = false

		gitProcess.stderr.on("data", (data) => {
			stderr += data.toString()
			console.error(`🔴 Git stderr (receive-pack): ${data.toString()}`)
		})

		gitProcess.stdout.on("data", (data) => {
			dataSent += data.length
			console.log(
				`📤 Sending ${data.length} bytes to client (total: ${dataSent})`
			)
		})

		// 处理请求体 - express.raw() 已经将整个请求体读取到 req.body
		if (req.body && Buffer.isBuffer(req.body) && req.body.length > 0) {
			dataReceived = req.body.length
			console.log(
				`📥 Writing ${dataReceived} bytes from parsed body to git process`
			)

			// 写入数据到 git 进程
			gitProcess.stdin.write(req.body, (err) => {
				if (err) {
					console.error(
						`💥 Error writing to git stdin: ${err.message}`
					)
				} else {
					console.log(
						`✅ Successfully wrote ${dataReceived} bytes to git stdin`
					)
				}
				gitProcess.stdin.end()
			})
		} else {
			console.log(`⚠️ No body data received, ending stdin`)
			gitProcess.stdin.end()
		}

		// 处理请求错误
		req.on("error", (error) => {
			console.error(`💥 Request error (receive-pack): ${error.message}`)
			if (!processEnded) {
				gitProcess.kill("SIGTERM")
			}
		})

		// 处理响应错误
		res.on("error", (error) => {
			console.error(`💥 Response error (receive-pack): ${error.message}`)
			if (!processEnded) {
				gitProcess.kill("SIGTERM")
			}
		})

		// 管道连接输出到响应
		gitProcess.stdout.pipe(res, { end: true })

		// 处理 git 进程错误
		gitProcess.on("error", (error) => {
			console.error(
				`💥 Git process error (receive-pack): ${error.message}`
			)
			processEnded = true

			// 记录错误日志
			logGitOperation({
				type: "push",
				repository: repoName,
				user: req.user,
				userAgent: req.headers["user-agent"],
				clientIP: getClientIP(req),
				success: false,
				error: error.message,
				duration: Date.now() - startTime,
				details: {
					dataReceived: dataReceived,
					dataSent: dataSent,
				},
			})

			if (!res.headersSent) {
				res.status(500).send(`Git操作失败: ${error.message}`)
			} else if (!res.writableEnded) {
				res.end()
			}
		})

		// 处理 git 进程结束
		gitProcess.on("close", (code, signal) => {
			processEnded = true
			const duration = Date.now() - startTime
			const success = code === 0

			console.log(
				`🔚 Git process closed with code: ${code}, signal: ${signal}`
			)
			console.log(`📊 Total data received: ${dataReceived} bytes`)
			console.log(`📊 Total data sent: ${dataSent} bytes`)
			console.log(`⏱️ Duration: ${duration}ms`)

			if (!success) {
				console.error(`❌ git receive-pack failed with code ${code}`)
				if (stderr) {
					console.error(`❌ stderr: ${stderr}`)
				}
			} else {
				console.log(
					`✅ git receive-pack succeeded for user ${req.user.username}`
				)
			}

			// 记录推送操作日志
			logGitOperation({
				type: "push",
				repository: repoName,
				user: req.user,
				userAgent: req.headers["user-agent"],
				clientIP: getClientIP(req),
				success: success,
				error: success ? null : stderr,
				duration: duration,
				details: {
					dataReceived: dataReceived,
					dataSent: dataSent,
					exitCode: code,
					signal: signal,
				},
			})

			// 确保响应结束
			if (!res.writableEnded) {
				res.end()
			}
		})
	} catch (error) {
		console.error(`💥 Exception in receive-pack handler: ${error.message}`)
		console.error(error.stack)

		// 记录异常日志
		logGitOperation({
			type: "push",
			repository: repoName,
			user: req.user,
			userAgent: req.headers["user-agent"],
			clientIP: getClientIP(req),
			success: false,
			error: error.message,
			duration: Date.now() - startTime,
		})

		if (!res.headersSent) {
			res.status(500).send(`Git操作失败: ${error.message}`)
		}
	}
})

// 处理HEAD请求
router.get("/:repo/HEAD", (req, res) => {
	const repoName = String(req.params.repo).replace(".git", "")
	const repoPath = getRepoPath(repoName)

	console.log(`🔍 Git HEAD request: repo=${repoName}, path=${repoPath}`)

	if (!repoPath || !fs.existsSync(repoPath)) {
		console.log("❌ Repository not found for HEAD:", repoName)
		return res.status(404).send("Repository not found")
	}

	try {
		const headPath = path.join(repoPath, "HEAD")
		if (fs.existsSync(headPath)) {
			const headContent = fs.readFileSync(headPath, "utf8")
			console.log(`✅ HEAD content for ${repoName}:`, headContent.trim())
			res.setHeader("Content-Type", "text/plain")
			res.send(headContent)
		} else {
			console.log("❌ HEAD file not found:", headPath)
			res.status(404).send("HEAD not found")
		}
	} catch (error) {
		console.error("💥 HEAD 读取异常:", error.message)
		res.status(500).send(`HEAD读取失败: ${error.message}`)
	}
})

// 调试路由 - 检查仓库状态
router.get("/:repo/debug", (req, res) => {
	const repoName = String(req.params.repo).replace(".git", "")
	const repoPath = getRepoPath(repoName)

	console.log(`🔍 Debug request for repo: ${repoName}`)

	const debugInfo = {}
	debugInfo.repoName = repoName
	debugInfo.repoPath = repoPath
	debugInfo.exists = repoPath ? fs.existsSync(repoPath) : false
	debugInfo.isDirectory = false

	if (debugInfo.exists && repoPath) {
		try {
			const stats = fs.statSync(repoPath)
			debugInfo.isDirectory = stats.isDirectory()

			if (debugInfo.isDirectory) {
				debugInfo.files = fs.readdirSync(repoPath)

				// 检查Git配置
				const configPath = path.join(repoPath, "config")
				if (fs.existsSync(configPath)) {
					debugInfo.gitConfig = fs.readFileSync(configPath, "utf8")
				}

				// 检查HEAD文件
				const headPath = path.join(repoPath, "HEAD")
				if (fs.existsSync(headPath)) {
					debugInfo.headContent = fs.readFileSync(headPath, "utf8")
				}
			}
		} catch (error) {
			debugInfo.error =
				error instanceof Error ? error.message : String(error)
		}
	}

	console.log("🔍 Debug info:", debugInfo)
	res.json(debugInfo)
})

module.exports = router
