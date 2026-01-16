<template>
	<header class="top-header">
		<div class="header-container">
			<div class="logo-section" @click="$emit('go-home')">
				<div class="logo">
					<el-icon><Box /></el-icon>
				</div>
				<h1 class="site-title">私有仓库</h1>
			</div>

			<div class="header-actions">
				<el-dropdown
					v-if="currentUser"
					@command="$emit('user-command', $event)"
				>
					<el-button class="user-btn">
						<el-icon><User /></el-icon>
						{{ currentUser.username }}
						<el-icon class="el-icon--right"><ArrowDown /></el-icon>
					</el-button>
					<template #dropdown>
						<el-dropdown-menu>
							<!-- <el-dropdown-item command="profile">
								<el-icon><User /></el-icon>
								个人信息
							</el-dropdown-item> -->
							<el-dropdown-item v-if="isAdmin" command="users">
								<el-icon><UserFilled /></el-icon>
								用户管理
							</el-dropdown-item>
							<el-dropdown-item
								v-if="isAdmin"
								command="permissions"
							>
								<el-icon><Lock /></el-icon>
								权限管理
							</el-dropdown-item>
							<el-dropdown-item v-if="isAdmin" command="repos">
								<el-icon><FolderOpened /></el-icon>
								仓库管理
							</el-dropdown-item>
							<el-dropdown-item v-if="isAdmin" command="logs">
								<el-icon><Document /></el-icon>
								操作日志
							</el-dropdown-item>
							<el-dropdown-item
								v-if="isSuperAdmin"
								command="migration"
							>
								<el-icon><Upload /></el-icon>
								数据迁移
							</el-dropdown-item>
							<el-dropdown-item command="changePassword">
								<el-icon><Key /></el-icon>
								修改密码
							</el-dropdown-item>
							<el-dropdown-item divided command="logout">
								<el-icon><SwitchButton /></el-icon>
								退出登录
							</el-dropdown-item>
						</el-dropdown-menu>
					</template>
				</el-dropdown>

				<el-button
					v-if="isAdmin"
					type="primary"
					@click="$emit('create-repo')"
					class="create-btn"
				>
					<el-icon><Plus /></el-icon>
					新建仓库
				</el-button>
				<el-button
					v-if="isSuperAdmin"
					@click="$emit('open-config')"
					class="config-btn"
				>
					<el-icon><Setting /></el-icon>
				</el-button>
			</div>
		</div>
	</header>
</template>

<script setup>
import {
	Plus,
	Setting,
	Box,
	User,
	ArrowDown,
	SwitchButton,
	Key,
	UserFilled,
	Lock,
	Document,
	FolderOpened,
	Upload,
} from "@element-plus/icons-vue"

defineProps({
	currentUser: Object,
	isAdmin: Boolean,
	isSuperAdmin: Boolean,
})

defineEmits(["user-command", "create-repo", "open-config", "go-home"])
</script>

<style scoped>
.top-header {
	background: #4b5563;
	color: white;
	padding: 0;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 24px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 64px;
}

.logo-section {
	display: flex;
	align-items: center;
	gap: 12px;
	cursor: pointer;
	transition: opacity 0.2s;
}

.logo-section:hover {
	opacity: 0.8;
}

.logo {
	width: 32px;
	height: 32px;
	background: white;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #4b5563;
	font-size: 18px;
}

.site-title {
	margin: 0;
	font-size: 20px;
	font-weight: 600;
	color: white;
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 12px;
}

.user-btn {
	background: transparent;
	border-color: rgba(255, 255, 255, 0.3);
	color: white;
}

.user-btn:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.5);
	color: white;
}

.create-btn {
	background: #10b981;
	border-color: #10b981;
}

.create-btn:hover {
	background: #059669;
	border-color: #059669;
}

.config-btn {
	background: transparent;
	border-color: rgba(255, 255, 255, 0.3);
	color: white;
}

.config-btn:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.5);
	color: white;
}

@media (max-width: 768px) {
	.header-container {
		padding: 0 16px;
		flex-direction: column;
		height: auto;
		padding-top: 16px;
		padding-bottom: 16px;
		gap: 16px;
	}
}
</style>
