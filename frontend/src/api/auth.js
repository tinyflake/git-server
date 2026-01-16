import axios from "axios"
import configManager from "../utils/config"

const API_BASE_URL = configManager.getApiUrl("/auth")

// 创建axios实例
const authApi = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
})

// 请求拦截器 - 添加JWT token
authApi.interceptors.request.use(
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
authApi.interceptors.response.use(
	(response) => {
		return response.data
	},
	(error) => {
		if (error.response?.status === 401) {
			// 清除本地存储的认证信息
			localStorage.removeItem("token")
			localStorage.removeItem("userInfo")
			// 跳转到登录页
			window.location.href = "/#/login"
		}
		return Promise.reject(error)
	}
)

export const authApiService = {
	// 用户登录
	login: (credentials) => {
		return authApi.post("/login", credentials)
	},

	// 用户登出
	logout: () => {
		return authApi.post("/logout")
	},

	// 修改密码
	changePassword: (data) => {
		return authApi.post("/change-password", data)
	},

	// 获取当前用户信息
	getProfile: () => {
		return authApi.get("/profile")
	},
}

// 认证工具函数
export const authUtils = {
	// 登录
	login: async (username, password) => {
		try {
			const response = await authApiService.login({ username, password })
			if (response.code === 200) {
				localStorage.setItem("token", response.data.token)
				localStorage.setItem(
					"userInfo",
					JSON.stringify(response.data.user)
				)
				return response.data.user
			}
			throw new Error(response.msg || "登录失败")
		} catch (error) {
			throw error
		}
	},

	// 登出
	logout: async () => {
		try {
			await authApiService.logout()
		} catch (error) {
			console.error("登出失败:", error)
		} finally {
			localStorage.removeItem("token")
			localStorage.removeItem("userInfo")
		}
	},

	// 获取当前用户信息
	getCurrentUser: () => {
		const userInfo = localStorage.getItem("userInfo")
		return userInfo ? JSON.parse(userInfo) : null
	},

	// 检查是否已登录
	isLoggedIn: () => {
		return !!localStorage.getItem("token")
	},

	// 检查是否是超级管理员
	isSuperAdmin: () => {
		const user = authUtils.getCurrentUser()
		return user && user.role === "super_admin"
	},

	// 检查是否是管理员（包括超管）
	isAdmin: () => {
		const user = authUtils.getCurrentUser()
		return user && (user.role === "super_admin" || user.role === "admin")
	},

	// 检查是否是普通用户
	isUser: () => {
		const user = authUtils.getCurrentUser()
		return user && user.role === "user"
	},
}
