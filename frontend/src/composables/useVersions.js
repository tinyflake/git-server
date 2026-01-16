import { ref } from "vue"
import { ElMessage } from "element-plus"
import { repoApi } from "../api/repo.js"
import { renderMarkdown, extractHeadings } from "../utils/markdown.js"

export function useVersions(repoInfo) {
	const versions = ref([])
	const versionsLoading = ref(false)
	const currentVersion = ref(null)

	// 加载版本列表
	const loadVersions = async () => {
		if (!repoInfo.value) return

		versionsLoading.value = true
		try {
			const response = await repoApi.getVersions(repoInfo.value.repoPath)
			if (response.code === 200) {
				versions.value = response.data
				if (versions.value.length > 0) {
					currentVersion.value = versions.value[0]
				}
			} else {
				versions.value = []
			}
		} catch (error) {
			console.error("加载版本列表失败:", error)
			versions.value = []
		} finally {
			versionsLoading.value = false
		}
	}

	// 切换版本并加载对应的README
	const switchToVersion = async (
		version,
		readmeContent,
		renderedReadme,
		readmeHeadings,
		showToc,
		readmeLoading
	) => {
		currentVersion.value = version

		readmeLoading.value = true
		try {
			const response = await repoApi.getFileContentByVersion(
				repoInfo.value.repoPath,
				"README.md",
				version.hash
			)

			if (response.code === 200) {
				readmeContent.value = response.data.content
				renderedReadme.value = renderMarkdown(response.data.content)
				readmeHeadings.value = extractHeadings(response.data.content)
				showToc.value = readmeHeadings.value.length > 0
			} else {
				readmeContent.value = ""
				renderedReadme.value = ""
				readmeHeadings.value = []
				showToc.value = false
			}
		} catch (error) {
			console.error("加载版本README失败:", error)
			readmeContent.value = ""
			renderedReadme.value = ""
			readmeHeadings.value = []
			showToc.value = false
		} finally {
			readmeLoading.value = false
		}
	}

	// 重置到最新版本
	const resetToLatestVersion = () => {
		currentVersion.value = null
	}

	// 下载当前版本
	const downloadCurrentVersion = (displayVersionInfo) => {
		if (!repoInfo.value || !displayVersionInfo.value) {
			ElMessage.error("无法获取版本信息")
			return
		}

		if (!displayVersionInfo.value.hash) {
			ElMessage.error("当前仓库无数据")
			return
		}

		try {
			const version = displayVersionInfo.value.hash
			const repoName = repoInfo.value.repoName
			const versionLabel =
				displayVersionInfo.value.version ||
				displayVersionInfo.value.shortHash

			repoApi.downloadVersion(repoInfo.value.repoPath, version, repoName)
			ElMessage.success(`开始下载 ${repoName} ${versionLabel}...`)
		} catch (error) {
			console.error("下载失败:", error)
			ElMessage.error("下载失败，请稍后重试")
		}
	}

	return {
		versions,
		versionsLoading,
		currentVersion,
		loadVersions,
		switchToVersion,
		resetToLatestVersion,
		downloadCurrentVersion,
	}
}
