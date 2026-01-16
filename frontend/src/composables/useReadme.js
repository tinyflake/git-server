import { ref } from "vue"
import { repoApi } from "../api/repo.js"
import { renderMarkdown, extractHeadings } from "../utils/markdown.js"

export function useReadme(repoInfo) {
	const readmeLoading = ref(false)
	const readmeContent = ref("")
	const renderedReadme = ref("")
	const readmeHeadings = ref([])
	const showToc = ref(false)

	// 加载README文件内容
	const loadReadmeContent = async () => {
		if (!repoInfo.value) return

		readmeLoading.value = true
		try {
			const response = await repoApi.getFileContent(
				repoInfo.value.repoPath,
				"README.md"
			)

			if (response.code === 200) {
				readmeContent.value = response.data.content
				renderedReadme.value = renderMarkdown(response.data.content)
				readmeHeadings.value = extractHeadings(response.data.content)
				showToc.value = readmeHeadings.value.length > 0
				setTimeout(() => {
					readmeHeadings.value.forEach((heading) => {
						document.getElementById(heading.anchor)
					})
				}, 200)
			} else {
				readmeContent.value = ""
				renderedReadme.value = ""
				readmeHeadings.value = []
				showToc.value = false
			}
		} catch (error) {
			console.error("加载README失败:", error)
			readmeContent.value = ""
			renderedReadme.value = ""
			readmeHeadings.value = []
			showToc.value = false
		} finally {
			readmeLoading.value = false
		}
	}

	// 跳转到标题锚点
	const scrollToHeading = (anchor) => {
		const element = document.getElementById(anchor)
		if (element) {
			const headerHeight = 120
			const elementTop = element.offsetTop - headerHeight

			window.scrollTo({
				top: elementTop,
				behavior: "smooth",
			})
		} else {
			console.error("未找到锚点元素:", anchor)
		}
	}

	return {
		readmeLoading,
		readmeContent,
		renderedReadme,
		readmeHeadings,
		showToc,
		loadReadmeContent,
		scrollToHeading,
	}
}
