#!/usr/bin/env node

/**
 * 版本更新脚本
 * 自动更新 package.json 和 CHANGELOG.md
 */

const fs = require("fs-extra")
const { execSync } = require("child_process")

const args = process.argv.slice(2)
const versionType = args[0] || "patch" // patch, minor, major

if (!["patch", "minor", "major"].includes(versionType)) {
	console.error("❌ 无效的版本类型，请使用: patch, minor, 或 major")
	process.exit(1)
}

async function bumpVersion() {
	try {
		console.log(`🔄 更新版本类型: ${versionType}\n`)

		// 读取当前版本
		const pkg = await fs.readJson("package.json")
		const oldVersion = pkg.version

		// 使用 npm version 更新版本
		console.log("📝 更新 package.json...")
		execSync(`npm version ${versionType} --no-git-tag-version`, {
			stdio: "inherit",
		})

		// 读取新版本
		const newPkg = await fs.readJson("package.json")
		const newVersion = newPkg.version

		console.log(`✅ 版本已更新: ${oldVersion} → ${newVersion}\n`)

		// 更新 CHANGELOG.md
		console.log("📝 更新 CHANGELOG.md...")
		const changelogPath = "CHANGELOG.md"
		let changelog = ""

		if (await fs.pathExists(changelogPath)) {
			changelog = await fs.readFile(changelogPath, "utf-8")
		}

		const today = new Date().toISOString().split("T")[0]
		const newEntry = `\n## [${newVersion}] - ${today}\n\n### 更新内容\n\n- TODO: 添加更新说明\n`

		// 在第一个 ## 之前插入新版本
		const lines = changelog.split("\n")
		const firstHeaderIndex = lines.findIndex((line) =>
			line.startsWith("## ")
		)

		if (firstHeaderIndex !== -1) {
			lines.splice(firstHeaderIndex, 0, newEntry)
			changelog = lines.join("\n")
		} else {
			changelog = `# 更新日志\n${newEntry}\n${changelog}`
		}

		await fs.writeFile(changelogPath, changelog)
		console.log("✅ CHANGELOG.md 已更新\n")

		// 提示下一步
		console.log("📋 下一步操作:\n")
		console.log("1. 编辑 CHANGELOG.md，填写更新内容")
		console.log("2. 提交更改:")
		console.log(`   git add .`)
		console.log(`   git commit -m "chore: bump version to ${newVersion}"`)
		console.log("3. 创建标签:")
		console.log(`   git tag v${newVersion}`)
		console.log("4. 推送到远程:")
		console.log(`   git push && git push --tags`)
		console.log("5. 发布到 npm:")
		console.log(`   npm publish\n`)
	} catch (error) {
		console.error("❌ 版本更新失败:", error.message)
		process.exit(1)
	}
}

bumpVersion()
