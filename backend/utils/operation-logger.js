const fs = require("fs-extra")
const path = require("path")

const OPERATION_LOGS_PATH = path.join(__dirname, "../logs/operation-logs.json")

/**
 * 初始化操作日志文件
 */
function initOperationLogs() {
	const logsDir = path.dirname(OPERATION_LOGS_PATH)
	if (!fs.existsSync(logsDir)) {
		fs.mkdirSync(logsDir, { recursive: true })
	}

	if (!fs.existsSync(OPERATION_LOGS_PATH)) {
		fs.writeJsonSync(OPERATION_LOGS_PATH, [], { spaces: 2 })
	}
}

/**
 * 记录操作日志
 */
function logOperation(operator, action, target, details = "") {
	try {
		initOperationLogs()

		const logs = fs.readJsonSync(OPERATION_LOGS_PATH)

		const logEntry = {
			id: Date.now().toString(),
			timestamp: new Date().toISOString(),
			operator,
			action,
			target,
			details,
		}

		logs.unshift(logEntry) // 新日志放在前面

		// 只保留最近1000条日志
		if (logs.length > 1000) {
			logs.splice(1000)
		}

		fs.writeJsonSync(OPERATION_LOGS_PATH, logs, { spaces: 2 })

		console.log(`[操作日志] ${operator} ${action} ${target}`)
	} catch (error) {
		console.error("记录操作日志失败:", error)
	}
}

/**
 * 获取操作日志
 */
function getOperationLogs(filters = {}) {
	try {
		initOperationLogs()

		let logs = fs.readJsonSync(OPERATION_LOGS_PATH)

		// 确保 logs 是数组
		if (!logs || !Array.isArray(logs)) {
			logs = []
		}

		// 过滤
		if (filters.operator) {
			logs = logs.filter((log) => log.operator === filters.operator)
		}

		if (filters.action) {
			logs = logs.filter((log) => log.action === filters.action)
		}

		if (filters.target) {
			logs = logs.filter((log) => log.target === filters.target)
		}

		// 限制数量
		const limit = filters.limit || 100
		return logs.slice(0, limit)
	} catch (error) {
		console.error("获取操作日志失败:", error)
		return []
	}
}

/**
 * 清空操作日志（仅用于测试）
 */
function clearOperationLogs() {
	try {
		fs.writeJsonSync(OPERATION_LOGS_PATH, [], { spaces: 2 })
		console.log("操作日志已清空")
	} catch (error) {
		console.error("清空操作日志失败:", error)
	}
}

module.exports = {
	initOperationLogs,
	logOperation,
	getOperationLogs,
	clearOperationLogs,
}
