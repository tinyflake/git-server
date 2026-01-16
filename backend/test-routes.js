// 测试路由是否正确加载
const dataMigrationRoutes = require("./routes/data-migration-routes")

console.log("✅ 数据迁移路由加载成功")
console.log("路由类型:", typeof dataMigrationRoutes)
console.log("路由对象:", dataMigrationRoutes)

// 检查路由栈
if (dataMigrationRoutes.stack) {
	console.log("\n📋 注册的路由:")
	dataMigrationRoutes.stack.forEach((layer) => {
		if (layer.route) {
			const methods = Object.keys(layer.route.methods)
				.join(", ")
				.toUpperCase()
			console.log(`  ${methods} ${layer.route.path}`)
		}
	})
} else {
	console.log("⚠️ 无法读取路由栈")
}

console.log("\n✅ 测试完成")
