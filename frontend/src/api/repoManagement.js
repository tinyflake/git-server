import axios from "axios"
import configManager from "../utils/config"

const API_BASE_URL = configManager.getApiUrl("/repos")

// 创建axios实例
const repoMgmtApi = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
})

// 请求拦截器
repoMgmtApi.interceptors.request.use(
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
repoMgmtApi.interceptors.response.use(
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

export const repoManagementService = {
	// 获取有权限的仓库列表
	getRepos: () => {
		return repoMgmtApi.get("/")
	},

	// 获取仓库白名单
	getWhitelist: (repoName) => {
		return repoMgmtApi.get(`/${repoName}/whitelist`)
	},

	// 设置仓库白名单
	setWhitelist: (repoName, whitelist) => {
		return repoMgmtApi.put(`/${repoName}/whitelist`, { whitelist })
	},

	// 获取仓库代码查看权限
	getCodeViewPermission: (repoName) => {
		return repoMgmtApi.get(`/${repoName}/code-view-permission`)
	},

	// 设置仓库代码查看权限
	setCodeViewPermission: (repoName, enabled, allowedUsers) => {
		return repoMgmtApi.put(`/${repoName}/code-view-permission`, {
			enabled,
			allowedUsers,
		})
	},
}
