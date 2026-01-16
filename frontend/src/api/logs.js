import axios from "axios"
import configManager from "../utils/config"

const API_BASE_URL = configManager.getApiUrl("/logs")

// 创建axios实例
const logsApi = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
})

// 请求拦截器
logsApi.interceptors.request.use(
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

// 响应拦截器
logsApi.interceptors.response.use(
	(response) => {
		return response.data
	},
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("token")
			localStorage.removeItem("userInfo")
			window.location.href = "/#/login"
		}
		return Promise.reject(error)
	}
)

export const logsService = {
	// 获取操作日志
	getLogs: (params = {}) => {
		return logsApi.get("/", { params })
	},
}
