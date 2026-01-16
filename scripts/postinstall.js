#!/usr/bin/env node

/**
 * NPM 安装后脚本
 * 自动创建必要的目录和配置文件
 */

const fs = require("fs-extra")
const path = require("path")

async function postInstall() {
	try {
		console.log("\n🔧 正在初始化 Git Server...\n")

		// 创建必要的目录
		const dirs = ["backend/logs", "backend/temp", "backend/config", "repos"]

		for (const dir of dirs) {
			const dirPath = path.join(__dirname, "..", dir)
			await fs.ensureDir(dirPath)
			console.log(`✅ 创建目录: ${dir}`)
		}

		// 创建默认用户配置
		const usersConfigPath = path.join(
			__dirname,
			"..",
			"backend/config/users.json"
		)
		if (!(await fs.pathExists(usersConfigPath))) {
			await fs.writeJson(
				usersConfigPath,
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
			console.log("✅ 创建默认用户配置")
		}

		// 创建仓库配置
		const repoConfigPath = path.join(
			__dirname,
			"..",
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
			console.log("✅ 创建仓库配置")
		}

		console.log("\n✨ Git Server 初始化完成！\n")
		console.log("📖 快速开始:")
		console.log("   npx git-server              # 启动服务器")
		console.log("   npx git-server --port 8080  # 指定端口启动")
		console.log("   npx git-server help         # 查看帮助\n")
		console.log("👤 默认账号: admin / 123456\n")
	} catch (error) {
		console.error("❌ 初始化失败:", error.message)
	}
}

postInstall()
