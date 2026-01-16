import axios from "axios"
import configManager from "../utils/config"

const getApiUrl = () => {
	return configManager.getApiUrl()
}

// 创建 axios 实例
const createAxiosInstance = () => {
	const instance = axios.create({
		baseURL: getApiUrl(),
		timeout: 300000, // 5分钟超时（导出可能需要较长时间）
	})

	// 请求拦截器
	instance.interceptors.request.use(
		(config) => {
			const token = localStorage.getItem("token")
			if (token) {
				config.headers.Authorization = `Bearer ${token}`
			}
			return config
		},
		(error) => {
			return Promise.reject(error)
		}
	)

	return instance
}

/**
 * 数据迁移 API
 */
export const migrationApi = {
	/**
	 * 获取数据统计
	 */
	async getStats() {
		const instance = createAxiosInstance()
		const response = await instance.get("/migration/stats")
		return response.data
	},

	/**
	 * 导出数据
	 */
	async exportData() {
		const instance = createAxiosInstance()
		const response = await instance.post(
			"/migration/export",
			{},
			{
				responseType: "blob", // 重要：接收二进制数据
			}
		)
		return response
	},

	/**
	 * 获取导出进度
	 */
	async getExportProgress(taskId) {
		const instance = createAxiosInstance()
		const response = await instance.get(
			`/migration/export-progress/${taskId}`
		)
		return response.data
	},

	/**
	 * 导入数据
	 */
	async importData(file) {
		const instance = createAxiosInstance()
		const formData = new FormData()
		formData.append("file", file)

		const response = await instance.post("/migration/import", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		})
		return response.data
	},

	/**
	 * 获取导入进度
	 */
	async getImportProgress(taskId) {
		const instance = createAxiosInstance()
		const response = await instance.get(
			`/migration/import-progress/${taskId}`
		)
		return response.data
	},
}
