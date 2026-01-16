const express = require("express")
const router = express.Router()
const { authenticateJWT, requireAdmin } = require("../utils/jwt-utils")
const { getOperationLogs } = require("../utils/operation-logger")

/**
 * 获取操作日志（管理员+超管）
 */
router.get("/", authenticateJWT, requireAdmin, (req, res) => {
	try {
		const { operator, action, target, limit } = req.query

		const filters = {
			limit: limit ? parseInt(limit) : 100,
		}

		if (operator) filters.operator = operator
		if (action) filters.action = action
		if (target) filters.target = target

		const logs = getOperationLogs(filters)

		res.json({
			code: 200,
			data: logs,
		})
	} catch (error) {
		console.error("获取操作日志失败:", error)
		res.status(500).json({ error: "获取操作日志失败" })
	}
})

module.exports = router
