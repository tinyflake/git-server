import axios from "axios"

const api = axios.create({
	baseURL: "/api",
	timeout: 10000,
})

// 请求拦截器 - 添加JWT token
api.interceptors.request.use(
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
api.interceptors.response.use(
	(response) => response.data,
	(error) => {
		if (error.response?.status === 401) {
			// 清除本地存储的认证信息
			localStorage.removeItem("token")
			localStorage.removeItem("userInfo")
			// 跳转到登录页
			window.location.href = "/#/login"
		}
		console.error("API请求错误:", error)
		return Promise.reject(error)
	}
)

export const repoApi = {
	// 获取仓库列表（带权限过滤）
	getRepoList() {
		return api.get("/repos")
	},

	// 获取所有仓库列表（不带权限过滤，用于管理页面）
	getAllRepos() {
		return api.get("/repo/list")
	},

	// 获取服务器配置
	getConfig() {
		return api.get("/repo/config")
	},

	// 保存服务器配置（仅超管）
	saveConfig(config) {
		return api.post("/repo/config", config)
	},

	// 创建新仓库
	createRepo(data) {
		return api.post("/repo/create", data)
	},

	// 删除仓库（仅超管）
	deleteRepo(repoName, password) {
		return api.delete(`/repo/delete/${repoName}`, {
			data: { password },
		})
	},

	// 修改仓库路径
	updateRepoPath(data) {
		return api.post("/repo/update-path", data)
	},

	// 获取提交记录
	getCommitLog(repoPath) {
		return api.get("/repo/log", { params: { repoPath } })
	},

	// 获取文件列表
	getRepoFiles(repoPath) {
		return api.get("/repo/files", { params: { repoPath } })
	},

	// 检查仓库状态
	getRepoStatus(repoPath) {
		return api.get("/repo/status", { params: { repoPath } })
	},

	// 获取仓库文件列表
	getFileList(repoPath, path = "") {
		return api.get("/repo/file-list", { params: { repoPath, path } })
	},

	// 获取文件内容
	getFileContent(repoPath, filePath) {
		return api.get("/repo/file-content", { params: { repoPath, filePath } })
	},

	// 获取最新提交信息
	getLatestCommit(repoPath) {
		return api.get("/repo/latest-commit", { params: { repoPath } })
	},

	// 获取版本列表
	getVersions(repoPath) {
		return api.get("/repo/versions", { params: { repoPath } })
	},

	// 获取指定版本的文件内容
	getFileContentByVersion(repoPath, filePath, version) {
		return api.get("/repo/file-content-by-version", {
			params: { repoPath, filePath, version },
		})
	},

	// 获取package.json信息
	getPackageInfo(repoPath) {
		return api.get("/repo/package-info", { params: { repoPath } })
	},

	// 下载指定版本
	downloadVersion(repoPath, version, repoName) {
		const params = { repoPath, version, repoName }
		const url = `/api/repo/download-version?${new URLSearchParams(params)}`

		// 创建一个隐藏的链接来触发下载
		const link = document.createElement("a")
		link.href = url
		link.download = `${repoName}-${version.substring(0, 7)}.zip`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	},

	// 下载最新版本
	async downloadLatestVersion(repoPath, repoName) {
		try {
			// 先获取最新提交信息
			const latestCommit = await this.getLatestCommit(repoPath)
			if (latestCommit.code === 200 && latestCommit.data?.hash) {
				this.downloadVersion(repoPath, latestCommit.data.hash, repoName)
				return { success: true }
			} else {
				return { success: false, error: "无法获取最新版本信息" }
			}
		} catch (error) {
			console.error("下载最新版本失败:", error)
			return { success: false, error: error.message }
		}
	},

	// ==================== 文件浏览相关 API ====================

	// 获取文件树（支持懒加载）
	getFileTree(repoPath, branch = "main", path = "") {
		return api.get("/repo/file-tree", {
			params: { repoPath, branch, path },
		})
	},

	// 获取文件内容（带权限检查）
	getFileContentWithPermission(repoPath, filePath, branch = "main") {
		return api.get("/repo/file-content-with-permission", {
			params: { repoPath, filePath, branch },
		})
	},

	// 获取分支列表
	getBranches(repoPath) {
		return api.get("/repo/branches", { params: { repoPath } })
	},

	// 获取提交历史（支持分页）
	getCommits(repoPath, branch = "main", page = 1, pageSize = 20) {
		return api.get("/repo/commits", {
			params: { repoPath, branch, page, pageSize },
		})
	},

	// 下载单个文件
	downloadFile(repoPath, filePath, branch = "main") {
		const params = { repoPath, filePath, branch }
		const url = `/api/repo/file-content-with-permission?${new URLSearchParams(
			params
		)}`

		// 创建一个隐藏的链接来触发下载
		const link = document.createElement("a")
		link.href = url
		const fileName = filePath.split("/").pop()
		link.download = fileName
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	},

	// 检查代码查看权限
	checkCodePermission(repoPath) {
		return api.get("/repo/check-code-permission", { params: { repoPath } })
	},
}
