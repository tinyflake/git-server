const fs = require("fs")
const path = require("path")

class ConfigManager {
	constructor() {
		this.config = null
		this.loadConfig()
	}

	loadConfig() {
		try {
			// 优先级：环境变量 > config.json > 默认值
			const configPath = path.join(__dirname, "../../config.json")
			const defaultConfig = {
				server: {
					host: "localhost",
					port: 9001,
					timeout: 300000,
					maxGitUploadSize: "1024mb",
				},
				frontend: {
					host: "localhost",
					port: 3000,
				},
				git: {
					defaultRepoPath: "./repos",
				},
				deployment: {
					mode: "development",
				},
			}

			let fileConfig = {}
			if (fs.existsSync(configPath)) {
				const configContent = fs.readFileSync(configPath, "utf8")
				fileConfig = JSON.parse(configContent)
			}

			// 合并配置，环境变量优先级最高
			this.config = {
				server: {
					host:
						process.env.SERVER_HOST ||
						fileConfig.server?.host ||
						defaultConfig.server.host,
					port:
						parseInt(process.env.PORT) ||
						fileConfig.server?.port ||
						defaultConfig.server.port,
					timeout:
						parseInt(process.env.SERVER_TIMEOUT) ||
						fileConfig.server?.timeout ||
						defaultConfig.server.timeout,
					maxGitUploadSize:
						process.env.MAX_UPLOAD_SIZE ||
						fileConfig.server?.maxGitUploadSize ||
						defaultConfig.server.maxGitUploadSize,
				},
				frontend: {
					host:
						process.env.FRONTEND_HOST ||
						fileConfig.frontend?.host ||
						defaultConfig.frontend.host,
					port:
						parseInt(process.env.FRONTEND_PORT) ||
						fileConfig.frontend?.port ||
						defaultConfig.frontend.port,
				},
				git: {
					defaultRepoPath:
						process.env.DEFAULT_REPO_PATH ||
						fileConfig.git?.defaultRepoPath ||
						defaultConfig.git.defaultRepoPath,
				},
				deployment: {
					mode:
						process.env.NODE_ENV ||
						fileConfig.deployment?.mode ||
						defaultConfig.deployment.mode,
				},
			}

			console.log("📋 配置加载完成:", this.config)
		} catch (error) {
			console.error("❌ 配置加载失败:", error.message)
			throw error
		}
	}

	get(key) {
		const keys = key.split(".")
		let value = this.config
		for (const k of keys) {
			value = value?.[k]
		}
		return value
	}

	getServerUrl() {
		return `http://${this.config.server.host}:${this.config.server.port}`
	}

	getFrontendUrl() {
		return `http://${this.config.frontend.host}:${this.config.frontend.port}`
	}

	getGitUrl(repoName) {
		return `${this.getServerUrl()}/git/${repoName}.git`
	}

	// 保存配置到文件
	saveConfig(newConfig) {
		try {
			const configPath = path.join(__dirname, "../../config.json")

			// 深度合并配置
			this.config = {
				server: {
					...this.config.server,
					...newConfig.server,
				},
				frontend: {
					...this.config.frontend,
					...newConfig.frontend,
				},
				git: {
					...this.config.git,
					...newConfig.git,
				},
				deployment: {
					...this.config.deployment,
					...newConfig.deployment,
				},
			}

			fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2))
			console.log("💾 配置保存成功到:", configPath)
			console.log("💾 新配置:", this.config)
			return true
		} catch (error) {
			console.error("❌ 配置保存失败:", error.message)
			return false
		}
	}
}

// 单例模式
const configManager = new ConfigManager()
module.exports = configManager
