const express = require("express")
const router = express.Router()
const fs = require("fs-extra")
const path = require("path")
const archiver = require("archiver")
const unzipper = require("unzipper")
const multer = require("multer")
const { authenticateJWT, requireSuperAdmin } = require("../utils/jwt-utils")

// 配置 multer 用于文件上传
const uploadDir = path.join(__dirname, "../temp/uploads")

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
	console.log("✅ 创建上传目录:", uploadDir)
}

const upload = multer({
	dest: uploadDir,
	limits: {
		fileSize: 10 * 1024 * 1024 * 1024, // 10GB
	},
})

// 导出进度跟踪
const exportProgress = new Map()
// 导入进度跟踪
const importProgress = new Map()

/**
 * 导出所有数据
 * POST /api/migration/export
 */
router.post("/export", authenticateJWT, requireSuperAdmin, async (req, res) => {
	const taskId = Date.now().toString()

	try {
		console.log("🚀 开始导出数据...")

		// 初始化进度
		exportProgress.set(taskId, {
			progress: 0,
			message: "准备导出...",
			status: "running",
		})

		// 设置响应头
		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, "-")
			.slice(0, -5)
		const filename = `data-backup-${timestamp}.zip`

		res.setHeader("Content-Type", "application/zip")
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${filename}"`,
		)
		res.setHeader("X-Task-Id", taskId)

		// 创建 zip 流
		const archive = archiver("zip", {
			zlib: { level: 9 },
		})

		// 监听错误
		archive.on("error", (err) => {
			console.error("❌ 压缩失败:", err)
			exportProgress.set(taskId, {
				progress: 0,
				message: `导出失败: ${err.message}`,
				status: "error",
			})
			throw err
		})

		// 监听进度
		let totalBytes = 0
		archive.on("progress", (progress) => {
			totalBytes = progress.fs.processedBytes
			const percent = Math.min(
				90,
				Math.floor(
					(progress.entries.processed / progress.entries.total) * 90,
				),
			)
			exportProgress.set(taskId, {
				progress: percent,
				message: `正在压缩文件 (${progress.entries.processed}/${progress.entries.total})...`,
				status: "running",
			})
		})

		// 管道到响应
		archive.pipe(res)

		// 更新进度：10%
		exportProgress.set(taskId, {
			progress: 10,
			message: "正在读取配置文件...",
			status: "running",
		})

		// 1. 添加 manifest.json（元数据）
		const configPath = path.join(__dirname, "../config")
		const usersConfig = await fs.readJson(
			path.join(configPath, "users.json"),
		)
		const repoConfig = await fs.readJson(
			path.join(configPath, "repo-config.json"),
		)

		const manifest = {
			version: "2.0.0",
			dataVersion: "1",
			exportTime: new Date().toISOString(),
			userCount: usersConfig.users?.length || 0,
			repoCount: repoConfig.repoList?.length || 0,
			exportedBy: req.user.username,
		}

		archive.append(JSON.stringify(manifest, null, 2), {
			name: "manifest.json",
		})

		// 更新进度：20%
		exportProgress.set(taskId, {
			progress: 20,
			message: "正在打包用户配置...",
			status: "running",
		})

		// 2. 添加配置文件
		archive.directory(configPath, "config")

		// 更新进度：30%
		exportProgress.set(taskId, {
			progress: 30,
			message: "正在打包仓库数据...",
			status: "running",
		})

		// 3. 添加仓库目录
		const reposPath = path.join(__dirname, "../../repos")
		if (await fs.pathExists(reposPath)) {
			archive.directory(reposPath, "repos")
		}

		// 完成打包
		exportProgress.set(taskId, {
			progress: 95,
			message: "正在完成压缩...",
			status: "running",
		})

		await archive.finalize()

		// 完成
		exportProgress.set(taskId, {
			progress: 100,
			message: "导出完成",
			status: "completed",
			fileSize: totalBytes,
		})

		console.log(
			`✅ 数据导出完成: ${filename} (${(totalBytes / 1024 / 1024).toFixed(
				2,
			)} MB)`,
		)

		// 5分钟后清理进度记录
		setTimeout(
			() => {
				exportProgress.delete(taskId)
			},
			5 * 60 * 1000,
		)
	} catch (error) {
		console.error("❌ 导出数据失败:", error)
		exportProgress.set(taskId, {
			progress: 0,
			message: `导出失败: ${error.message}`,
			status: "error",
		})

		if (!res.headersSent) {
			res.status(500).json({
				code: 500,
				msg: "导出失败",
				error: error.message,
			})
		}
	}
})

/**
 * 获取导出进度
 * GET /api/migration/export-progress/:taskId
 */
router.get(
	"/export-progress/:taskId",
	authenticateJWT,
	requireSuperAdmin,
	(req, res) => {
		const { taskId } = req.params
		const progress = exportProgress.get(taskId)

		if (!progress) {
			return res.json({
				code: 404,
				msg: "任务不存在",
				data: null,
			})
		}

		res.json({
			code: 200,
			data: progress,
		})
	},
)

/**
 * 导入数据
 * POST /api/migration/import
 */
router.post(
	"/import",
	authenticateJWT,
	requireSuperAdmin,
	(req, res, next) => {
		// 使用 multer 中间件，并捕获错误
		upload.single("file")(req, res, (err) => {
			if (err) {
				console.error("❌ Multer 错误:", err)
				return res.status(400).json({
					code: 400,
					msg: "文件上传失败",
					error: err.message,
				})
			}
			next()
		})
	},
	async (req, res) => {
		const taskId = Date.now().toString()

		try {
			console.log("🚀 开始导入数据...")
			console.log("📋 请求信息:")
			console.log("  - Content-Type:", req.headers["content-type"])
			console.log("  - 文件对象:", req.file ? "存在" : "不存在")

			if (req.file) {
				console.log("  - 文件名:", req.file.originalname)
				console.log("  - 文件大小:", req.file.size, "bytes")
				console.log("  - 临时路径:", req.file.path)
			}

			if (!req.file) {
				console.log("❌ 未接收到文件")
				return res.status(400).json({
					code: 400,
					msg: "未上传文件",
				})
			}

			// 初始化进度
			importProgress.set(taskId, {
				progress: 0,
				message: "准备导入...",
				status: "running",
			})

			console.log("✅ 返回任务ID:", taskId)

			// 返回任务ID
			res.json({
				code: 200,
				msg: "开始导入",
				data: { taskId },
			})

			console.log("✅ 响应已发送")
			console.log("📊 当前进度Map大小:", importProgress.size)
			console.log("📋 任务列表:", Array.from(importProgress.keys()))
			console.log("🔄 准备调用 processImport...")

			// 异步处理导入
			processImport(taskId, req.file)
				.then(() => {
					console.log("✅ processImport 执行完成")
				})
				.catch((error) => {
					console.error("❌ processImport 执行失败:", error)
					console.error("错误堆栈:", error.stack)
					importProgress.set(taskId, {
						progress: 0,
						message: `导入失败: ${error.message}`,
						status: "error",
					})
				})
		} catch (error) {
			console.error("❌ 导入数据失败:", error)
			console.error("错误堆栈:", error.stack)

			if (!res.headersSent) {
				res.status(500).json({
					code: 500,
					msg: "导入失败",
					error: error.message,
				})
			}
		}
	},
)

/**
 * 处理导入逻辑
 */
async function processImport(taskId, uploadedFile) {
	console.log("🔄 processImport 开始执行")
	console.log("  - 任务ID:", taskId)
	console.log("  - 文件信息:", uploadedFile)

	const tempDir = path.join(__dirname, "../temp", taskId)
	const backupDir = path.join(__dirname, "../backup", taskId)

	try {
		console.log("📁 创建临时目录...")
		console.log("  - tempDir:", tempDir)
		console.log("  - backupDir:", backupDir)

		// 创建临时目录
		await fs.ensureDir(tempDir)
		await fs.ensureDir(backupDir)

		console.log("✅ 临时目录创建成功")

		// 更新进度：10%
		console.log("📝 更新进度: 10%")
		importProgress.set(taskId, {
			progress: 10,
			message: "正在接收文件...",
			status: "running",
		})

		console.log("✅ 进度已更新")
		console.log("📊 当前进度Map大小:", importProgress.size)

		// 移动上传的文件到临时目录
		console.log("📦 移动上传文件...")
		const uploadPath = path.join(tempDir, "upload.zip")
		console.log("  - 源路径:", uploadedFile.path)
		console.log("  - 目标路径:", uploadPath)

		await fs.move(uploadedFile.path, uploadPath, { overwrite: true })
		console.log("✅ 文件移动成功")

		// 更新进度：20%
		importProgress.set(taskId, {
			progress: 20,
			message: "正在解压文件...",
			status: "running",
		})

		// 解压文件
		const extractPath = path.join(tempDir, "extracted")
		await fs.ensureDir(extractPath)

		await new Promise((resolve, reject) => {
			fs.createReadStream(uploadPath)
				.pipe(unzipper.Extract({ path: extractPath }))
				.on("close", resolve)
				.on("error", reject)
		})

		// 更新进度：30%
		importProgress.set(taskId, {
			progress: 30,
			message: "正在验证数据...",
			status: "running",
		})

		// 验证 manifest.json
		const manifestPath = path.join(extractPath, "manifest.json")
		if (!(await fs.pathExists(manifestPath))) {
			throw new Error("无效的备份文件：缺少 manifest.json")
		}

		const manifest = await fs.readJson(manifestPath)
		console.log("📋 备份信息:", manifest)

		// 更新进度：40%
		importProgress.set(taskId, {
			progress: 40,
			message: "正在备份当前数据...",
			status: "running",
		})

		// 备份当前数据（以防万一）
		const configPath = path.join(__dirname, "../config")
		const reposPath = path.join(__dirname, "../../repos")

		if (await fs.pathExists(configPath)) {
			await fs.copy(configPath, path.join(backupDir, "config"))
		}
		if (await fs.pathExists(reposPath)) {
			await fs.copy(reposPath, path.join(backupDir, "repos"))
		}

		// 更新进度：50%
		importProgress.set(taskId, {
			progress: 50,
			message: "正在恢复配置文件...",
			status: "running",
		})

		// 恢复配置文件
		const extractedConfigPath = path.join(extractPath, "config")
		if (await fs.pathExists(extractedConfigPath)) {
			await fs.emptyDir(configPath)
			await fs.copy(extractedConfigPath, configPath)
		}

		// 更新进度：70%
		importProgress.set(taskId, {
			progress: 70,
			message: "正在恢复仓库数据...",
			status: "running",
		})

		// 恢复仓库目录
		const extractedReposPath = path.join(extractPath, "repos")
		if (await fs.pathExists(extractedReposPath)) {
			await fs.emptyDir(reposPath)
			await fs.copy(extractedReposPath, reposPath)
		}

		// 更新进度：90%
		importProgress.set(taskId, {
			progress: 90,
			message: "正在验证数据完整性...",
			status: "running",
		})

		// 验证恢复的数据
		const usersConfigPath = path.join(configPath, "users.json")
		const repoConfigPath = path.join(configPath, "repo-config.json")

		if (!(await fs.pathExists(usersConfigPath))) {
			throw new Error("数据恢复失败：users.json 不存在")
		}
		if (!(await fs.pathExists(repoConfigPath))) {
			throw new Error("数据恢复失败：repo-config.json 不存在")
		}

		// 读取恢复的数据统计
		const usersConfig = await fs.readJson(usersConfigPath)
		const repoConfig = await fs.readJson(repoConfigPath)

		// 更新进度：100%
		importProgress.set(taskId, {
			progress: 100,
			message: "导入完成",
			status: "completed",
			stats: {
				userCount: usersConfig.users?.length || 0,
				repoCount: repoConfig.repoList?.length || 0,
				exportTime: manifest.exportTime,
			},
		})

		console.log(`✅ 数据导入完成`)
		console.log(`   - 用户数: ${usersConfig.users?.length || 0}`)
		console.log(`   - 仓库数: ${repoConfig.repoList?.length || 0}`)

		// 清理临时文件（5分钟后）
		setTimeout(
			async () => {
				await fs.remove(tempDir)
				console.log(`🧹 清理临时文件: ${tempDir}`)
			},
			5 * 60 * 1000,
		)

		// 保留备份文件24小时
		setTimeout(
			async () => {
				await fs.remove(backupDir)
				console.log(`🧹 清理备份文件: ${backupDir}`)
			},
			24 * 60 * 60 * 1000,
		)
	} catch (error) {
		console.error("❌ 导入处理失败:", error)

		// 尝试回滚
		try {
			importProgress.set(taskId, {
				progress: 0,
				message: "导入失败，正在回滚...",
				status: "rolling_back",
			})

			const configPath = path.join(__dirname, "../config")
			const reposPath = path.join(__dirname, "../../repos")

			// 恢复备份
			if (await fs.pathExists(path.join(backupDir, "config"))) {
				await fs.emptyDir(configPath)
				await fs.copy(path.join(backupDir, "config"), configPath)
			}
			if (await fs.pathExists(path.join(backupDir, "repos"))) {
				await fs.emptyDir(reposPath)
				await fs.copy(path.join(backupDir, "repos"), reposPath)
			}

			console.log("✅ 已回滚到导入前的状态")
		} catch (rollbackError) {
			console.error("❌ 回滚失败:", rollbackError)
		}

		importProgress.set(taskId, {
			progress: 0,
			message: `导入失败: ${error.message}`,
			status: "error",
		})

		// 清理临时文件
		await fs.remove(tempDir)

		throw error
	}
}

/**
 * 获取导入进度
 * GET /api/migration/import-progress/:taskId
 */
router.get(
	"/import-progress/:taskId",
	authenticateJWT,
	requireSuperAdmin,
	(req, res) => {
		const { taskId } = req.params
		const progress = importProgress.get(taskId)

		if (!progress) {
			return res.json({
				code: 404,
				msg: "任务不存在",
				data: null,
			})
		}

		res.json({
			code: 200,
			data: progress,
		})
	},
)

/**
 * 获取数据统计
 * GET /api/migration/stats
 */
router.get("/stats", authenticateJWT, requireSuperAdmin, async (req, res) => {
	console.log("📊 收到统计请求 - 新版本代码已加载！")
	try {
		const configPath = path.join(__dirname, "../config")
		const reposPath = path.join(__dirname, "../../repos")

		// 读取配置
		const usersConfig = await fs.readJson(
			path.join(configPath, "users.json"),
		)
		const repoConfig = await fs.readJson(
			path.join(configPath, "repo-config.json"),
		)

		// 计算仓库总大小
		let totalSize = 0
		if (await fs.pathExists(reposPath)) {
			const repos = await fs.readdir(reposPath)
			for (const repo of repos) {
				const repoPath = path.join(reposPath, repo)
				const stat = await fs.stat(repoPath)
				if (stat.isDirectory()) {
					// 简单估算（实际应该递归计算）
					totalSize += await getDirectorySize(repoPath)
				}
			}
		}

		res.json({
			code: 200,
			data: {
				userCount: usersConfig.users?.length || 0,
				repoCount: repoConfig.repoList?.length || 0,
				totalSize: totalSize,
				estimatedZipSize: Math.floor(totalSize * 0.6), // 估算压缩后大小（60%）
			},
		})
	} catch (error) {
		console.error("❌ 获取统计信息失败:", error)
		res.status(500).json({
			code: 500,
			msg: "获取统计信息失败",
			error: error.message,
		})
	}
})

/**
 * 递归计算目录大小
 */
async function getDirectorySize(dirPath) {
	let size = 0
	try {
		const files = await fs.readdir(dirPath)
		for (const file of files) {
			const filePath = path.join(dirPath, file)
			const stat = await fs.stat(filePath)
			if (stat.isDirectory()) {
				size += await getDirectorySize(filePath)
			} else {
				size += stat.size
			}
		}
	} catch (error) {
		console.error(`计算目录大小失败: ${dirPath}`, error)
	}
	return size
}

module.exports = router
