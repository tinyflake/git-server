// 时间工具函数

/**
 * 获取UTC+8时间字符串
 * @returns {string} 格式化的UTC+8时间字符串
 */
function getUTC8TimeString() {
	const now = new Date()
	// 获取UTC时间戳，然后加上8小时（8 * 60 * 60 * 1000毫秒）
	const utc8Time = new Date(now.getTime() + 8 * 60 * 60 * 1000)

	// 格式化为 YYYY-MM-DD HH:mm:ss (UTC+8)
	const year = utc8Time.getUTCFullYear()
	const month = String(utc8Time.getUTCMonth() + 1).padStart(2, "0")
	const day = String(utc8Time.getUTCDate()).padStart(2, "0")
	const hours = String(utc8Time.getUTCHours()).padStart(2, "0")
	const minutes = String(utc8Time.getUTCMinutes()).padStart(2, "0")
	const seconds = String(utc8Time.getUTCSeconds()).padStart(2, "0")

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (UTC+8)`
}

/**
 * 获取UTC+8的ISO字符串（用于存储）
 * @returns {string} ISO格式的UTC+8时间字符串
 */
function getUTC8ISOString() {
	const now = new Date()
	const utc8Time = new Date(now.getTime() + 8 * 60 * 60 * 1000)
	return utc8Time.toISOString().replace("Z", "+08:00")
}

/**
 * 将UTC时间转换为UTC+8显示格式
 * @param {string|Date} utcTime UTC时间
 * @returns {string} 格式化的UTC+8时间字符串
 */
function formatToUTC8(utcTime) {
	const date = new Date(utcTime)
	const utc8Time = new Date(date.getTime() + 8 * 60 * 60 * 1000)

	const year = utc8Time.getUTCFullYear()
	const month = String(utc8Time.getUTCMonth() + 1).padStart(2, "0")
	const day = String(utc8Time.getUTCDate()).padStart(2, "0")
	const hours = String(utc8Time.getUTCHours()).padStart(2, "0")
	const minutes = String(utc8Time.getUTCMinutes()).padStart(2, "0")
	const seconds = String(utc8Time.getUTCSeconds()).padStart(2, "0")

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (UTC+8)`
}

/**
 * 获取当前UTC+8时间戳（用于日志记录）
 * @returns {string} UTC+8时间戳
 */
function getCurrentUTC8Timestamp() {
	return getUTC8ISOString()
}

module.exports = {
	getUTC8TimeString,
	getUTC8ISOString,
	formatToUTC8,
	getCurrentUTC8Timestamp,
}
