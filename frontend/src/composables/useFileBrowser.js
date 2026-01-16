import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { repoApi } from "../api/repo.js"
import hljs from "highlight.js"

export function useFileBrowser(repoInfo, currentBranch, hasCodeViewPermission) {
	const filesLoading = ref(false)
	const branches = ref([])
	const fileTreeData = ref([])
	const fileTreeRef = ref(null)
	const fileSearch = ref("")
	const selectedFile = ref(null)
	const fileContent = ref(null)
	const fileContentLoading = ref(false)
	const highlightedCode = ref("")

	const fileTreeProps = {
		label: "name",
		children: "children",
		isLeaf: "isLeaf",
	}

	// 加载分支列表
	const loadBranches = async () => {
		if (!repoInfo.value || !hasCodeViewPermission.value) return

		try {
			const response = await repoApi.getBranches(repoInfo.value.repoPath)
			if (response.code === 200) {
				branches.value = Array.isArray(response.data)
					? response.data
					: []
				const current = branches.value.find((b) => b.isCurrent)
				if (current) {
					currentBranch.value = current.name
				} else if (branches.value.length > 0) {
					currentBranch.value = branches.value[0].name
				}
			}
		} catch (error) {
			console.error("加载分支列表失败:", error)
			currentBranch.value = "main"
		}
	}

	// 懒加载文件树节点
	const loadNode = async (node, resolve) => {
		if (node.level === 0) {
			try {
				if (!currentBranch.value && branches.value.length > 0) {
					currentBranch.value = branches.value[0].name
				}

				const response = await repoApi.getFileTree(
					repoInfo.value.repoPath,
					currentBranch.value || "",
					""
				)

				if (response.code === 200) {
					resolve(response.data || [])
				} else {
					ElMessage.error(response.msg || "加载文件树失败")
					resolve([])
				}
			} catch (error) {
				console.error("加载文件树失败:", error)
				ElMessage.error("加载文件树失败")
				resolve([])
			}
		} else {
			if (node.data.type === "directory") {
				try {
					const response = await repoApi.getFileTree(
						repoInfo.value.repoPath,
						currentBranch.value || "",
						node.data.path
					)

					if (response.code === 200) {
						resolve(response.data || [])
					} else {
						resolve([])
					}
				} catch (error) {
					console.error("加载文件树失败:", error)
					resolve([])
				}
			} else {
				resolve([])
			}
		}
	}

	// 处理文件点击
	const handleFileClick = async (data) => {
		if (data.type === "file") {
			selectedFile.value = data
			await loadFileContent(data)
		}
	}

	// 加载文件内容
	const loadFileContent = async (file) => {
		fileContentLoading.value = true
		try {
			const response = await repoApi.getFileContentWithPermission(
				repoInfo.value.repoPath,
				file.path,
				currentBranch.value
			)

			if (response.code === 200) {
				fileContent.value = response.data

				if (
					!response.data.isBinary &&
					!response.data.isImage &&
					!response.data.tooLarge
				) {
					try {
						const language = detectLanguage(response.data.extension)
						if (language) {
							highlightedCode.value = hljs.highlight(
								response.data.content,
								{ language }
							).value
						} else {
							highlightedCode.value = hljs.highlightAuto(
								response.data.content
							).value
						}
					} catch (error) {
						console.error("代码高亮失败:", error)
						highlightedCode.value = response.data.content
					}
				}
			} else {
				ElMessage.error("加载文件内容失败")
			}
		} catch (error) {
			console.error("加载文件内容失败:", error)
			ElMessage.error("加载文件内容失败")
		} finally {
			fileContentLoading.value = false
		}
	}

	// 检测编程语言
	const detectLanguage = (ext) => {
		const langMap = {
			".js": "javascript",
			".ts": "typescript",
			".jsx": "javascript",
			".tsx": "typescript",
			".vue": "html",
			".html": "html",
			".css": "css",
			".scss": "scss",
			".less": "less",
			".json": "json",
			".md": "markdown",
			".py": "python",
			".java": "java",
			".c": "c",
			".cpp": "cpp",
			".go": "go",
			".rs": "rust",
			".php": "php",
			".rb": "ruby",
			".sh": "bash",
			".yaml": "yaml",
			".yml": "yaml",
			".xml": "xml",
			".sql": "sql",
		}
		return langMap[ext.toLowerCase()]
	}

	// 格式化文件大小
	const formatFileSize = (bytes) => {
		if (!bytes) return ""
		if (bytes < 1024) return bytes + " B"
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
		return (bytes / (1024 * 1024)).toFixed(1) + " MB"
	}

	// 过滤文件树节点
	const filterFileNode = (value, data) => {
		if (!value) return true
		return data.name.toLowerCase().includes(value.toLowerCase())
	}

	// 分支切换
	const handleBranchChange = () => {
		if (fileTreeRef.value) {
			fileTreeRef.value.filter("")
		}
		selectedFile.value = null
		fileContent.value = null
	}

	// 复制文件内容
	const copyFileContent = async () => {
		if (!fileContent.value) return

		try {
			await navigator.clipboard.writeText(fileContent.value.content)
			ElMessage.success("已复制到剪贴板")
		} catch (error) {
			ElMessage.error("复制失败")
		}
	}

	// 下载当前文件
	const downloadCurrentFile = async () => {
		if (!selectedFile.value) return

		try {
			const result = await repoApi.downloadFile(
				repoInfo.value.repoPath,
				selectedFile.value.path,
				currentBranch.value
			)

			if (result.success) {
				ElMessage.success("文件下载成功")
			} else {
				ElMessage.error(result.error || "文件下载失败")
			}
		} catch (error) {
			console.error("下载文件失败:", error)
			ElMessage.error("文件下载失败")
		}
	}

	// 监听文件搜索
	watch(fileSearch, (val) => {
		if (fileTreeRef.value) {
			fileTreeRef.value.filter(val)
		}
	})

	return {
		filesLoading,
		branches,
		fileTreeData,
		fileTreeRef,
		fileSearch,
		selectedFile,
		fileContent,
		fileContentLoading,
		highlightedCode,
		fileTreeProps,
		loadBranches,
		loadNode,
		handleFileClick,
		formatFileSize,
		filterFileNode,
		handleBranchChange,
		copyFileContent,
		downloadCurrentFile,
	}
}
