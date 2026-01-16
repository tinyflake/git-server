<template>
	<footer class="footer">
		<div class="footer-container">
			<div class="footer-content">
				<p class="copyright">
					© 2026 私有仓库管理系统. All rights reserved.
				</p>
				<div class="footer-links">
					<a href="#" class="footer-link">帮助文档</a>
					<span class="divider">|</span>
					<a href="#" class="footer-link">关于我们</a>
					<span class="divider">|</span>
					<a href="#" class="footer-link">联系我们</a>
				</div>
			</div>
		</div>
	</footer>
</template>

<script setup>
// Footer 组件
</script>

<style scoped>
.footer {
	background: #f9fafb;
	border-top: 1px solid #e5e7eb;
	padding: 24px 0;
	margin-top: auto;
}

.footer-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 24px;
}

.footer-content {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 16px;
}

.copyright {
	margin: 0;
	color: #6b7280;
	font-size: 14px;
}

.footer-links {
	display: flex;
	align-items: center;
	gap: 12px;
}

.footer-link {
	color: #6b7280;
	text-decoration: none;
	font-size: 14px;
	transition: color 0.2s;
}

.footer-link:hover {
	color: #4b5563;
}

.divider {
	color: #d1d5db;
}

@media (max-width: 768px) {
	.footer-content {
		flex-direction: column;
		text-align: center;
	}
}
</style>
