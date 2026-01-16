import { ref } from "vue"
import { ElMessage } from "element-plus"
import { repoApi } from "../api/repo.js"

export function useCommits(repoInfo) {
	const commitsLoading = ref(false)
	const commits = ref([])
	const commitsBranch = ref("main")
	const commitsPage = ref(1)
	const hasMoreCommits = ref(false)
	const loadingMore = ref(false)

	// 加载提交历史
	const loadCommits = async (reset = false) => {
		if (reset) {
			commitsPage.value = 1
			commits.value = []
		}

		commitsLoading.value = true
		try {
			const response = await repoApi.getCommits(
				repoInfo.value.repoPath,
				commitsBranch.value,
				commitsPage.value,
				20
			)

			if (response.code === 200) {
				if (reset) {
					commits.value = response.data.commits || []
				} else {
					commits.value = [
						...commits.value,
						...(response.data.commits || []),
					]
				}
				hasMoreCommits.value = response.data.hasMore || false
			}
		} catch (error) {
			console.error("加载提交历史失败:", error)
			ElMessage.error("加载提交历史失败")
		} finally {
			commitsLoading.value = false
		}
	}

	// 加载更多提交
	const loadMoreCommits = async () => {
		loadingMore.value = true
		commitsPage.value++
		await loadCommits(false)
		loadingMore.value = false
	}

	return {
		commitsLoading,
		commits,
		commitsBranch,
		commitsPage,
		hasMoreCommits,
		loadingMore,
		loadCommits,
		loadMoreCommits,
	}
}
