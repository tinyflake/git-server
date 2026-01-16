#!/usr/bin/env node

/**
 * Git Server CLI
 * 命令行工具
 */

const GitServer = require("../index.js")
const path = require("path")
const fs = require("fs-extra")

const args = process.argv.slice(2)
const command = args[0]

// 显示帮助信息
function showHelp() {
	console.log(`
🚀 Git Server - Git 仓库管理系统

用法:
  git-server [命令] [选项]

命令:
  start              启动服务器（默认）
  init               初始化配置文件
  help               显示帮助信息
  version            显示版本信息

选项:
  --port <port>      指定端口（默认: 3000）
  --host <host>      指定主机（默认: localhost）
  --repo <path>      指定仓库路径（默认: ./repos）

示例:
  git-server                           # 启动服务器
  git-server start --port 8080         # 在 8080 端口启动
  git-server init                      # 初始化配置文件
  git-server --help                    # 显示帮助

更多信息: https://github.com/yourusername/git-server
  `)
}

// 显示版本信息
function showVersion() {
	const pkg = require("../package.json")
	console.log(`Git Server v${pkg.version}`)
}

// 初始化配置
async function initConfig() {
	const configPath = path.join(process.cwd(), "config.json")

	if (await fs.pathExists(configPath)) {
		console.log("⚠️  config.json 已存在")
		return
	}

	const defaultConfig = {
		server: {
			host: "localhost",
			port: 3000,
			timeout: 300000,
			maxUploadSize: "1024mb",
		},
		frontend: {
			host: "localhost",
			port: 5173,
		},
		git: {
			defaultRepoPath: "./repos",
		},
		deployment: {
			mode: "development",
		},
	}

	await fs.writeJson(configPath, defaultConfig, { spaces: 2 })
	console.log("✅ 配置文件已创建: config.json")
}

// 解析命令行参数
function parseArgs(args) {
	const options = {}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]

		if (arg === "--port" && args[i + 1]) {
			options.port = parseInt(args[i + 1])
			i++
		} else if (arg === "--host" && args[i + 1]) {
			options.host = args[i + 1]
			i++
		} else if (arg === "--repo" && args[i + 1]) {
			options.repoPath = args[i + 1]
			i++
		}
	}

	return options
}

// 启动服务器
async function startServer(options) {
	console.log("🚀 正在启动 Git Server...\n")

	const server = new GitServer(options)
	await server.start()

	// 处理退出信号
	process.on("SIGINT", async () => {
		console.log("\n\n⏹️  正在停止服务器...")
		await server.stop()
		process.exit(0)
	})
}

// 主函数
async function main() {
	try {
		switch (command) {
			case "help":
			case "--help":
			case "-h":
				showHelp()
				break

			case "version":
			case "--version":
			case "-v":
				showVersion()
				break

			case "init":
				await initConfig()
				break

			case "start":
			case undefined:
				const options = parseArgs(args.slice(1))
				await startServer(options)
				break

			default:
				console.log(`❌ 未知命令: ${command}`)
				console.log('使用 "git-server help" 查看帮助')
				process.exit(1)
		}
	} catch (error) {
		console.error("❌ 错误:", error.message)
		process.exit(1)
	}
}

main()
