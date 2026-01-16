#!/usr/bin/env node

/**
 * NPM 发布前检查脚本
 * 确保所有必要的文件和配置都正确
 */

const fs = require("fs-extra")
const path = require("path")

const checks = []
let hasErrors = false

function check(name, condition, errorMsg) {
	checks.push({ name, passed: condition, errorMsg })
	if (!condition) {
		hasErrors = true
	}
}

async function runChecks() {
	console.log("🔍 开始发布前检查...\n")

	// 检查必要文件
	check(
		"package.json 存在",
		await fs.pathExists("package.json"),
		"package.json 文件不存在"
	)

	check(
		"README.md 存在",
		await fs.pathExists("README.md"),
		"README.md 文件不存在"
	)

	check("LICENSE 存在", await fs.pathExists("LICENSE"), "LICENSE 文件不存在")

	check(
		"index.js 存在",
		await fs.pathExists("index.js"),
		"index.js 入口文件不存在"
	)

	check(
		"bin/cli.js 存在",
		await fs.pathExists("bin/cli.js"),
		"bin/cli.js CLI 文件不存在"
	)

	// 检查 package.json 内容
	if (await fs.pathExists("package.json")) {
		const pkg = await fs.readJson("package.json")

		check("package.json 有 name", !!pkg.name, "package.json 缺少 name 字段")

		check(
			"package.json 有 version",
			!!pkg.version,
			"package.json 缺少 version 字段"
		)

		check(
			"package.json 有 description",
			!!pkg.description,
			"package.json 缺少 description 字段"
		)

		check("package.json 有 main", !!pkg.main, "package.json 缺少 main 字段")

		check("package.json 有 bin", !!pkg.bin, "package.json 缺少 bin 字段")

		check(
			"package.json 有 keywords",
			pkg.keywords && pkg.keywords.length > 0,
			"package.json 缺少 keywords 字段"
		)

		check(
			"package.json 有 repository",
			!!pkg.repository,
			"package.json 缺少 repository 字段"
		)

		check(
			"package.json 有 license",
			!!pkg.license,
			"package.json 缺少 license 字段"
		)

		check(
			"package.json 有 files",
			pkg.files && pkg.files.length > 0,
			"package.json 缺少 files 字段"
		)
	}

	// 检查后端文件
	check(
		"backend/app.js 存在",
		await fs.pathExists("backend/app.js"),
		"backend/app.js 不存在"
	)

	check(
		"backend/routes 目录存在",
		await fs.pathExists("backend/routes"),
		"backend/routes 目录不存在"
	)

	check(
		"backend/utils 目录存在",
		await fs.pathExists("backend/utils"),
		"backend/utils 目录不存在"
	)

	// 检查前端构建文件
	check(
		"backend/dist 存在（前端构建文件）",
		await fs.pathExists("backend/dist"),
		"backend/dist 不存在，请先构建前端"
	)

	// 检查 .npmignore
	check(
		".npmignore 存在",
		await fs.pathExists(".npmignore"),
		".npmignore 文件不存在"
	)

	// 输出检查结果
	console.log("检查结果:\n")
	checks.forEach(({ name, passed, errorMsg }) => {
		const icon = passed ? "✅" : "❌"
		console.log(`${icon} ${name}`)
		if (!passed) {
			console.log(`   错误: ${errorMsg}`)
		}
	})

	console.log("\n" + "=".repeat(50))

	if (hasErrors) {
		console.log("\n❌ 检查失败！请修复上述问题后再发布。\n")
		process.exit(1)
	} else {
		console.log("\n✅ 所有检查通过！可以发布了。\n")
		console.log("下一步:")
		console.log("  1. npm login")
		console.log("  2. npm publish")
		console.log("  或者")
		console.log("  npm publish --access public\n")
	}
}

runChecks().catch((error) => {
	console.error("检查过程出错:", error)
	process.exit(1)
})
