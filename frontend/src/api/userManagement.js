import axios from "axios"
import configManager from "../utils/config"

const API_BASE_URL = configManager.getApiUrl("/users")

// 创建axios实例
const userMgmtApi = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
})

// 请求拦截器
userMgmtApi.interceptors.request.use(
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
userMgmtApi.interceptors.response.use(
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

export const userManagementService = {
	// 获取用户列表
	getUsers: () => {
		return userMgmtApi.get("/")
	},

	// 创建用户
	createUser: (userData) => {
		return userMgmtApi.post("/", userData)
	},

	// 更新用户信息（用户名、邮箱）
	updateUser: (username, userData) => {
		return userMgmtApi.put(`/${username}`, userData)
	},

	// 删除用户
	deleteUser: (username) => {
		return userMgmtApi.delete(`/${username}`)
	},

	// 修改用户角色
	updateUserRole: (username, role) => {
		return userMgmtApi.put(`/${username}/role`, { role })
	},

	// 重置用户密码
	resetPassword: (username, newPassword) => {
		return userMgmtApi.post(`/${username}/reset-password`, { newPassword })
	},
}
