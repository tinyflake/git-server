#!/usr/bin/env node

/**
 * Git Server - 入口文件
 * 提供编程式 API 和 CLI 启动功能
 */

const path = require("path")
const fs = require("fs-extra")

class GitServer {
	constructor(options = {}) {
		this.options = {
			port: options.port || 3000,
			host: options.host || "localhost",
			repoPath: options.repoPath || "./repos",
			configPath: options.configPath || "./config.json",
			...options,
		}
		this.server = null
	}

	/**
	 * 启动服务器
	 */
	async start() {
		try {
			// 确保必要的目录存在
			await this.ensureDirectories()

			// 设置环境变量
			process.env.PORT = this.options.port
			process.env.SERVER_HOST = this.options.host
			process.env.DEFAULT_REPO_PATH = this.options.repoPath

			// 启动后端服务
			const app = require("./backend/app.js")

			console.log(`🚀 Git Server 启动成功！`)
			console.log(
				`📍 访问地址: http://${this.options.host}:${this.options.port}`
			)
			console.log(`📁 仓库路径: ${path.resolve(this.options.repoPath)}`)
			console.log(`👤 默认账号: admin / 123456`)

			return app
		} catch (error) {
			console.error("❌ 启动失败:", error.message)
			throw error
		}
	}

	/**
	 * 停止服务器
	 */
	async stop() {
		if (this.server) {
			return new Promise((resolve) => {
				this.server.close(() => {
					console.log("✅ Git Server 已停止")
					resolve()
				})
			})
		}
	}

	/**
	 * 确保必要的目录存在
	 */
	async ensureDirectories() {
		const dirs = [
			this.options.repoPath,
			path.join(__dirname, "backend/logs"),
			path.join(__dirname, "backend/temp"),
			path.join(__dirname, "backend/config"),
		]

		for (const dir of dirs) {
			await fs.ensureDir(dir)
		}

		// 确保配置文件存在
		const configPath = path.join(__dirname, "backend/config/users.json")
		if (!(await fs.pathExists(configPath))) {
			await fs.writeJson(
				configPath,
				{
					users: [
						{
							username: "admin",
							password: "123456",
							role: "superadmin",
						},
					],
				},
				{ spaces: 2 }
			)
		}

		const repoConfigPath = path.join(
			__dirname,
			"backend/config/repo-config.json"
		)
		if (!(await fs.pathExists(repoConfigPath))) {
			await fs.writeJson(
				repoConfigPath,
				{
					repos: [],
				},
				{ spaces: 2 }
			)
		}
	}
}

// 导出类和便捷函数
module.exports = GitServer
module.exports.GitServer = GitServer

// 便捷启动函数
module.exports.start = async (options) => {
	const server = new GitServer(options)
	return await server.start()
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
	const server = new GitServer()
	server.start().catch((error) => {
		console.error("启动失败:", error)
		process.exit(1)
	})
}
