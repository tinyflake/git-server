const fs = require("fs-extra")
const path = require("path")
const { getCurrentUTC8Timestamp } = require("./time-utils")

// 日志文件路径
const LOGS_DIR = path.join(__dirname, "../logs")
const GIT_LOGS_PATH = path.join(LOGS_DIR, "git-operations.json")

// 初始化日志目录和文件
function initGitLogs() {
	try {
		// 确保日志目录存在
		fs.ensureDirSync(LOGS_DIR)

		// 如果日志文件不存在，创建空的日志文件
		if (!fs.existsSync(GIT_LOGS_PATH)) {
			fs.writeJsonSync(GIT_LOGS_PATH, { logs: [] }, { spaces: 2 })
		}
	} catch (error) {
		console.error("初始化Git日志失败:", error)
	}
}

// 记录Git操作
function logGitOperation(operation) {
	try {
		initGitLogs()

		const logEntry = {
			id: generateLogId(),
			timestamp: getCurrentUTC8Timestamp(),
			operation: operation.type, // 'clone', 'push', 'pull', 'fetch'
			repository: operation.repository,
			user: operation.user || null,
			userAgent: operation.userAgent || null,
			clientIP: operation.clientIP || null,
			success: operation.success !== false, // 默认为成功
			error: operation.error || null,
			details: operation.details || {},
			duration: operation.duration || null,
		}

		// 读取现有日志
		const logsData = fs.readJsonSync(GIT_LOGS_PATH)
		logsData.logs.push(logEntry)

		// 保持最近1000条日志
		if (logsData.logs.length > 1000) {
			logsData.logs = logsData.logs.slice(-1000)
		}

		// 写入日志文件
		fs.writeJsonSync(GIT_LOGS_PATH, logsData, { spaces: 2 })

		console.log(
			`📝 Git操作日志记录: ${operation.type} - ${operation.repository} - ${operation.user?.username || "anonymous"}`,
		)

		return logEntry
	} catch (error) {
		console.error("记录Git操作日志失败:", error)
		return null
	}
}

// 生成日志ID
function generateLogId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取Git操作日志
function getGitLogs(options = {}) {
	try {
		initGitLogs()
		const logsData = fs.readJsonSync(GIT_LOGS_PATH)
		let logs = logsData.logs || []

		// 按时间倒序排列
		logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

		// 应用过滤器
		if (options.repository) {
			logs = logs.filter((log) => log.repository === options.repository)
		}

		if (options.user) {
			logs = logs.filter(
				(log) => log.user && log.user.username === options.user,
			)
		}

		if (options.operation) {
			logs = logs.filter((log) => log.operation === options.operation)
		}

		if (options.limit) {
			logs = logs.slice(0, options.limit)
		}

		return logs
	} catch (error) {
		console.error("获取Git日志失败:", error)
		return []
	}
}

// 获取仓库统计信息
function getRepositoryStats(repoName) {
	try {
		const logs = getGitLogs({ repository: repoName })

		const stats = {
			totalOperations: logs.length,
			pushCount: logs.filter((log) => log.operation === "push").length,
			cloneCount: logs.filter((log) => log.operation === "clone").length,
			pullCount: logs.filter((log) => log.operation === "pull").length,
			uniqueUsers: [
				...new Set(
					logs
						.filter((log) => log.user)
						.map((log) => log.user.username),
				),
			],
			lastActivity: logs.length > 0 ? logs[0].timestamp : null,
			recentOperations: logs.slice(0, 10),
		}

		return stats
	} catch (error) {
		console.error("获取仓库统计失败:", error)
		return null
	}
}

// 获取用户统计信息
function getUserStats(username) {
	try {
		const logs = getGitLogs({ user: username })

		const stats = {
			totalOperations: logs.length,
			pushCount: logs.filter((log) => log.operation === "push").length,
			cloneCount: logs.filter((log) => log.operation === "clone").length,
			pullCount: logs.filter((log) => log.operation === "pull").length,
			repositories: [...new Set(logs.map((log) => log.repository))],
			lastActivity: logs.length > 0 ? logs[0].timestamp : null,
			recentOperations: logs.slice(0, 10),
		}

		return stats
	} catch (error) {
		console.error("获取用户统计失败:", error)
		return null
	}
}

// 清理旧日志
function cleanupOldLogs(daysToKeep = 30) {
	try {
		initGitLogs()
		const logsData = fs.readJsonSync(GIT_LOGS_PATH)
		const cutoffDate = new Date()
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

		const filteredLogs = logsData.logs.filter(
			(log) => new Date(log.timestamp) > cutoffDate,
		)

		logsData.logs = filteredLogs
		fs.writeJsonSync(GIT_LOGS_PATH, logsData, { spaces: 2 })

		console.log(
			`🧹 清理了 ${logsData.logs.length - filteredLogs.length} 条旧日志`,
		)
		return true
	} catch (error) {
		console.error("清理旧日志失败:", error)
		return false
	}
}

module.exports = {
	initGitLogs,
	logGitOperation,
	getGitLogs,
	getRepositoryStats,
	getUserStats,
	cleanupOldLogs,
}
