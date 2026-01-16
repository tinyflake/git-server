<template>
	<div id="app">
		<router-view />
	</div>
</template>

<script setup>
// 主应用组件，只负责路由渲染
</script>

<style>
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}
ul {
	padding-left: 0px !important;
}
li {
	list-style: none !important;
}
body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
		"Helvetica Neue", Arial, sans-serif;
	background-color: #f5f5f5;
}

#app {
	min-height: 100vh;
}

/* 全局样式 */
.el-button + .el-button {
	margin-left: 8px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

::-webkit-scrollbar-track {
	background: #f1f1f1;
	border-radius: 4px;
}

::-webkit-scrollbar-thumb {
	background: #c1c1c1;
	border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
	background: #a8a8a8;
}
</style>
