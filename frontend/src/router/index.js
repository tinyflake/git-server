import { createRouter, createWebHashHistory } from "vue-router"
import Layout from "../views/Layout.vue"
import Home from "../views/Home.vue"
import RepoDetail from "../views/RepoDetail.vue"
import Login from "../views/Login.vue"
import UserManagement from "../views/UserManagement.vue"
import { authUtils } from "../api/auth.js"

const routes = [
	{
		path: "/login",
		name: "Login",
		component: Login,
		meta: { requiresGuest: true },
	},
	{
		path: "/",
		component: Layout,
		meta: { requiresAuth: true },
		children: [
			{
				path: "",
				name: "Home",
				component: Home,
			},
			{
				path: "repo/:name",
				name: "RepoDetail",
				component: RepoDetail,
				props: true,
			},
			{
				path: "users",
				name: "UserManagement",
				component: UserManagement,
				meta: { requiresAdmin: true },
			},
			{
				path: "permissions",
				name: "PermissionManagement",
				component: () => import("../views/PermissionManagement.vue"),
				meta: { requiresAdmin: true },
			},
			{
				path: "repos",
				name: "RepoManagement",
				component: () => import("../views/RepoManagement.vue"),
				meta: { requiresAdmin: true },
			},
			{
				path: "logs",
				name: "OperationLogs",
				component: () => import("../views/OperationLogs.vue"),
				meta: { requiresAdmin: true },
			},
		],
	},
]

const router = createRouter({
	history: createWebHashHistory(),
	routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
	const isLoggedIn = authUtils.isLoggedIn()
	const isAdmin = authUtils.isAdmin()

	// 需要登录的页面
	if (to.meta.requiresAuth && !isLoggedIn) {
		next({ name: "Login", query: { redirect: to.fullPath } })
		return
	}

	// 需要管理员权限的页面
	if (to.meta.requiresAdmin && !isAdmin) {
		next({ name: "Home" })
		return
	}

	// 只允许游客访问的页面（如登录页）
	if (to.meta.requiresGuest && isLoggedIn) {
		next({ name: "Home" })
		return
	}

	next()
})

export default router
