<template>
	<el-dialog
		v-model="visible"
		title="📖 系统使用说明"
		width="800px"
		:close-on-click-modal="false"
		class="help-dialog"
	>
		<div class="help-content">
			<el-tabs v-model="activeTab" type="border-card">
				<!-- 快速开始 -->
				<el-tab-pane label="快速开始" name="quickstart">
					<div class="help-section">
						<h3>欢迎使用 Git 仓库管理系统</h3>
						<p>
							这是一个私有的 Git
							仓库管理系统，支持代码托管、版本管理、权限控制等功能。
						</p>

						<h4>系统角色</h4>
						<ul>
							<li>
								<strong>超级管理员：</strong
								>拥有所有权限，可以创建/删除仓库、管理用户、配置系统
							</li>
							<li>
								<strong>管理员：</strong
								>可以管理用户、查看所有仓库
							</li>
							<li>
								<strong>普通用户：</strong
								>可以查看有权限的仓库、克隆代码
							</li>
						</ul>

						<h4>默认账号</h4>
						<div class="info-box">
							<p><strong>超级管理员：</strong></p>
							<p>用户名：admin</p>
							<p>密码：123456</p>
							<p class="warning">⚠️ 首次登录后请立即修改密码</p>
						</div>
					</div>
				</el-tab-pane>

				<!-- 仓库管理 -->
				<el-tab-pane label="仓库管理" name="repo">
					<div class="help-section">
						<h3>创建仓库</h3>
						<ol>
							<li>点击顶部导航栏的"创建仓库"按钮</li>
							<li>填写仓库名称（必填）</li>
							<li>填写仓库描述（可选）</li>
							<li>指定仓库路径（可选，留空则使用默认路径）</li>
							<li>点击"创建"按钮</li>
						</ol>

						<h3>查看仓库</h3>
						<p>在首页可以看到所有有权限访问的仓库列表，包括：</p>
						<ul>
							<li>仓库名称和描述</li>
							<li>最后更新时间</li>
							<li>版本信息</li>
							<li>Git 克隆地址</li>
						</ul>

						<h3>仓库详情</h3>
						<p>点击仓库卡片进入详情页，可以查看：</p>
						<ul>
							<li><strong>README：</strong>仓库说明文档</li>
							<li><strong>版本：</strong>所有提交版本列表</li>
							<li><strong>依赖：</strong>项目依赖信息</li>
							<li>
								<strong>文件：</strong
								>浏览仓库文件，支持代码预览
							</li>
							<li><strong>提交历史：</strong>查看所有提交记录</li>
						</ul>

						<h3>删除仓库（仅超管）</h3>
						<ol>
							<li>进入"仓库管理"页面</li>
							<li>找到要删除的仓库，点击"删除"按钮</li>
							<li>输入管理员密码确认</li>
							<li>点击"确认删除"</li>
						</ol>
					</div>
				</el-tab-pane>

				<!-- Git 操作 -->
				<el-tab-pane label="Git 操作" name="git">
					<div class="help-section">
						<h3>克隆仓库</h3>
						<div class="code-box">
							<code
								>git clone
								http://服务器地址:端口/仓库名.git</code
							>
						</div>
						<p>示例：</p>
						<div class="code-box">
							<code
								>git clone
								http://localhost:3000/my-project.git</code
							>
						</div>

						<h3>推送代码</h3>
						<p>首次推送现有项目：</p>
						<div class="code-box">
							<code
								>git remote add origin
								http://服务器地址:端口/仓库名.git</code
							><br />
							<code>git push -u origin main</code>
						</div>

						<p>后续推送：</p>
						<div class="code-box">
							<code>git add .</code><br />
							<code>git commit -m "提交说明"</code><br />
							<code>git push</code>
						</div>

						<h3>拉取更新</h3>
						<div class="code-box">
							<code>git pull</code>
						</div>

						<h3>身份认证</h3>
						<p>
							Git
							操作需要身份认证，使用系统的用户名和密码进行认证。
						</p>
						<div class="info-box">
							<p>
								💡
								提示：可以配置Git凭据管理器来保存密码，避免每次输入
							</p>
							<div class="code-box">
								<code
									>git config --global credential.helper
									store</code
								>
							</div>
						</div>
					</div>
				</el-tab-pane>

				<!-- 用户管理 -->
				<el-tab-pane label="用户管理" name="user">
					<div class="help-section">
						<h3>创建用户（管理员权限）</h3>
						<ol>
							<li>进入"用户管理"页面</li>
							<li>点击"创建用户"按钮</li>
							<li>填写用户名、密码、真实姓名</li>
							<li>选择用户角色</li>
							<li>点击"创建"按钮</li>
						</ol>

						<h3>修改密码</h3>
						<ol>
							<li>点击右上角用户头像</li>
							<li>选择"修改密码"</li>
							<li>输入旧密码和新密码</li>
							<li>点击"确认"按钮</li>
						</ol>

						<h3>权限管理（超管权限）</h3>
						<p>在用户管理页面可以：</p>
						<ul>
							<li>修改用户角色</li>
							<li>重置用户密码</li>
							<li>删除用户</li>
							<li>配置仓库访问权限</li>
						</ul>
					</div>
				</el-tab-pane>

				<!-- 文件浏览 -->
				<el-tab-pane label="文件浏览" name="files">
					<div class="help-section">
						<h3>浏览文件</h3>
						<ol>
							<li>进入仓库详情页</li>
							<li>点击"文件"标签页</li>
							<li>选择分支（默认为 main）</li>
							<li>点击文件夹展开查看内容</li>
							<li>点击文件查看代码</li>
						</ol>

						<h3>代码预览</h3>
						<p>支持的功能：</p>
						<ul>
							<li>语法高亮显示</li>
							<li>多种编程语言支持</li>
							<li>图片预览</li>
							<li>文件大小限制（5MB以内）</li>
						</ul>

						<h3>文件操作</h3>
						<ul>
							<li><strong>复制：</strong>复制文件内容到剪贴板</li>
							<li><strong>下载：</strong>下载单个文件</li>
							<li>
								<strong>搜索：</strong>在文件列表中搜索文件名
							</li>
						</ul>

						<h3>权限说明</h3>
						<div class="info-box">
							<p>
								🔒
								代码查看权限由管理员配置，普通用户只能查看有权限的仓库文件
							</p>
						</div>
					</div>
				</el-tab-pane>

				<!-- 版本管理 -->
				<el-tab-pane label="版本管理" name="version">
					<div class="help-section">
						<h3>查看版本</h3>
						<p>在仓库详情页的"版本"标签页可以看到：</p>
						<ul>
							<li>版本号（从 package.json 读取）</li>
							<li>提交哈希值</li>
							<li>提交作者和时间</li>
							<li>提交说明</li>
						</ul>

						<h3>切换版本</h3>
						<ol>
							<li>在版本列表中找到目标版本</li>
							<li>点击"查看"按钮</li>
							<li>README 会切换到该版本的内容</li>
							<li>点击"回到最新"返回最新版本</li>
						</ol>

						<h3>下载版本</h3>
						<ol>
							<li>在版本列表或右侧信息栏</li>
							<li>点击"下载此版本"按钮</li>
							<li>系统会下载该版本的 ZIP 压缩包</li>
						</ol>

						<h3>提交历史</h3>
						<p>在"提交历史"标签页可以：</p>
						<ul>
							<li>查看所有提交记录</li>
							<li>按分支筛选</li>
							<li>查看提交详情</li>
							<li>支持分页加载</li>
						</ul>
					</div>
				</el-tab-pane>

				<!-- 系统配置 -->
				<el-tab-pane label="系统配置" name="config">
					<div class="help-section">
						<h3>服务器配置（仅超管）</h3>
						<ol>
							<li>点击顶部导航栏的"配置"按钮</li>
							<li>修改服务器 IP 地址</li>
							<li>修改服务器端口</li>
							<li>修改默认仓库路径</li>
							<li>点击"保存"按钮</li>
						</ol>

						<h3>仓库权限配置</h3>
						<ol>
							<li>进入"仓库管理"页面</li>
							<li>点击仓库的"权限"按钮</li>
							<li>添加或移除用户白名单</li>
							<li>
								白名单为空表示所有用户可见，否则仅白名单用户可见
							</li>
						</ol>

						<h3>操作日志</h3>
						<p>系统会记录以下操作：</p>
						<ul>
							<li>用户登录</li>
							<li>创建/删除仓库</li>
							<li>创建/删除用户</li>
							<li>修改配置</li>
							<li>权限变更</li>
						</ul>
						<p>日志文件位置：backend/logs/operations.log</p>
					</div>
				</el-tab-pane>

				<!-- 常见问题 -->
				<el-tab-pane label="常见问题" name="faq">
					<div class="help-section">
						<h3>Q: 忘记密码怎么办？</h3>
						<p>
							A:
							联系管理员重置密码。超级管理员密码忘记需要修改数据库文件。
						</p>

						<h3>Q: Git 推送时提示认证失败？</h3>
						<p>A: 检查以下几点：</p>
						<ul>
							<li>用户名和密码是否正确</li>
							<li>是否有该仓库的访问权限</li>
							<li>Git URL 是否正确</li>
						</ul>

						<h3>Q: 看不到某个仓库？</h3>
						<p>
							A: 可能是权限问题，联系管理员将你添加到仓库白名单。
						</p>

						<h3>Q: 文件预览显示"无权限"？</h3>
						<p>A: 代码查看权限需要单独配置，联系管理员开通权限。</p>

						<h3>Q: 如何修改服务器地址？</h3>
						<p>A: 超级管理员可以在"配置"页面修改服务器IP和端口。</p>

						<h3>Q: 支持哪些 Git 操作？</h3>
						<p>A: 支持标准的 Git 操作：</p>
						<ul>
							<li>clone（克隆）</li>
							<li>push（推送）</li>
							<li>pull（拉取）</li>
							<li>fetch（获取）</li>
						</ul>

						<h3>Q: 如何备份数据？</h3>
						<p>A: 需要备份以下内容：</p>
						<ul>
							<li>仓库目录（repos 文件夹）</li>
							<li>配置文件（backend/config/）</li>
							<li>用户数据（backend/data/users.json）</li>
						</ul>

						<h3>Q: 系统支持多少用户？</h3>
						<p>A: 理论上无限制，实际取决于服务器性能和存储空间。</p>
					</div>
				</el-tab-pane>
			</el-tabs>
		</div>

		<template #footer>
			<div class="dialog-footer">
				<el-button type="primary" @click="visible = false">
					知道了
				</el-button>
			</div>
		</template>
	</el-dialog>
</template>

<script setup>
import { ref, watch } from "vue"

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(["update:modelValue"])

const visible = ref(props.modelValue)
const activeTab = ref("quickstart")

watch(
	() => props.modelValue,
	(val) => {
		visible.value = val
	}
)

watch(visible, (val) => {
	emit("update:modelValue", val)
	// 每次打开时重置到第一个标签页
	if (val) {
		activeTab.value = "quickstart"
	}
})
</script>

<style scoped>
.help-dialog :deep(.el-dialog__body) {
	padding: 0;
}

.help-content {
	max-height: 600px;
	overflow-y: auto;
}

.help-section {
	padding: 20px;
	line-height: 1.8;
}

.help-section h3 {
	color: #1f2937;
	font-size: 18px;
	font-weight: 600;
	margin-top: 24px;
	margin-bottom: 12px;
	padding-bottom: 8px;
	border-bottom: 2px solid #e5e7eb;
}

.help-section h3:first-child {
	margin-top: 0;
}

.help-section h4 {
	color: #374151;
	font-size: 16px;
	font-weight: 600;
	margin-top: 16px;
	margin-bottom: 8px;
}

.help-section p {
	color: #4b5563;
	margin-bottom: 12px;
}

.help-section ul,
.help-section ol {
	color: #4b5563;
	margin-left: 24px;
	margin-bottom: 16px;
}

.help-section li {
	margin-bottom: 8px;
}

.help-section strong {
	color: #1f2937;
	font-weight: 600;
}

.code-box {
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 12px 16px;
	margin: 12px 0;
	font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
	font-size: 13px;
	line-height: 1.6;
	overflow-x: auto;
}

.code-box code {
	color: #1f2937;
	background: transparent;
}

.info-box {
	background: #eff6ff;
	border-left: 4px solid #3b82f6;
	padding: 16px;
	margin: 16px 0;
	border-radius: 4px;
}

.info-box p {
	margin-bottom: 8px;
	color: #1e40af;
}

.info-box p:last-child {
	margin-bottom: 0;
}

.info-box .warning {
	color: #dc2626;
	font-weight: 600;
}

.info-box .code-box {
	background: white;
	margin-top: 12px;
}

.dialog-footer {
	display: flex;
	justify-content: flex-end;
}

/* 滚动条样式 */
.help-content::-webkit-scrollbar {
	width: 6px;
}

.help-content::-webkit-scrollbar-track {
	background: #f1f1f1;
}

.help-content::-webkit-scrollbar-thumb {
	background: #888;
	border-radius: 3px;
}

.help-content::-webkit-scrollbar-thumb:hover {
	background: #555;
}
</style>
