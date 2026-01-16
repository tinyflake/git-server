// 前端配置管理
class ConfigManager {
	constructor() {
		this.serverConfig = null
		this.configLoaded = false
	}

	// 获取后端服务器 URL（使用当前访问的域名）
	getServerUrl() {
		// 1. 优先使用 localStorage 中保存的配置（用户通过界面修改）
		const savedConfig = localStorage.getItem("gitServerConfig")
		if (savedConfig) {
			try {
				const parsed = JSON.parse(savedConfig)
				if (parsed.serverIP && parsed.serverPort) {
					console.log("✅ 使用本地保存的配置:", parsed)
					const protocol = window.location.protocol
					const port = parsed.serverPort

					// 如果是标准端口，不显示端口号
					if (
						(protocol === "http:" && port === 80) ||
						(protocol === "https:" && port === 443)
					) {
						return `${protocol}//${parsed.serverIP}`
					}
					return `${protocol}//${parsed.serverIP}:${port}`
				}
			} catch (error) {
				console.warn("⚠️  解析本地配置失败:", error)
			}
		}

		// 2. 使用当前访问的域名（前后端同域名部署）
		const url = window.location.origin
		console.log("✅ 使用当前域名作为后端地址:", url)
		return url
	}

	// 从服务器获取配置（用于同步最新配置）
	async fetchServerConfig() {
		try {
			const response = await fetch(
				`${this.getServerUrl()}/api/repo/config`
			)
			const result = await response.json()
			if (result.code === 200) {
				this.serverConfig = result.data
				this.configLoaded = true
				console.log("✅ 从服务器获取配置成功:", this.serverConfig)
				return this.serverConfig
			}
		} catch (error) {
			console.warn("⚠️  无法获取服务器配置:", error)
		}
		return null
	}

	// 更新配置（用户保存配置后调用）
	updateConfig(newConfig) {
		// 保存到 localStorage
		if (newConfig.serverIP || newConfig.serverPort) {
			const config = {
				serverIP: newConfig.serverIP,
				serverPort: newConfig.serverPort,
				defaultRepoPath: newConfig.defaultRepoPath,
			}
			localStorage.setItem("gitServerConfig", JSON.stringify(config))
			console.log("✅ 配置已保存到 localStorage:", config)
		}

		// 同时更新 serverConfig
		if (this.serverConfig) {
			this.serverConfig.serverIP =
				newConfig.serverIP || this.serverConfig.serverIP
			this.serverConfig.serverPort =
				newConfig.serverPort || this.serverConfig.serverPort
			this.serverConfig.defaultRepoPath =
				newConfig.defaultRepoPath || this.serverConfig.defaultRepoPath
		}
	}

	getApiUrl(path = "") {
		return `${this.getServerUrl()}/api${path}`
	}

	getGitUrl(repoName) {
		return `${this.getServerUrl()}/git/${repoName}.git`
	}

	// 获取配置信息用于显示
	getDisplayConfig() {
		// 如果有服务器配置，优先使用服务器配置
		if (this.serverConfig) {
			return {
				serverIP: this.serverConfig.serverIP,
				serverPort: this.serverConfig.serverPort,
				serverUrl: this.serverConfig.serverUrl,
				defaultRepoPath: this.serverConfig.defaultRepoPath,
			}
		}

		// 否则使用当前域名
		const url = new URL(window.location.origin)
		return {
			serverIP: url.hostname,
			serverPort: url.port || (url.protocol === "https:" ? 443 : 80),
			serverUrl: this.getServerUrl(),
			defaultRepoPath: "./repos",
		}
	}
}

// 单例模式
const configManager = new ConfigManager()
export default configManager
