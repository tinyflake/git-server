import { ref } from "vue"
import { ElMessage } from "element-plus"
import { repoApi } from "../api/repo.js"

export function useRepoList() {
	const repoList = ref([])
	const loading = ref(false)

	const loadRepoList = async () => {
		loading.value = true
		try {
			const response = await repoApi.getRepoList()
			if (response.code === 200) {
				// 确保 response.data 是数组
				const repos = Array.isArray(response.data) ? response.data : []

				if (repos.length === 0) {
					repoList.value = []
					return
				}

				const reposWithStatus = await Promise.all(
					repos.map(async (repo) => {
						try {
							const statusResponse = await repoApi.getRepoStatus(
								repo.repoPath
							)

							let commitInfo = null
							try {
								const commitResponse =
									await repoApi.getLatestCommit(repo.repoPath)
								if (commitResponse.code === 200) {
									commitInfo = commitResponse.data
								}
							} catch (commitError) {
								console.warn("获取提交信息失败:", commitError)
							}

							let packageInfo = null
							try {
								const packageResponse =
									await repoApi.getPackageInfo(repo.repoPath)
								if (packageResponse.code === 200) {
									packageInfo = packageResponse.data
								}
							} catch (packageError) {
								console.warn(
									"获取package.json信息失败:",
									packageError
								)
							}

							return {
								...repo,
								isBare:
									statusResponse.code === 200
										? statusResponse.data.isBare
										: false,
								exists:
									statusResponse.code === 200
										? statusResponse.data.exists
										: false,
								version: packageInfo?.version || "未知",
								author:
									commitInfo?.author ||
									packageInfo?.author ||
									"Unknown",
								authorEmail: commitInfo?.email || "",
								license: packageInfo?.license || "MIT",
								downloads: 0,
								lastModified:
									commitInfo?.date ||
									new Date().toISOString(),
								lastCommitMessage: commitInfo?.message || "",
								lastCommitHash: commitInfo?.hash || "",
								keywords: packageInfo?.keywords || [],
							}
						} catch (error) {
							return {
								...repo,
								isBare: false,
								exists: false,
								version: "未知",
								author: "Unknown",
								authorEmail: "",
								license: "MIT",
								downloads: 0,
								lastModified: new Date().toISOString(),
								lastCommitMessage: "",
								lastCommitHash: "",
								keywords: [],
							}
						}
					})
				)
				repoList.value = reposWithStatus
			} else {
				ElMessage.error("获取仓库列表失败")
			}
		} catch (error) {
			ElMessage.error("网络请求失败")
			console.error(error)
		} finally {
			loading.value = false
		}
	}

	return {
		repoList,
		loading,
		loadRepoList,
	}
}
