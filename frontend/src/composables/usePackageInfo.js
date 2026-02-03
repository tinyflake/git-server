/*
 * @Auther:
 * @Date: 2026-01-27 12:03:10
 * @Description:
 * @LastEditTime: 2026-01-27 14:20:51
 * @LastEditors: binghuanli
 */
import { ref, computed } from "vue"
import { repoApi } from "../api/repo.js"

export function usePackageInfo(repoInfo) {
	const packageInfo = ref(null)
	const packageLoading = ref(false)
	const packageError = ref(null)

	// 计算属性：获取各种依赖类型
	const dependencies = computed(() => {
		return packageInfo.value?.dependencies || {}
	})

	const devDependencies = computed(() => {
		return packageInfo.value?.devDependencies || {}
	})

	const peerDependencies = computed(() => {
		return packageInfo.value?.peerDependencies || {}
	})

	const optionalDependencies = computed(() => {
		return packageInfo.value?.optionalDependencies || {}
	})

	// 计算属性：检查是否有任何依赖
	const hasDependencies = computed(() => {
		return (
			Object.keys(dependencies.value).length > 0 ||
			Object.keys(devDependencies.value).length > 0 ||
			Object.keys(peerDependencies.value).length > 0 ||
			Object.keys(optionalDependencies.value).length > 0
		)
	})

	// 计算属性：依赖统计
	const dependencyStats = computed(() => {
		return {
			total:
				Object.keys(dependencies.value).length +
				Object.keys(devDependencies.value).length +
				Object.keys(peerDependencies.value).length +
				Object.keys(optionalDependencies.value).length,
			dependencies: Object.keys(dependencies.value).length,
			devDependencies: Object.keys(devDependencies.value).length,
			peerDependencies: Object.keys(peerDependencies.value).length,
			optionalDependencies: Object.keys(optionalDependencies.value)
				.length,
		}
	})

	// 加载package.json信息
	const loadPackageInfo = async () => {
		if (!repoInfo.value?.repoPath) {
			console.warn("仓库路径不存在，无法加载package.json信息")
			return
		}

		packageLoading.value = true
		packageError.value = null

		try {
			const response = await repoApi.getPackageInfo(
				repoInfo.value.repoPath,
			)

			if (response.code === 200) {
				packageInfo.value = response.data
			} else {
				packageError.value = response.msg || "获取package.json信息失败"
				console.warn("获取package.json信息失败:", response.msg)
			}
		} catch (error) {
			packageError.value = "获取package.json信息失败"
			console.error("获取package.json信息失败:", error)
		} finally {
			packageLoading.value = false
		}
	}

	return {
		packageInfo,
		packageLoading,
		packageError,
		dependencies,
		devDependencies,
		peerDependencies,
		optionalDependencies,
		hasDependencies,
		dependencyStats,
		loadPackageInfo,
	}
}
