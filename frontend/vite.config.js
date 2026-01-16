import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import fs from "fs"
import path from "path"

export default defineConfig(() => {
	// 读取根目录的 config.json（仅用于开发环境代理）
	const configPath = path.resolve(__dirname, "../config.json")
	let config = {
		server: {
			host: "localhost",
			port: 9001,
		},
		frontend: {
			host: "localhost",
			port: 5173,
		},
	}

	try {
		if (fs.existsSync(configPath)) {
			const configContent = fs.readFileSync(configPath, "utf-8")
			config = JSON.parse(configContent)
			console.log("✅ 已加载 config.json:", config)
		}
	} catch (error) {
		console.warn("⚠️  读取 config.json 失败:", error.message)
	}

	return {
		plugins: [vue()],
		server: {
			host: config.frontend.host,
			port: config.frontend.port,
			proxy: {
				"/api": {
					target: `http://${config.server.host}:${config.server.port}`,
					changeOrigin: true,
				},
				"/git": {
					target: `http://${config.server.host}:${config.server.port}`,
					changeOrigin: true,
				},
			},
		},
		build: {
			outDir: "dist",
		},
	}
})
