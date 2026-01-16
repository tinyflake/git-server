<template>
	<div class="repo-detail">
		<!-- 顶部导航栏 -->
		<header class="top-header">
			<div class="header-container">
				<div class="breadcrumb-section">
					<el-button text @click="goBack" class="back-btn">
						<el-icon><ArrowLeft /></el-icon>
						返回
					</el-button>
					<span class="separator">/</span>
					<div class="package-title">
						<el-icon class="package-icon"><Box /></el-icon>
						<h1>{{ repoName }}</h1>
					</div>
				</div>

				<div class="header-actions">
					<el-button @click="showGuideDialog = true">
						<el-icon><Document /></el-icon>
						操作指南
					</el-button>
				</div>
			</div>
		</header>

		<!-- 主要内容区域 -->
		<main class="main-content" v-loading="loading">
			<div class="content-container">
				<div
					class="content-layout"
					:class="{ 'full-width': !showSidebar }"
				>
					<!-- 左侧主要内容 -->
					<div class="main-section">
						<div v-if="repoInfo" class="package-content">
							<!-- 包描述 -->
							<div class="package-description-section">
								<p class="package-description">
									{{ repoInfo.desc || "暂无描述" }}
								</p>
							</div>

							<!-- 标签页内容 -->
							<div class="package-tabs">
								<el-tabs
									v-model="activeTab"
									class="detail-tabs"
								>
									<el-tab-pane label="README" name="readme">
										<div class="tab-content">
											<div
												class="readme-container"
												v-loading="readmeLoading"
											>
												<div
													v-if="readmeContent"
													class="readme-wrapper"
												>
													<!-- 目录 -->
													<div
														v-if="
															showToc &&
															readmeHeadings.length >
																0
														"
														class="readme-toc"
													>
														<div class="toc-header">
															<h4>目录</h4>
														</div>
														<ul class="toc-list">
															<li
																v-for="heading in readmeHeadings"
																:key="
																	heading.anchor
																"
																:class="`toc-level-${heading.level}`"
																class="toc-item"
															>
																<a
																	href="#"
																	@click.prevent="
																		scrollToHeading(
																			heading.anchor
																		)
																	"
																	class="toc-link"
																>
																	{{
																		heading.text
																	}}
																</a>
															</li>
														</ul>
													</div>
													<div class="readme-content">
														<div
															class="markdown-body"
															v-html="
																renderedReadme
															"
														></div>
													</div>
												</div>

												<!-- 无README文件状态 -->
												<div
													v-else-if="!readmeLoading"
													class="no-readme"
												>
													<div
														class="no-readme-content"
													>
														<el-icon
															class="no-readme-icon"
															><Document
														/></el-icon>
														<h3>
															没有找到 README.md
															文件
														</h3>
														<p>
															这个仓库还没有
															README.md 文件
														</p>
														<div
															class="readme-suggestion"
														>
															<h4>
																建议添加
																README.md 文件：
															</h4>
															<div
																class="command-box"
															>
																<code
																	>echo "#
																	{{
																		repoName
																	}}" >
																	README.md</code
																>
																<el-button
																	size="small"
																	@click="
																		copyReadmeCommands.create()
																	"
																	:icon="
																		CopyDocument
																	"
																/>
															</div>
															<div
																class="command-box"
															>
																<code
																	>git add
																	README.md</code
																>
																<el-button
																	size="small"
																	@click="
																		copyReadmeCommands.add()
																	"
																	:icon="
																		CopyDocument
																	"
																/>
															</div>
															<div
																class="command-box"
															>
																<code
																	>git commit
																	-m "Add
																	README"</code
																>
																<el-button
																	size="small"
																	@click="
																		copyReadmeCommands.commit()
																	"
																	:icon="
																		CopyDocument
																	"
																/>
															</div>
															<div
																class="command-box"
															>
																<code
																	>git push
																	origin
																	main</code
																>
																<el-button
																	size="small"
																	@click="
																		copyReadmeCommands.push()
																	"
																	:icon="
																		CopyDocument
																	"
																/>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</el-tab-pane>

									<el-tab-pane label="版本" name="versions">
										<div class="tab-content">
											<div
												class="versions-content"
												v-loading="versionsLoading"
											>
												<div class="versions-header">
													<h3>版本历史</h3>
													<div
														v-if="currentVersion"
														class="current-version-info"
													>
														<span
															class="current-label"
															>当前查看版本：</span
														>
														<span
															class="current-version-tag"
															>{{
																currentVersion.version
															}}</span
														>
														<span
															class="current-hash"
															>({{
																currentVersion.shortHash
															}})</span
														>
													</div>
												</div>

												<div
													v-if="versions.length > 0"
													class="version-list"
												>
													<div
														v-for="version in versions"
														:key="version.hash"
														class="version-item"
														:class="{
															active:
																currentVersion?.hash ===
																version.hash,
														}"
													>
														<div
															class="version-main"
														>
															<div
																class="version-header"
															>
																<button
																	class="version-number-btn"
																	@click="
																		switchToVersion(
																			version
																		)
																	"
																	:class="{
																		active:
																			currentVersion?.hash ===
																			version.hash,
																	}"
																>
																	{{
																		version.version
																	}}
																</button>
																<div
																	class="version-tags"
																>
																	<span
																		v-if="
																			version.isLatest
																		"
																		class="version-tag latest"
																		>latest</span
																	>
																	<span
																		class="version-tag hash"
																		>{{
																			version.shortHash
																		}}</span
																	>
																</div>
															</div>

															<div
																class="version-details"
															>
																<p
																	class="commit-message"
																>
																	<span
																		>message: </span
																	>{{
																		version.message
																	}}
																</p>
																<div
																	class="version-meta"
																>
																	<span
																		class="meta-item"
																	>
																		<el-icon
																			><User
																		/></el-icon>
																		{{
																			version.author
																		}}
																	</span>
																	<span
																		class="meta-item"
																	>
																		<el-icon
																			><Calendar
																		/></el-icon>
																		{{
																			formatDate(
																				version.date
																			)
																		}}
																	</span>
																</div>
															</div>
														</div>

														<div
															class="version-actions"
														>
															<el-button
																size="small"
																type="primary"
																@click="
																	switchToVersion(
																		version
																	)
																"
																:disabled="
																	currentVersion?.hash ===
																	version.hash
																"
															>
																查看
															</el-button>
														</div>
													</div>
												</div>

												<div
													v-else-if="!versionsLoading"
													class="no-versions"
												>
													<el-icon
														class="no-versions-icon"
														><Document
													/></el-icon>
													<p>暂无版本记录</p>
												</div>
											</div>
										</div>
									</el-tab-pane>

									<el-tab-pane
										label="依赖"
										name="dependencies"
									>
										<div class="tab-content">
											<div class="dependencies-content">
												<h3>依赖项</h3>
												<p class="no-dependencies">
													此包暂无依赖项
												</p>
											</div>
										</div>
									</el-tab-pane>

									<!-- 文件浏览选项卡 -->
									<el-tab-pane label="文件" name="files">
										<div class="tab-content">
											<!-- 无权限提示 -->
											<el-empty
												v-if="!hasCodeViewPermission"
												description="您没有查看此仓库代码的权限"
											>
												<template #image>
													<el-icon
														:size="100"
														color="#909399"
													>
														<Lock />
													</el-icon>
												</template>
												<el-button
													type="primary"
													@click="contactAdmin"
													>联系管理员开通权限</el-button
												>
											</el-empty>

											<!-- 有权限时显示文件浏览 -->
											<div
												v-else
												class="files-content"
												v-loading="filesLoading"
											>
												<div class="files-header">
													<div class="files-toolbar">
														<el-select
															v-model="
																currentBranch
															"
															placeholder="选择分支"
															size="small"
															style="width: 150px"
															@change="
																handleBranchChange
															"
														>
															<el-option
																v-for="branch in branches"
																:key="
																	branch.name
																"
																:label="
																	branch.name
																"
																:value="
																	branch.name
																"
															>
																<span>{{
																	branch.name
																}}</span>
																<el-tag
																	v-if="
																		branch.isCurrent
																	"
																	size="small"
																	type="success"
																	style="
																		margin-left: 8px;
																	"
																	>当前</el-tag
																>
															</el-option>
														</el-select>
														<el-input
															v-model="fileSearch"
															placeholder="搜索文件名..."
															size="small"
															clearable
															style="
																width: 250px;
																margin-left: 12px;
															"
														>
															<template #prefix>
																<el-icon
																	><Search
																/></el-icon>
															</template>
														</el-input>
													</div>
												</div>

												<div class="files-layout">
													<!-- 左侧文件树 -->
													<div
														class="file-tree-panel"
													>
														<el-tree
															:data="fileTreeData"
															:props="
																fileTreeProps
															"
															:load="loadNode"
															lazy
															node-key="path"
															:highlight-current="
																true
															"
															:expand-on-click-node="
																false
															"
															@node-click="
																handleFileClick
															"
															:filter-node-method="
																filterFileNode
															"
															ref="fileTreeRef"
														>
															<template
																#default="{
																	node,
																	data,
																}"
															>
																<span
																	class="custom-tree-node"
																>
																	<el-icon
																		v-if="
																			data.type ===
																			'directory'
																		"
																		><Folder
																	/></el-icon>
																	<el-icon
																		v-else
																		><Document
																	/></el-icon>
																	<span>{{
																		node.label
																	}}</span>
																	<span
																		v-if="
																			data.size
																		"
																		class="file-size"
																		>{{
																			formatFileSize(
																				data.size
																			)
																		}}</span
																	>
																</span>
															</template>
														</el-tree>
													</div>

													<!-- 右侧文件预览 -->
													<div
														class="file-preview-panel"
													>
														<div
															v-if="!selectedFile"
															class="no-file-selected"
														>
															<el-icon
																class="no-file-icon"
																><Document
															/></el-icon>
															<p>
																请从左侧选择文件查看
															</p>
														</div>

														<div
															v-else-if="
																fileContentLoading
															"
															class="file-loading"
															v-loading="true"
														></div>

														<div
															v-else
															class="file-content-wrapper"
														>
															<!-- 文件头部 -->
															<div
																class="file-header"
															>
																<div
																	class="file-info"
																>
																	<el-icon
																		><Document
																	/></el-icon>
																	<span
																		class="file-name"
																		>{{
																			selectedFile.name
																		}}</span
																	>
																	<span
																		v-if="
																			selectedFile.size
																		"
																		class="file-size-badge"
																		>{{
																			formatFileSize(
																				selectedFile.size
																			)
																		}}</span
																	>
																</div>
																<div
																	class="file-actions"
																>
																	<el-button
																		size="small"
																		@click="
																			copyFileContent
																		"
																		:icon="
																			CopyDocument
																		"
																	>
																		复制
																	</el-button>
																	<el-button
																		size="small"
																		type="primary"
																		@click="
																			downloadCurrentFile
																		"
																		:icon="
																			Download
																		"
																	>
																		下载
																	</el-button>
																</div>
															</div>

															<!-- 文件内容 -->
															<div
																class="file-content"
															>
																<!-- 图片预览 -->
																<div
																	v-if="
																		fileContent.isImage
																	"
																	class="image-preview"
																>
																	<el-image
																		:src="`data:image/${fileContent.extension.replace(
																			'.',
																			''
																		)};base64,${btoa(
																			fileContent.content
																		)}`"
																		fit="contain"
																		:preview-src-list="[
																			`data:image/${fileContent.extension.replace(
																				'.',
																				''
																			)};base64,${btoa(
																				fileContent.content
																			)}`,
																		]"
																	/>
																</div>

																<!-- 文件过大提示 -->
																<div
																	v-else-if="
																		fileContent.tooLarge
																	"
																	class="file-too-large"
																>
																	<el-icon
																		class="warning-icon"
																		><Warning
																	/></el-icon>
																	<p>
																		文件过大（>5MB），无法预览
																	</p>
																	<el-button
																		type="primary"
																		@click="
																			downloadCurrentFile
																		"
																		:icon="
																			Download
																		"
																	>
																		下载文件
																	</el-button>
																</div>

																<!-- 二进制文件提示 -->
																<div
																	v-else-if="
																		fileContent.isBinary &&
																		!fileContent.isImage
																	"
																	class="binary-file"
																>
																	<el-icon
																		class="info-icon"
																		><Document
																	/></el-icon>
																	<p>
																		二进制文件，无法预览
																	</p>
																	<el-button
																		type="primary"
																		@click="
																			downloadCurrentFile
																		"
																		:icon="
																			Download
																		"
																	>
																		下载文件
																	</el-button>
																</div>

																<!-- 代码预览 -->
																<pre
																	v-else
																	class="code-preview"
																><code v-html="highlightedCode"></code></pre>
															</div>
														</div>
													</div>
												</div>
											</div>
											<!-- 结束 v-else (有权限时显示) -->
										</div>
									</el-tab-pane>

									<!-- 提交历史选项卡 -->
									<el-tab-pane
										label="提交历史"
										name="commits"
									>
										<div class="tab-content">
											<div
												class="commits-content"
												v-loading="commitsLoading"
											>
												<div class="commits-header">
													<h3>提交历史</h3>
													<el-select
														v-model="commitsBranch"
														placeholder="选择分支"
														size="small"
														style="width: 150px"
														@change="
															loadCommits(true)
														"
													>
														<el-option
															v-for="branch in branches"
															:key="branch.name"
															:label="branch.name"
															:value="branch.name"
														>
															<span>{{
																branch.name
															}}</span>
															<el-tag
																v-if="
																	branch.isCurrent
																"
																size="small"
																type="success"
																style="
																	margin-left: 8px;
																"
																>当前</el-tag
															>
														</el-option>
													</el-select>
												</div>

												<div
													v-if="commits.length > 0"
													class="commits-list"
												>
													<div
														v-for="(
															commit, index
														) in commits"
														:key="commit.hash"
														class="commit-item"
													>
														<div
															class="commit-graph"
														>
															<div
																class="commit-dot"
															></div>
															<div
																v-if="
																	index <
																	commits.length -
																		1
																"
																class="commit-line"
															></div>
														</div>

														<div
															class="commit-content"
														>
															<div
																class="commit-header"
															>
																<span
																	class="commit-message"
																	>{{
																		commit.message
																	}}</span
																>
																<div
																	class="commit-tags"
																>
																	<el-tag
																		v-for="branch in commit.branches"
																		:key="
																			branch
																		"
																		size="small"
																		type="success"
																		>{{
																			branch
																		}}</el-tag
																	>
																	<el-tag
																		v-for="tag in commit.tags"
																		:key="
																			tag
																		"
																		size="small"
																		type="warning"
																		>{{
																			tag
																		}}</el-tag
																	>
																</div>
															</div>

															<div
																class="commit-meta"
															>
																<span
																	class="commit-hash"
																	>{{
																		commit.shortHash
																	}}</span
																>
																<span
																	class="commit-author"
																>
																	<el-icon
																		><User
																	/></el-icon>
																	{{
																		commit.author
																	}}
																</span>
																<span
																	class="commit-date"
																>
																	<el-icon
																		><Calendar
																	/></el-icon>
																	{{
																		formatDate(
																			commit.date
																		)
																	}}
																</span>
															</div>
														</div>
													</div>

													<!-- 加载更多 -->
													<div
														v-if="hasMoreCommits"
														class="load-more"
													>
														<el-button
															@click="
																loadMoreCommits
															"
															:loading="
																loadingMore
															"
														>
															加载更多
														</el-button>
													</div>
												</div>

												<div
													v-else-if="!commitsLoading"
													class="no-commits"
												>
													<el-icon
														class="no-commits-icon"
														><Document
													/></el-icon>
													<p>暂无提交记录</p>
												</div>
											</div>
										</div>
									</el-tab-pane>
								</el-tabs>
							</div>
						</div>

						<!-- 加载状态 -->
						<div v-else-if="!loading" class="error-state">
							<el-result
								icon="warning"
								title="包不存在"
								sub-title="请检查包名称是否正确"
							>
								<template #extra>
									<el-button type="primary" @click="goBack"
										>返回首页</el-button
									>
								</template>
							</el-result>
						</div>
					</div>

					<!-- 右侧信息面板 -->
					<aside class="sidebar" v-if="repoInfo && showSidebar">
						<div class="sidebar-content">
							<!-- 安装命令 -->
							<div class="sidebar-section">
								<div class="install-header">
									<h4>安装</h4>
									<el-button
										size="small"
										type="primary"
										plain
										@click="
											copyFullInstallCommand(
												activePackageManager
											)
										"
									>
										一键复制
									</el-button>
								</div>
								<div class="install-commands">
									<!-- 包管理器选择 -->
									<div class="package-manager-selector">
										<el-radio-group
											v-model="activePackageManager"
											size="small"
										>
											<el-radio-button label="npm"
												>npm</el-radio-button
											>
											<el-radio-button label="yarn"
												>yarn</el-radio-button
											>
											<el-radio-button label="pnpm"
												>pnpm</el-radio-button
											>
										</el-radio-group>
									</div>

									<!-- 命令显示 -->
									<div class="install-steps">
										<div class="install-step">
											<div class="step-number">1</div>
											<div class="step-content">
												<div class="step-title">
													设置镜像源
												</div>
												<div class="command-input">
													<code
														>{{
															activePackageManager
														}}
														config set registry
														http://{{ serverIP }}:{{
															serverPort
														}}/</code
													>
													<el-button
														size="small"
														@click="
															copyToClipboard(
																`${activePackageManager} config set registry http://${serverIP}:${serverPort}/`
															)
														"
														:icon="CopyDocument"
													/>
												</div>
											</div>
										</div>

										<div class="install-step">
											<div class="step-number">2</div>
											<div class="step-content">
												<div class="step-title">
													安装包
												</div>
												<div class="command-input">
													<code>{{
														getInstallCommand(
															activePackageManager
														)
													}}</code>
													<el-button
														size="small"
														@click="
															copyToClipboard(
																getInstallCommand(
																	activePackageManager
																)
															)
														"
														:icon="CopyDocument"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- 仓库信息 -->
							<div class="sidebar-section">
								<h4>仓库</h4>
								<div class="repo-links">
									<a
										:href="gitUrl"
										class="repo-link"
										target="_blank"
									>
										<el-icon><Link /></el-icon>
										仓库地址
									</a>
								</div>
							</div>

							<!-- 主页 -->
							<div class="sidebar-section">
								<h4>主页</h4>
								<div class="homepage-link">
									<a :href="gitUrl" target="_blank">{{
										gitUrl
									}}</a>
								</div>
							</div>

							<!-- 版本信息 -->
							<div class="sidebar-section">
								<div class="version-header">
									<h4>当前版本</h4>
									<el-button
										v-if="
											currentVersion &&
											!currentVersion.isLatest
										"
										size="small"
										type="primary"
										plain
										@click="resetToLatestVersion"
									>
										回到最新
									</el-button>
								</div>
								<div
									class="version-info"
									v-if="displayVersionInfo"
								>
									<div class="current-version">
										<span class="version-number">{{
											displayVersionInfo.version || "未知"
										}}</span>
										<span
											v-if="displayVersionInfo.isLatest"
											class="version-tag latest"
											>latest</span
										>
										<span v-else class="version-tag">{{
											displayVersionInfo.shortHash
										}}</span>
									</div>
									<div class="version-date">
										发布于
										{{
											formatDate(displayVersionInfo.date)
										}}
									</div>
									<div
										v-if="displayVersionInfo.message"
										class="version-message"
									>
										{{ displayVersionInfo.message }}
									</div>

									<!-- 下载按钮 -->
									<div class="version-actions">
										<el-button
											type="primary"
											size="small"
											@click="downloadCurrentVersion"
											:icon="Download"
										>
											下载此版本
										</el-button>
									</div>
								</div>
							</div>

							<!-- 许可证 -->
							<div class="sidebar-section">
								<h4>许可证</h4>
								<div class="license-info">
									<span class="license-name">{{
										repoInfo.license || "MIT"
									}}</span>
								</div>
							</div>

							<!-- 最后更新者 -->
							<div class="sidebar-section">
								<h4>
									{{
										displayVersionInfo?.isLatest
											? "最后更新者"
											: "版本作者"
									}}
								</h4>
								<div
									class="maintainer-info"
									v-if="displayVersionInfo"
								>
									<div class="maintainer-item">
										<el-icon><User /></el-icon>
										<div class="maintainer-details">
											<div class="maintainer-name">
												{{
													displayVersionInfo.author ||
													"Unknown"
												}}
											</div>
											<div
												v-if="displayVersionInfo.email"
												class="maintainer-email"
											>
												{{ displayVersionInfo.email }}
											</div>
											<div
												v-if="
													displayVersionInfo.message
												"
												class="last-commit"
											>
												<span class="commit-message">{{
													displayVersionInfo.message
												}}</span>
												<span
													v-if="
														displayVersionInfo.shortHash
													"
													class="commit-hash"
												>
													({{
														displayVersionInfo.shortHash
													}})
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- 关键词 -->
							<div
								class="sidebar-section"
								v-if="
									repoInfo.keywords &&
									repoInfo.keywords.length
								"
							>
								<h4>关键词</h4>
								<div class="keywords-list">
									<span
										v-for="keyword in repoInfo.keywords"
										:key="keyword"
										class="keyword-tag"
									>
										{{ keyword }}
									</span>
								</div>
							</div>

							<!-- 统计信息 -->
							<div class="sidebar-section">
								<h4>统计</h4>
								<div
									class="stats-info"
									v-if="displayVersionInfo"
								>
									<div class="stat-item">
										<span class="stat-label">{{
											displayVersionInfo.isLatest
												? "最后更新"
												: "版本发布"
										}}</span>
										<span class="stat-value">{{
											formatDate(displayVersionInfo.date)
										}}</span>
									</div>
									<div
										v-if="displayVersionInfo.hash"
										class="stat-item"
									>
										<span class="stat-label">提交哈希</span>
										<span
											class="stat-value commit-hash-value"
											>{{
												displayVersionInfo.shortHash
											}}</span
										>
									</div>
								</div>
							</div>
						</div>
					</aside>
				</div>
			</div>
		</main>

		<!-- 操作指南对话框 -->
		<el-dialog
			v-model="showGuideDialog"
			title="📖 Git 操作指南"
			width="600px"
		>
			<div class="guide-content">
				<el-tabs type="border-card">
					<el-tab-pane label="克隆仓库">
						<div class="guide-section">
							<p>使用以下命令克隆仓库到本地：</p>
							<div class="command-box">
								<code>git clone {{ gitUrl }}</code>
								<el-button
									size="small"
									@click="
										copyToClipboard(`git clone ${gitUrl}`)
									"
									:icon="CopyDocument"
								/>
							</div>
						</div>
					</el-tab-pane>

					<el-tab-pane label="推送代码">
						<div class="guide-section">
							<p>将本地代码推送到此仓库：</p>
							<div class="command-step">
								<div class="step-number">1</div>
								<div class="step-content">
									<p>添加远程仓库：</p>
									<div class="command-box">
										<code
											>git remote add origin
											{{ gitUrl }}</code
										>
										<el-button
											size="small"
											@click="
												copyToClipboard(
													`git remote add origin ${gitUrl}`
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>

							<div class="command-step">
								<div class="step-number">2</div>
								<div class="step-content">
									<p>推送代码：</p>
									<div class="command-box">
										<code>git push -u origin main</code>
										<el-button
											size="small"
											@click="
												copyToClipboard(
													'git push -u origin main'
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>
						</div>
					</el-tab-pane>
				</el-tabs>
			</div>

			<template #footer>
				<el-button type="primary" @click="showGuideDialog = false">
					知道了
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import {
	ArrowLeft,
	Box,
	Document,
	Link,
	User,
	CopyDocument,
	Calendar,
	Download,
	Folder,
	Search,
	Warning,
	Lock,
} from "@element-plus/icons-vue"
import { repoApi } from "../api/repo.js"
import { renderMarkdown, extractHeadings } from "../utils/markdown.js"
import configManager from "../utils/config"
import hljs from "highlight.js"
import "highlight.js/styles/github.css" // 代码高亮样式

const props = defineProps({
	name: {
		type: String,
		required: true,
	},
})

const router = useRouter()

// 响应式数据
const repoName = ref(props.name)
const repoInfo = ref(null)
const loading = ref(false)
const activeTab = ref("readme")
const showGuideDialog = ref(false)
const readmeLoading = ref(false)
const readmeContent = ref("")
const renderedReadme = ref("")
const readmeHeadings = ref([])
const showToc = ref(false)
// 版本相关数据
const versions = ref([])
const versionsLoading = ref(false)
const currentVersion = ref(null) // 当前选中的版本
// 安装相关数据
const activePackageManager = ref("npm") // 默认选中npm

// 文件浏览相关数据
const filesLoading = ref(false)
const branches = ref([])
const currentBranch = ref("main")
const fileTreeData = ref([])
const fileTreeProps = {
	label: "name",
	children: "children",
	isLeaf: "isLeaf",
}
const fileTreeRef = ref(null)
const fileSearch = ref("")
const selectedFile = ref(null)
const fileContent = ref(null)
const fileContentLoading = ref(false)
const highlightedCode = ref("")
const hasCodeViewPermission = ref(true) // 默认有权限，加载后更新

// 提交历史相关数据
const commitsLoading = ref(false)
const commits = ref([])
const commitsBranch = ref("main")
const commitsPage = ref(1)
const hasMoreCommits = ref(false)
const loadingMore = ref(false)

// 计算属性
const gitUrl = computed(() => {
	if (!repoInfo.value) return ""
	return configManager.getGitUrl(repoInfo.value.repoName)
})

// 控制sidebar显示：文件标签页时隐藏
const showSidebar = computed(() => {
	return activeTab.value !== "files"
})

// 服务器IP和端口
const serverIP = computed(() => configManager.getDisplayConfig().serverIP)
const serverPort = computed(() => configManager.getDisplayConfig().serverPort)

// 当前显示的版本信息（如果选择了特定版本，显示该版本信息；否则显示最新版本）
const displayVersionInfo = computed(() => {
	if (currentVersion.value) {
		return {
			version: currentVersion.value.version,
			author: currentVersion.value.author,
			email: currentVersion.value.email,
			date: currentVersion.value.date,
			message: currentVersion.value.message,
			hash: currentVersion.value.hash,
			shortHash: currentVersion.value.shortHash,
			isLatest: currentVersion.value.isLatest,
		}
	}

	// 如果没有选择特定版本，使用仓库的基本信息
	if (repoInfo.value) {
		return {
			version: repoInfo.value.version,
			author: repoInfo.value.author,
			email: repoInfo.value.authorEmail,
			date: repoInfo.value.lastModified,
			message: repoInfo.value.lastCommitMessage,
			hash: repoInfo.value.lastCommitHash,
			shortHash: repoInfo.value.lastCommitHash?.substring(0, 7),
			isLatest: true,
		}
	}

	return null
})

// 返回首页
const goBack = () => {
	router.push("/")
}

// 格式化日期 - 显示完整日期时间
const formatDate = (dateString) => {
	if (!dateString) return "未知"
	const date = new Date(dateString)

	// 检查日期是否有效
	if (isNaN(date.getTime())) return "未知"

	// 格式化为 YYYY-MM-DD HH:mm:ss
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	const hours = String(date.getHours()).padStart(2, "0")
	const minutes = String(date.getMinutes()).padStart(2, "0")
	const seconds = String(date.getSeconds()).padStart(2, "0")

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 格式化下载量
const formatDownloads = (downloads) => {
	if (!downloads || downloads === 0) return "0"
	if (downloads < 1000) return downloads.toString()
	if (downloads < 1000000) return `${(downloads / 1000).toFixed(1)}k`
	return `${(downloads / 1000000).toFixed(1)}M`
}

// 加载仓库信息
const loadRepoInfo = async () => {
	loading.value = true
	try {
		const response = await repoApi.getRepoList()
		if (response.code === 200) {
			const repo = response.data.find(
				(r) => r.repoName === repoName.value
			)

			if (repo) {
				// 获取仓库状态
				try {
					const statusResponse = await repoApi.getRepoStatus(
						repo.repoPath
					)

					// 获取最新提交信息
					let commitInfo = null
					try {
						const commitResponse = await repoApi.getLatestCommit(
							repo.repoPath
						)
						if (commitResponse.code === 200) {
							commitInfo = commitResponse.data
						}
					} catch (commitError) {
						console.warn("获取提交信息失败:", commitError)
					}

					// 获取package.json信息
					let packageInfo = null
					try {
						const packageResponse = await repoApi.getPackageInfo(
							repo.repoPath
						)
						if (packageResponse.code === 200) {
							packageInfo = packageResponse.data
						}
					} catch (packageError) {
						console.warn("获取package.json信息失败:", packageError)
					}

					repoInfo.value = {
						...repo,
						isBare:
							statusResponse.code === 200
								? statusResponse.data.isBare
								: false,
						exists:
							statusResponse.code === 200
								? statusResponse.data.exists
								: false,
						// 使用真实的package.json信息或后备数据
						version: packageInfo?.version || "未知",
						author:
							commitInfo?.author ||
							packageInfo?.author ||
							"Unknown",
						authorEmail: commitInfo?.email || "",
						license: packageInfo?.license || "MIT",
						downloads: 0, // 模拟数据
						lastModified:
							commitInfo?.date || new Date().toISOString(),
						lastCommitMessage: commitInfo?.message || "",
						lastCommitHash: commitInfo?.hash || "",
						keywords: packageInfo?.keywords || [],
					}
				} catch (error) {
					repoInfo.value = {
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
			}
		} else {
			ElMessage.error("获取仓库信息失败")
		}
	} catch (error) {
		ElMessage.error("网络请求失败")
		console.error(error)
	} finally {
		loading.value = false
	}
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
	try {
		await navigator.clipboard.writeText(text)
		ElMessage.success("已复制到剪贴板")
	} catch (error) {
		// 降级方案
		const textArea = document.createElement("textarea")
		textArea.value = text
		document.body.appendChild(textArea)
		textArea.select()
		try {
			document.execCommand("copy")
		} catch (execError) {
			console.error("复制失败:", execError)
		}
		document.body.removeChild(textArea)
		ElMessage.success("已复制到剪贴板")
	}
}

// 复制完整安装命令（包含换源）
const copyFullInstallCommand = (packageManager = "npm") => {
	const registryCommand = `${packageManager} config set registry http://${serverIP.value}:${serverPort.value}/`
	const installCommand = getInstallCommand(packageManager)

	const fullCommand = `${registryCommand}\n${installCommand}`
	copyToClipboard(fullCommand)
}

// 获取安装命令
const getInstallCommand = (packageManager) => {
	switch (packageManager) {
		case "yarn":
			return `yarn add ${repoName.value}`
		case "pnpm":
			return `pnpm add ${repoName.value}`
		default:
			return `npm install ${repoName.value}`
	}
}

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
			// 使用专业的Markdown渲染
			renderedReadme.value = renderMarkdown(response.data.content)
			// 提取标题用于目录
			readmeHeadings.value = extractHeadings(response.data.content)
			showToc.value = readmeHeadings.value.length > 0
			// 等待DOM更新后检查生成的标题元素
			setTimeout(() => {
				// 检查目录数据和实际DOM元素的匹配情况
				readmeHeadings.value.forEach((heading) => {
					const element = document.getElementById(heading.anchor)
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

// 跳转到标题锚点 - 改进版
const scrollToHeading = (anchor) => {
	const element = document.getElementById(anchor)
	if (element) {
		// 计算目标位置，考虑固定头部的高度
		const headerHeight = 120 // 顶部导航栏高度
		const elementTop = element.offsetTop - headerHeight

		// 使用window.scrollTo进行更精确的滚动
		window.scrollTo({
			top: elementTop,
			behavior: "smooth",
		})
	} else {
		console.error("未找到锚点元素:", anchor)
	}
}

// 复制README创建命令
const copyReadmeCommands = {
	create: () => copyToClipboard(`echo "# ${repoName.value}" > README.md`),
	add: () => copyToClipboard("git add README.md"),
	commit: () => copyToClipboard('git commit -m "Add README"'),
	push: () => copyToClipboard("git push origin main"),
}

// 加载版本列表
const loadVersions = async () => {
	if (!repoInfo.value) return

	versionsLoading.value = true
	try {
		const response = await repoApi.getVersions(repoInfo.value.repoPath)
		if (response.code === 200) {
			versions.value = response.data
			// 设置当前版本为最新版本
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
const switchToVersion = async (version) => {
	currentVersion.value = version
	activeTab.value = "readme" // 切换到README标签页

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
	activeTab.value = "readme"
	loadReadmeContent() // 重新加载最新版本的README
}

// 下载当前版本
const downloadCurrentVersion = () => {
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

// 组件挂载时加载数据
onMounted(() => {
	loadRepoInfo()
})

// 监听repoInfo变化，只加载README和版本列表
watch(
	repoInfo,
	(newRepoInfo) => {
		if (newRepoInfo) {
			loadReadmeContent()
			loadVersions()
			// 移除自动加载分支列表，改为懒加载
		}
	},
	{ immediate: true }
)

// 监听文件搜索
watch(fileSearch, (val) => {
	if (fileTreeRef.value) {
		fileTreeRef.value.filter(val)
	}
})

// ==================== 文件浏览相关方法 ====================

// 检查代码查看权限
const checkCodeViewPermission = async () => {
	if (!repoInfo.value) return

	try {
		// 尝试加载分支列表来检查权限
		const response = await repoApi.getBranches(repoInfo.value.repoPath)
		if (response.code === 200) {
			hasCodeViewPermission.value = true
		} else if (response.code === 403) {
			hasCodeViewPermission.value = false
		}
	} catch (error) {
		// 如果返回403，说明没有权限
		if (
			error.response?.status === 403 ||
			error.response?.data?.code === 403
		) {
			hasCodeViewPermission.value = false
		} else {
			console.error("检查代码查看权限失败:", error)
		}
	}
}

// 联系管理员
const contactAdmin = () => {
	ElMessage.info("请联系系统管理员开通代码查看权限")
}

// 加载分支列表
const loadBranches = async () => {
	if (!repoInfo.value || !hasCodeViewPermission.value) return

	try {
		const response = await repoApi.getBranches(repoInfo.value.repoPath)
		if (response.code === 200) {
			branches.value = response.data || []
			// 设置当前分支
			const current = branches.value.find((b) => b.isCurrent)
			if (current) {
				currentBranch.value = current.name
				commitsBranch.value = current.name
			} else if (branches.value.length > 0) {
				// 如果没有当前分支，使用第一个分支
				currentBranch.value = branches.value[0].name
				commitsBranch.value = branches.value[0].name
			}
		}
	} catch (error) {
		console.error("加载分支列表失败:", error)
		// 如果加载失败，使用默认值
		currentBranch.value = "main"
		commitsBranch.value = "main"
	}
}

// 懒加载文件树节点
const loadNode = async (node, resolve) => {
	console.log("loadNode called:", {
		level: node.level,
		data: node.data,
		isLeaf: node.data?.isLeaf,
	})

	if (node.level === 0) {
		// 根节点，加载根目录
		try {
			// 确保有分支信息
			if (!currentBranch.value && branches.value.length > 0) {
				currentBranch.value = branches.value[0].name
			}

			console.log("Loading root directory, branch:", currentBranch.value)

			const response = await repoApi.getFileTree(
				repoInfo.value.repoPath,
				currentBranch.value || "",
				""
			)

			console.log("Root directory response:", response)

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
		// 子节点
		if (node.data.type === "directory") {
			try {
				console.log("Loading directory:", node.data.path)

				const response = await repoApi.getFileTree(
					repoInfo.value.repoPath,
					currentBranch.value || "",
					node.data.path
				)

				console.log("Directory response:", response)

				if (response.code === 200) {
					resolve(response.data || [])
				} else {
					console.error("Failed to load directory:", response)
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

			// 如果是代码文件，进行高亮
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
	// 重新加载文件树
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
const downloadCurrentFile = () => {
	if (!selectedFile.value) return
	repoApi.downloadFile(
		repoInfo.value.repoPath,
		selectedFile.value.path,
		currentBranch.value
	)
	ElMessage.success("开始下载...")
}

// ==================== 提交历史相关方法 ====================

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

// 监听标签页切换
watch(activeTab, async (newTab) => {
	// 懒加载提交历史
	if (newTab === "commits" && commits.value.length === 0 && repoInfo.value) {
		loadCommits(true)
	}
	// 懒加载文件树
	if (newTab === "files" && repoInfo.value) {
		// 先检查权限
		if (branches.value.length === 0) {
			await checkCodeViewPermission()
			// 只有有权限时才加载分支
			if (hasCodeViewPermission.value) {
				loadBranches()
			}
		}
	}
})
</script>
<style scoped>
/* 全局样式 */
.repo-detail {
	min-height: 100vh;
	background: #fafafa;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
		sans-serif;
}

/* 顶部导航栏 */
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

.breadcrumb-section {
	display: flex;
	align-items: center;
	gap: 12px;
}

.back-btn {
	color: white;
	padding: 8px 12px;
}

.back-btn:hover {
	background-color: rgba(255, 255, 255, 0.1);
	color: white;
}

.separator {
	color: rgba(255, 255, 255, 0.7);
	font-size: 16px;
}

.package-title {
	display: flex;
	align-items: center;
	gap: 8px;
}

.package-icon {
	font-size: 20px;
	color: white;
}

.package-title h1 {
	margin: 0;
	font-size: 20px;
	font-weight: 600;
	color: white;
}

.header-actions .el-button {
	background: transparent;
	border-color: rgba(255, 255, 255, 0.3);
	color: white;
}

.header-actions .el-button:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.5);
	color: white;
}

/* 主要内容区域 */
.main-content {
	flex: 1;
}

.content-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 32px 24px;
}

.content-layout {
	display: grid;
	grid-template-columns: 1fr 300px;
	gap: 32px;
	align-items: start;
	transition: grid-template-columns 0.3s ease;
}

.content-layout.full-width {
	grid-template-columns: 1fr;
}

/* 左侧主要内容 */
.main-section {
	background: white;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
	overflow: hidden;
}

.package-content {
	padding: 0;
}

.package-description-section {
	padding: 24px;
	border-bottom: 1px solid #f3f4f6;
}

.package-description {
	margin: 0;
	font-size: 16px;
	color: #6b7280;
	line-height: 1.6;
}

/* 标签页 */
.package-tabs {
	padding: 0;
}

.detail-tabs :deep(.el-tabs__header) {
	margin: 0;
	padding: 0 24px;
	background: #f9fafb;
	border-bottom: 1px solid #e5e7eb;
}

.detail-tabs :deep(.el-tabs__nav-wrap) {
	padding: 0;
}

.detail-tabs :deep(.el-tabs__item) {
	padding: 16px 20px;
	font-weight: 500;
}

.detail-tabs :deep(.el-tabs__content) {
	padding: 0;
}

.tab-content {
	padding: 32px 24px;
}

/* README 内容 */
.readme-container {
	min-height: 400px;
	position: relative;
}

.readme-wrapper {
	display: block; /* 改为块级布局 */
	position: relative;
}

/* 简洁的GitHub风格目录 - 调整大小和位置 */
.readme-toc {
	width: 280px; /* 增大宽度 */
	background: #ffffff;
	border: 1px solid #d1d9e0;
	border-radius: 6px;
	padding: 20px; /* 增大内边距 */
	position: fixed;
	top: 200px; /* 与tab-content平齐 */
	left: calc((100vw - 1200px) / 2 - 300px); /* 更精确地贴着main-section左侧 */
	max-height: calc(100vh - 240px);
	overflow-y: auto;
	flex-shrink: 0;
	z-index: 100;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toc-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	padding-bottom: 8px;
	border-bottom: 1px solid #d1d9e0;
}

.toc-header h4 {
	margin: 0;
	font-size: 16px; /* 增大字体 */
	font-weight: 600;
	color: #24292f;
}

.toc-list {
	list-style: none !important;
	padding: 0;
	margin: 0;
}

.toc-item {
	margin-bottom: 2px; /* 增加间距 */
}

.toc-link {
	display: block;
	padding: 8px 12px; /* 增大内边距 */
	color: #656d76;
	text-decoration: none;
	font-size: 14px; /* 增大字体 */
	border-radius: 4px;
	transition: all 0.15s ease;
	line-height: 1.5;
}

.toc-link:hover {
	background-color: #f6f8fa;
	color: #24292f;
	text-decoration: none;
}

.toc-level-1 .toc-link {
	font-weight: 600;
	color: #24292f;
	font-size: 15px; /* 一级标题更大 */
}

.toc-level-2 .toc-link {
	padding-left: 24px; /* 增大缩进 */
	font-size: 14px;
}

.toc-level-3 .toc-link {
	padding-left: 36px; /* 增大缩进 */
	font-size: 13px;
	color: #8b949e;
}

/* 简化滚动条 */
.readme-toc::-webkit-scrollbar {
	width: 4px;
}

.readme-toc::-webkit-scrollbar-track {
	background: transparent;
}

.readme-toc::-webkit-scrollbar-thumb {
	background: #d1d9e0;
	border-radius: 2px;
}

.readme-toc::-webkit-scrollbar-thumb:hover {
	background: #8b949e;
}

.readme-content {
	flex: 1;
	min-width: 0;
	margin-right: 0;
	padding: 0 16px;
}

/* GitHub风格的Markdown样式 */
.markdown-body {
	line-height: 1.6;
	color: #24292f;
	font-size: 16px;
	word-wrap: break-word;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
		"Oxygen", "Ubuntu", "Cantarell", sans-serif;
}

/* 标题样式 - GitHub风格 */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
	margin-top: 24px;
	margin-bottom: 16px;
	font-weight: 600;
	line-height: 1.25;
	color: #24292f;
}

.markdown-body h1 {
	font-size: 2em;
	padding-bottom: 0.3em;
	border-bottom: 1px solid #d1d9e0;
	margin-bottom: 16px;
}

.markdown-body h2 {
	font-size: 1.5em;
	padding-bottom: 0.3em;
	border-bottom: 1px solid #d1d9e0;
}

.markdown-body h3 {
	font-size: 1.25em;
}

.markdown-body h4 {
	font-size: 1em;
}

.markdown-body h5 {
	font-size: 0.875em;
}

.markdown-body h6 {
	font-size: 0.85em;
	color: #656d76;
}

/* 段落样式 */
.markdown-body p {
	margin-top: 0;
	margin-bottom: 16px;
}

/* 引用块样式 */
.markdown-body blockquote {
	padding: 0 1em;
	color: #656d76;
	border-left: 0.25em solid #d1d9e0;
	margin: 0 0 16px 0;
}

/* 列表样式 */
.markdown-body ul,
.markdown-body ol {
	margin-top: 0;
	margin-bottom: 16px;
	padding-left: 2em;
}

.markdown-body li {
	margin-bottom: 0.25em;
}

.markdown-body ul li {
	list-style-type: disc;
}

.markdown-body ol li {
	list-style-type: decimal;
}

/* 内联代码样式 - 优化版 */
.markdown-body code {
	padding: 0.2em 0.4em;
	margin: 0;
	font-size: 85%;
	background-color: #f6f8fa;
	border: 1px solid #d1d9e0;
	border-radius: 4px;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", "Menlo", monospace;
	color: #d73a49;
	font-weight: 500;
	font-feature-settings: "liga" 1, "calt" 1; /* 启用连字 */
}

/* 代码块样式 - GitHub浅色主题 */
.markdown-body pre {
	padding: 20px;
	overflow: auto;
	font-size: 14px;
	line-height: 1.5;
	background-color: #f6f8fa !important;
	border-radius: 8px;
	margin: 20px 0;
	border: 1px solid #d1d9e0;
	position: relative;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.markdown-body pre code {
	display: block;
	padding: 0;
	margin: 0;
	overflow: visible;
	line-height: inherit;
	word-wrap: normal;
	background-color: transparent !important;
	border: 0;
	border-radius: 0;
	color: #1f2328 !important;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", "Menlo", monospace;
	font-feature-settings: "liga" 1, "calt" 1; /* 启用连字 */
}

/* 重置hljs样式 */
/* 全局hljs样式重置 - 确保优先级 */
:deep(.hljs) {
	padding: 10px !important;
	color: #1f2328 !important;
	background: #f6f8fa !important;
}

:deep(pre.hljs) {
	color: #1f2328 !important;
	background: #f6f8fa !important;
}

:deep(.hljs code) {
	color: #1f2328 !important;
	background: transparent !important;
}

/* GitHub浅色主题代码高亮样式 */
.markdown-body pre .hljs-keyword,
.markdown-body pre .hljs-selector-tag,
.markdown-body pre .hljs-built_in {
	color: #cf222e !important;
}

.markdown-body pre .hljs-string,
.markdown-body pre .hljs-attr {
	color: #0a3069 !important;
}

.markdown-body pre .hljs-number,
.markdown-body pre .hljs-literal {
	color: #0550ae !important;
}

.markdown-body pre .hljs-comment {
	color: #6e7781 !important;
	font-style: italic;
}

.markdown-body pre .hljs-function,
.markdown-body pre .hljs-title {
	color: #8250df !important;
}

.markdown-body pre .hljs-variable {
	color: #953800 !important;
}

/* 表格样式 */
.markdown-body table {
	border-spacing: 0;
	border-collapse: collapse;
	width: 100%;
	margin-bottom: 16px;
	border: 1px solid #d1d9e0;
	border-radius: 6px;
	overflow: hidden;
}

.markdown-body table th,
.markdown-body table td {
	padding: 6px 13px;
	border: 1px solid #d1d9e0;
}

.markdown-body table th {
	font-weight: 600;
	background-color: #f6f8fa;
}

.markdown-body table tr:nth-child(2n) {
	background-color: #f6f8fa;
}

/* 链接样式 */
.markdown-body a {
	color: #0969da;
	text-decoration: none;
}

.markdown-body a:hover {
	text-decoration: underline;
}

/* 强调文本 */
.markdown-body strong {
	font-weight: 600;
}

.markdown-body em {
	font-style: italic;
}

/* 图片样式 */
.markdown-body img {
	max-width: 100%;
	height: auto;
	border-radius: 6px;
	margin: 16px 0;
}

/* 分割线样式 */
.markdown-body hr {
	height: 0.25em;
	padding: 0;
	margin: 24px 0;
	background-color: #d1d9e0;
	border: 0;
	border-radius: 2px;
}

/* 特殊元素样式 */
.markdown-body .highlight {
	background-color: #fff8c5;
	padding: 2px 4px;
	border-radius: 3px;
}

/* 徽章样式 */
.markdown-body .badge {
	display: inline-block;
	padding: 0.25em 0.4em;
	font-size: 75%;
	font-weight: 700;
	line-height: 1;
	text-align: center;
	white-space: nowrap;
	vertical-align: baseline;
	border-radius: 0.25rem;
	background-color: #6c757d;
	color: #fff;
}

/* 无README状态 */
.no-readme {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 400px;
}

.no-readme-content {
	text-align: center;
	max-width: 600px;
}

.no-readme-icon {
	font-size: 64px;
	color: #d1d5db;
	margin-bottom: 16px;
}

.no-readme-content h3 {
	margin: 0 0 8px 0;
	font-size: 20px;
	color: #374151;
}

.no-readme-content p {
	margin: 0 0 32px 0;
	color: #6b7280;
	font-size: 16px;
}

.readme-suggestion {
	text-align: left;
	background: #f9fafb;
	padding: 24px;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
}

.readme-suggestion h4 {
	margin: 0 0 16px 0;
	font-size: 16px;
	color: #374151;
}

.readme-suggestion .command-box {
	margin-bottom: 8px;
}

/* 版本内容 - 重新设计 */
.versions-content {
	padding: 0;
}

.versions-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 1px solid #e5e7eb;
}

.versions-header h3 {
	margin: 0;
	font-size: 20px;
	color: #111827;
}

.current-version-info {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
}

.current-label {
	color: #6b7280;
}

.current-version-tag {
	background: #10b981;
	color: white;
	padding: 2px 8px;
	border-radius: 4px;
	font-weight: 500;
}

.current-hash {
	color: #6b7280;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	font-size: 12px;
}

.version-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.version-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	transition: all 0.2s ease;
	background: white;
}

.version-item:hover {
	border-color: #10b981;
	box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

.version-item.active {
	border-color: #10b981;
	background: #f0fdf4;
}

.version-main {
	flex: 1;
	min-width: 0;
}

.version-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.version-number-btn {
	background: none;
	border: none;
	font-size: 16px;
	font-weight: 600;
	color: #10b981;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	transition: all 0.2s ease;
}

.version-number-btn:hover {
	background: #f0fdf4;
	color: #059669;
}

.version-number-btn.active {
	background: #10b981;
	color: white;
}

.version-tags {
	display: flex;
	align-items: center;
	gap: 6px;
}

.version-tag {
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 11px;
	font-weight: 500;
}

.version-tag.latest {
	background: #10b981;
	color: white;
}

.version-tag.hash {
	background: #f3f4f6;
	color: #6b7280;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
}

.version-details {
	margin-top: 8px;
}

.commit-message {
	margin: 0 0 8px 0;
	padding: 5px;
	color: #374151;
	font-size: 14px;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.version-meta {
	display: flex;
	align-items: center;
	gap: 16px;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #6b7280;
	font-size: 12px;
}

.meta-item .el-icon {
	font-size: 14px;
}

.version-actions {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-left: 16px;
}

.no-versions {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	text-align: center;
}

.no-versions-icon {
	font-size: 48px;
	color: #d1d5db;
	margin-bottom: 16px;
}

.no-versions p {
	margin: 0;
	color: #6b7280;
	font-size: 16px;
}

/* 依赖内容 */
.dependencies-content h3 {
	margin: 0 0 24px 0;
	font-size: 20px;
	color: #111827;
}

.no-dependencies {
	color: #6b7280;
	font-style: italic;
}

/* 右侧边栏 */
.sidebar {
	position: sticky;
	top: 32px;
	height: fit-content;
}

.sidebar-content {
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	overflow: hidden;
}

.sidebar-section {
	padding: 20px;
	border-bottom: 1px solid #f3f4f6;
}

.sidebar-section:last-child {
	border-bottom: none;
}

.sidebar-section h4 {
	margin: 0 0 12px 0;
	font-size: 14px;
	font-weight: 600;
	color: #111827;
}

.version-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.version-header h4 {
	margin: 0;
}

.install-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.install-header h4 {
	margin: 0;
}

/* 安装命令 - 重新设计 */
.install-commands {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.package-manager-selector {
	display: flex;
	justify-content: center;
}

.package-manager-selector :deep(.el-radio-group) {
	width: 100%;
}

.package-manager-selector :deep(.el-radio-button) {
	flex: 1;
}

.package-manager-selector :deep(.el-radio-button__inner) {
	width: 100%;
	text-align: center;
	font-size: 12px;
	padding: 6px 8px;
}

.install-steps {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.install-step {
	display: flex;
	align-items: flex-start;
	gap: 12px;
}

.step-number {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	background: #10b981;
	color: white;
	border-radius: 50%;
	font-size: 11px;
	font-weight: 600;
	flex-shrink: 0;
	margin-top: 4px;
}

.step-content {
	flex: 1;
	min-width: 0;
}

.step-title {
	font-size: 12px;
	font-weight: 600;
	color: #374151;
	margin-bottom: 6px;
}

.command-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.command-label {
	font-size: 12px;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.command-input {
	display: flex;
	align-items: center;
	padding: 8px 12px;
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	min-height: 36px;
}

.command-input code {
	flex: 1;
	background: none;
	border: none;
	font-size: 12px;
	color: #111827;
	word-break: break-all;
	line-height: 1.4;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
}

.command-input .el-button {
	margin-left: 8px;
	flex-shrink: 0;
}

.install-tabs {
	margin-top: 4px;
}

.install-tabs :deep(.el-tabs__header) {
	margin: 0 0 8px 0;
}

.install-tabs :deep(.el-tabs__item) {
	padding: 6px 12px;
	font-size: 12px;
}

.install-tabs :deep(.el-tabs__content) {
	padding: 0;
}

/* 仓库链接 */
.repo-links {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.repo-link {
	display: flex;
	align-items: center;
	gap: 6px;
	color: #10b981;
	text-decoration: none;
	font-size: 14px;
}

.repo-link:hover {
	text-decoration: underline;
}

.repo-link .el-icon {
	font-size: 16px;
}

/* 主页链接 */
.homepage-link a {
	color: #10b981;
	text-decoration: none;
	font-size: 14px;
	word-break: break-all;
}

.homepage-link a:hover {
	text-decoration: underline;
}

/* 版本信息 */
.version-info {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.current-version {
	display: flex;
	align-items: center;
	gap: 8px;
}

.current-version .version-number {
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	font-weight: 600;
	color: #111827;
}

.current-version .version-tag {
	background: #10b981;
	color: white;
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 11px;
	font-weight: 500;
}

.version-date {
	color: #6b7280;
	font-size: 13px;
}

.version-message {
	color: #6b7280;
	font-size: 12px;
	line-height: 1.4;
	margin-top: 4px;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.version-actions {
	margin-top: 12px;
	display: flex;
	gap: 8px;
}

.version-actions .el-button {
	flex: 1;
}

.commit-hash-value {
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	background: #f3f4f6;
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 12px;
}

/* 许可证信息 */
.license-info {
	display: flex;
	align-items: center;
}

.license-name {
	background: #f0f9ff;
	color: #0369a1;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 13px;
	font-weight: 500;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
}

/* 维护者信息 */
.maintainer-info {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.maintainer-item {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	color: #374151;
	font-size: 14px;
}

.maintainer-item .el-icon {
	color: #6b7280;
	font-size: 16px;
	margin-top: 2px;
	flex-shrink: 0;
}

.maintainer-details {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.maintainer-name {
	font-weight: 600;
	color: #111827;
}

.maintainer-email {
	font-size: 12px;
	color: #6b7280;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
}

.last-commit {
	font-size: 12px;
	color: #6b7280;
	line-height: 1.4;
}

.commit-message {
	display: block;
	margin-bottom: 2px;
}

.commit-hash {
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	background: #f3f4f6;
	padding: 1px 4px;
	border-radius: 3px;
	font-size: 11px;
}

/* 关键词 */
.keywords-list {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.keyword-tag {
	background: #f3f4f6;
	color: #374151;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
}

/* 统计信息 */
.stats-info {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.stat-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.stat-label {
	color: #6b7280;
	font-size: 13px;
}

.stat-value {
	color: #111827;
	font-size: 13px;
	font-weight: 500;
}

/* 错误状态 */
.error-state {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 400px;
	background: white;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
}

/* 操作指南对话框 */
.guide-content {
	padding: 10px 0;
}

.guide-section {
	padding: 16px;
}

.guide-section p {
	margin: 0 0 16px 0;
	color: #6b7280;
	font-size: 14px;
}

.command-step {
	display: flex;
	margin-bottom: 20px;
	align-items: flex-start;
}

.step-number {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	background-color: #409eff;
	color: white;
	border-radius: 50%;
	font-size: 12px;
	font-weight: bold;
	flex-shrink: 0;
	margin-top: 2px;
}

.step-content {
	flex: 1;
}

.step-content p {
	margin: 0 0 8px 0;
	font-size: 14px;
	color: #6b7280;
}

/* 响应式设计 */
@media (max-width: 1024px) {
	.content-layout {
		grid-template-columns: 1fr;
		gap: 24px;
	}

	.sidebar {
		position: static;
		order: -1;
	}

	/* 在小屏幕上隐藏固定目录，恢复原来的布局 */
	.readme-toc {
		position: static;
		width: 100%;
		margin-bottom: 24px;
		top: auto;
		left: auto;
		max-height: none;
		box-shadow: none;
	}

	.readme-wrapper {
		display: block;
	}

	.readme-content {
		margin-left: 0;
		margin-right: 0;
	}
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

	.content-container {
		padding: 24px 16px;
	}

	.tab-content {
		padding: 24px 16px;
	}

	.package-description-section {
		padding: 20px 16px;
	}

	.sidebar-section {
		padding: 16px;
	}
}

/* ==================== 文件浏览样式 ==================== */

.files-content {
	padding: 0;
}

.files-header {
	padding: 16px 0;
	border-bottom: 1px solid #e5e7eb;
	margin-bottom: 16px;
}

.files-toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
}

.files-layout {
	display: grid;
	grid-template-columns: 300px 1fr;
	gap: 16px;
	min-height: 1000px;
}

.file-tree-panel {
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 12px;
	overflow-y: auto;
	max-height: 1000px;
	background: #fafafa;
}

.custom-tree-node {
	display: flex;
	align-items: center;
	gap: 6px;
	flex: 1;
	padding: 4px 0;
}

.custom-tree-node .el-icon {
	font-size: 16px;
	color: #6b7280;
}

.file-size {
	margin-left: auto;
	font-size: 12px;
	color: #9ca3af;
}

.file-preview-panel {
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	overflow: hidden;
	background: white;
}

.no-file-selected {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 600px;
	color: #9ca3af;
}

.no-file-icon {
	font-size: 64px;
	margin-bottom: 16px;
}

.file-loading {
	height: 600px;
}

.file-content-wrapper {
	display: flex;
	flex-direction: column;
	height: 1000px;
}

.file-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	border-bottom: 1px solid #e5e7eb;
	background: #f9fafb;
}

.file-info {
	display: flex;
	align-items: center;
	gap: 8px;
}

.file-name {
	font-weight: 600;
	color: #111827;
}

.file-size-badge {
	font-size: 12px;
	color: #6b7280;
	background: #f3f4f6;
	padding: 2px 8px;
	border-radius: 4px;
}

.file-actions {
	display: flex;
	gap: 8px;
}

.file-content {
	flex: 1;
	overflow: auto;
	padding: 16px;
}

.code-preview {
	margin: 0;
	padding: 16px;
	background: #f6f8fa;
	border-radius: 6px;
	overflow-x: auto;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", "Menlo", monospace;
	font-size: 14px;
	line-height: 1.6;
	font-feature-settings: "liga" 1, "calt" 1; /* 启用连字 */
}

.code-preview code {
	background: transparent;
	padding: 0;
	border: none;
	color: #24292f;
}

.image-preview {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 32px;
}

.image-preview .el-image {
	max-width: 100%;
	max-height: 500px;
}

.file-too-large,
.binary-file {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: #6b7280;
}

.warning-icon,
.info-icon {
	font-size: 64px;
	margin-bottom: 16px;
	color: #f59e0b;
}

.info-icon {
	color: #3b82f6;
}

/* ==================== 提交历史样式 ==================== */

.commits-content {
	padding: 0;
}

.commits-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 1px solid #e5e7eb;
}

.commits-header h3 {
	margin: 0;
	font-size: 20px;
	color: #111827;
}

.commits-list {
	display: flex;
	flex-direction: column;
	gap: 0;
}

.commit-item {
	display: flex;
	gap: 16px;
	padding: 16px 0;
	border-bottom: 1px solid #f3f4f6;
}

.commit-item:last-child {
	border-bottom: none;
}

.commit-graph {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 20px;
	flex-shrink: 0;
}

.commit-dot {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #10b981;
	border: 2px solid #10b981;
	flex-shrink: 0;
}

.commit-line {
	width: 2px;
	flex: 1;
	background: #e5e7eb;
	margin-top: 4px;
}

.commit-content {
	flex: 1;
	min-width: 0;
}

.commit-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 8px;
	gap: 12px;
}

.commit-message {
	font-size: 15px;
	font-weight: 500;
	color: #111827;
	flex: 1;
	word-break: break-word;
}

.commit-tags {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
}

.commit-meta {
	display: flex;
	align-items: center;
	gap: 16px;
	font-size: 13px;
	color: #6b7280;
}

.commit-hash {
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	background: #f3f4f6;
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 12px;
}

.commit-author,
.commit-date {
	display: flex;
	align-items: center;
	gap: 4px;
}

.load-more {
	display: flex;
	justify-content: center;
	padding: 24px 0;
}

.no-commits {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	text-align: center;
}

.no-commits-icon {
	font-size: 48px;
	color: #d1d5db;
	margin-bottom: 16px;
}

.no-commits p {
	margin: 0;
	color: #6b7280;
	font-size: 16px;
}
</style>
