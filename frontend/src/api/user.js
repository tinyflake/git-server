import axios from "axios"
import configManager from "../utils/config"

const API_BASE_URL = configManager.getApiUrl("/users")

// 创建axios实例
const userApi = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
})

// 请求拦截器 - 添加认证头
userApi.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("authToken")
		if (token) {
			config.headers.Authorization = `Basic ${token}`
		}
		return config
	},
	(error) => {
		return Promise.reject(error)
	}
)

// 响应拦截器 - 处理认证错误
userApi.interceptors.response.use(
	(response) => {
		return response.data
	},
	(error) => {
		if (error.response?.status === 401) {
			// 清除本地存储的认证信息
			localStorage.removeItem("authToken")
			localStorage.removeItem("userInfo")
			// 可以在这里跳转到登录页面
		}
		return Promise.reject(error)
	}
)

export const userApiService = {
	// 用户登录
	login: (credentials) => {
		return userApi.post("/login", credentials)
	},

	// 获取用户信息
	getProfile: () => {
		return userApi.get("/profile")
	},

	// 获取用户列表（管理员）
	getUsers: () => {
		return userApi.get("/users")
	},

	// 创建用户（管理员）
	createUser: (userData) => {
		return userApi.post("/users", userData)
	},

	// 获取Git操作日志
	getLogs: (params = {}) => {
		return userApi.get("/logs", { params })
	},

	// 获取仓库统计
	getRepositoryStats: (repoName) => {
		return userApi.get(`/stats/repository/${repoName}`)
	},

	// 获取用户统计
	getUserStats: (username) => {
		return userApi.get(`/stats/user/${username}`)
	},

	// 获取当前用户统计
	getCurrentUserStats: () => {
		return userApi.get("/stats/user")
	},

	// 获取系统统计（管理员）
	getSystemStats: () => {
		return userApi.get("/stats/system")
	},
}

// 认证工具函数
export const authUtils = {
	// 登录
	login: async (username, password) => {
		try {
			const response = await userApiService.login({ username, password })
			if (response.code === 200) {
				// 生成Basic Auth token
				const token = btoa(`${username}:${password}`)
				localStorage.setItem("authToken", token)
				localStorage.setItem("userInfo", JSON.stringify(response.data))
				return response.data
			}
			throw new Error(response.msg || "登录失败")
		} catch (error) {
			throw error
		}
	},

	// 登出
	logout: () => {
		localStorage.removeItem("authToken")
		localStorage.removeItem("userInfo")
	},

	// 获取当前用户信息
	getCurrentUser: () => {
		const userInfo = localStorage.getItem("userInfo")
		return userInfo ? JSON.parse(userInfo) : null
	},

	// 检查是否已登录
	isLoggedIn: () => {
		return !!localStorage.getItem("authToken")
	},

	// 检查是否是管理员
	isAdmin: () => {
		const user = authUtils.getCurrentUser()
		return user && user.role === "admin"
	},
}
