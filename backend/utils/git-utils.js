const { execSync } = require("child_process")
const fs = require("fs-extra")

// 执行Git命令的通用函数
function execGitCommand(command, cwd = process.cwd()) {
	try {
		// 执行Git命令并返回结果
		const result = execSync(command, { cwd, encoding: "utf-8" })
		return { success: true, data: result }
	} catch (error) {
		return { success: false, error: error.stdout || error.message }
	}
}

// 1. 创建新仓库（裸仓库）
function createRepo(repoPath) {
	// 确保目录存在
	fs.ensureDirSync(repoPath)
	// 初始化Git裸仓库（--bare创建裸仓库，适合作为服务器仓库）
	return execGitCommand("git init --bare", repoPath)
}

// 2. 获取仓库提交记录（适配裸仓库）
function getCommitLog(repoPath) {
	// 对于裸仓库，需要指定分支来查看日志
	const result = execGitCommand(
		'git log --all --pretty=format:"%h | %an | %ad | %s" --date=short',
		repoPath
	)
	if (!result.success) {
		// 如果没有提交记录，返回空数组
		return { success: true, data: [] }
	}
	return result
}

// 3. 获取仓库文件列表（简化版：读取目录结构）
function getRepoFiles(repoPath) {
	try {
		const files = fs.readdirSync(repoPath, { withFileTypes: true })
		return {
			success: true,
			data: files.map((file) => ({
				name: file.name,
				isDir: file.isDirectory(),
				path: `${repoPath}/${file.name}`,
			})),
		}
	} catch (error) {
		return { success: false, error: error.message }
	}
}

// 4. 检查是否为裸仓库
function isBareRepo(repoPath) {
	// 检查路径是否存在
	if (!repoPath || !fs.existsSync(repoPath)) {
		return false
	}

	try {
		const result = execGitCommand(
			"git rev-parse --is-bare-repository",
			repoPath
		)
		return result.success && result.data.trim() === "true"
	} catch (error) {
		console.error("检查裸仓库失败:", error)
		return false
	}
}

module.exports = {
	execGitCommand,
	createRepo,
	getCommitLog,
	getRepoFiles,
	isBareRepo,
}
