<template>
	<div class="dependencies-tab">
		<div v-if="packageLoading" class="loading-container">
			<el-skeleton :rows="5" animated />
		</div>

		<div v-else-if="packageError" class="error-container">
			<el-empty description="无法获取依赖信息">
				<template #image>
					<el-icon size="64" color="#909399">
						<Warning />
					</el-icon>
				</template>
				<p class="error-message">{{ packageError }}</p>
			</el-empty>
		</div>

		<div v-else-if="!hasDependencies" class="no-dependencies">
			<el-empty description="此包暂无依赖项">
				<template #image>
					<el-icon size="64" color="#909399">
						<Box />
					</el-icon>
				</template>
			</el-empty>
		</div>

		<div v-else class="dependencies-content">
			<!-- 依赖统计 -->
			<div class="dependency-stats">
				<div class="stats-grid">
					<div class="stat-item">
						<div class="stat-number">
							{{ dependencyStats.total }}
						</div>
						<div class="stat-label">总依赖</div>
					</div>
					<div
						class="stat-item"
						v-if="dependencyStats.dependencies > 0"
					>
						<div class="stat-number">
							{{ dependencyStats.dependencies }}
						</div>
						<div class="stat-label">生产依赖</div>
					</div>
					<div
						class="stat-item"
						v-if="dependencyStats.devDependencies > 0"
					>
						<div class="stat-number">
							{{ dependencyStats.devDependencies }}
						</div>
						<div class="stat-label">开发依赖</div>
					</div>
					<div
						class="stat-item"
						v-if="dependencyStats.peerDependencies > 0"
					>
						<div class="stat-number">
							{{ dependencyStats.peerDependencies }}
						</div>
						<div class="stat-label">同级依赖</div>
					</div>
					<div
						class="stat-item"
						v-if="dependencyStats.optionalDependencies > 0"
					>
						<div class="stat-number">
							{{ dependencyStats.optionalDependencies }}
						</div>
						<div class="stat-label">可选依赖</div>
					</div>
				</div>
			</div>

			<!-- 生产依赖 -->
			<div
				v-if="Object.keys(dependencies).length > 0"
				class="dependency-section"
			>
				<h3 class="section-title">
					<el-icon><Box /></el-icon>
					生产依赖 ({{ Object.keys(dependencies).length }})
				</h3>
				<div class="dependency-list">
					<div
						v-for="[name, version] in Object.entries(dependencies)"
						:key="name"
						class="dependency-item"
					>
						<div class="dependency-info">
							<span class="dependency-name">{{ name }}</span>
							<span class="dependency-version">{{
								version
							}}</span>
						</div>
						<div class="dependency-actions">
							<el-button
								size="small"
								text
								@click="openNpmPage(name)"
								title="在 NPM 上查看"
							>
								<el-icon><Link /></el-icon>
							</el-button>
						</div>
					</div>
				</div>
			</div>

			<!-- 开发依赖 -->
			<div
				v-if="Object.keys(devDependencies).length > 0"
				class="dependency-section"
			>
				<h3 class="section-title">
					<el-icon><Tools /></el-icon>
					开发依赖 ({{ Object.keys(devDependencies).length }})
				</h3>
				<div class="dependency-list">
					<div
						v-for="[name, version] in Object.entries(
							devDependencies,
						)"
						:key="name"
						class="dependency-item dev-dependency"
					>
						<div class="dependency-info">
							<span class="dependency-name">{{ name }}</span>
							<span class="dependency-version">{{
								version
							}}</span>
						</div>
						<div class="dependency-actions">
							<el-button
								size="small"
								text
								@click="openNpmPage(name)"
								title="在 NPM 上查看"
							>
								<el-icon><Link /></el-icon>
							</el-button>
						</div>
					</div>
				</div>
			</div>

			<!-- 同级依赖 -->
			<div
				v-if="Object.keys(peerDependencies).length > 0"
				class="dependency-section"
			>
				<h3 class="section-title">
					<el-icon><Connection /></el-icon>
					同级依赖 ({{ Object.keys(peerDependencies).length }})
				</h3>
				<div class="dependency-list">
					<div
						v-for="[name, version] in Object.entries(
							peerDependencies,
						)"
						:key="name"
						class="dependency-item peer-dependency"
					>
						<div class="dependency-info">
							<span class="dependency-name">{{ name }}</span>
							<span class="dependency-version">{{
								version
							}}</span>
						</div>
						<div class="dependency-actions">
							<el-button
								size="small"
								text
								@click="openNpmPage(name)"
								title="在 NPM 上查看"
							>
								<el-icon><Link /></el-icon>
							</el-button>
						</div>
					</div>
				</div>
			</div>

			<!-- 可选依赖 -->
			<div
				v-if="Object.keys(optionalDependencies).length > 0"
				class="dependency-section"
			>
				<h3 class="section-title">
					<el-icon><QuestionFilled /></el-icon>
					可选依赖 ({{ Object.keys(optionalDependencies).length }})
				</h3>
				<div class="dependency-list">
					<div
						v-for="[name, version] in Object.entries(
							optionalDependencies,
						)"
						:key="name"
						class="dependency-item optional-dependency"
					>
						<div class="dependency-info">
							<span class="dependency-name">{{ name }}</span>
							<span class="dependency-version">{{
								version
							}}</span>
						</div>
						<div class="dependency-actions">
							<el-button
								size="small"
								text
								@click="openNpmPage(name)"
								title="在 NPM 上查看"
							>
								<el-icon><Link /></el-icon>
							</el-button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import {
	Box,
	Tools,
	Connection,
	QuestionFilled,
	Link,
	Warning,
} from "@element-plus/icons-vue"

const props = defineProps({
	packageLoading: {
		type: Boolean,
		default: false,
	},
	packageError: {
		type: String,
		default: null,
	},
	dependencies: {
		type: Object,
		default: () => ({}),
	},
	devDependencies: {
		type: Object,
		default: () => ({}),
	},
	peerDependencies: {
		type: Object,
		default: () => ({}),
	},
	optionalDependencies: {
		type: Object,
		default: () => ({}),
	},
	hasDependencies: {
		type: Boolean,
		default: false,
	},
	dependencyStats: {
		type: Object,
		default: () => ({
			total: 0,
			dependencies: 0,
			devDependencies: 0,
			peerDependencies: 0,
			optionalDependencies: 0,
		}),
	},
})

// 打开NPM页面
const openNpmPage = (packageName) => {
	window.open(`https://www.npmjs.com/package/${packageName}`, "_blank")
}
</script>

<style scoped>
.dependencies-tab {
	padding: 24px;
}

.loading-container,
.error-container,
.no-dependencies {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 300px;
}

.error-message {
	color: #909399;
	margin-top: 12px;
}

.dependencies-content {
	max-width: 800px;
}

/* 依赖统计 */
.dependency-stats {
	margin-bottom: 32px;
	padding: 20px;
	background: #f8fafc;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	gap: 20px;
}

.stat-item {
	text-align: center;
}

.stat-number {
	font-size: 24px;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 4px;
}

.stat-label {
	font-size: 14px;
	color: #6b7280;
}

/* 依赖区块 */
.dependency-section {
	margin-bottom: 32px;
}

.section-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 16px;
	padding-bottom: 8px;
	border-bottom: 2px solid #e5e7eb;
}

.dependency-list {
	display: grid;
	gap: 8px;
}

.dependency-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	transition: all 0.2s ease;
}

.dependency-item:hover {
	border-color: #3b82f6;
	box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.dependency-info {
	display: flex;
	align-items: center;
	gap: 12px;
	flex: 1;
}

.dependency-name {
	font-weight: 500;
	color: #1f2937;
	font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
}

.dependency-version {
	color: #6b7280;
	font-size: 14px;
	font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
	background: #f3f4f6;
	padding: 2px 6px;
	border-radius: 4px;
}

.dependency-actions {
	display: flex;
	gap: 8px;
}

/* 不同类型依赖的样式 */
.dev-dependency {
	border-left: 4px solid #f59e0b;
}

.peer-dependency {
	border-left: 4px solid #8b5cf6;
}

.optional-dependency {
	border-left: 4px solid #10b981;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.dependencies-tab {
		padding: 16px;
	}

	.stats-grid {
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}

	.dependency-item {
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}

	.dependency-actions {
		align-self: flex-end;
	}
}
</style>
