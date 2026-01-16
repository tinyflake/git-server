<template>
	<el-dialog
		v-model="visible"
		title="创建新仓库"
		width="500px"
		@close="handleClose"
	>
		<el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
			<el-form-item label="仓库名称" prop="repoName">
				<el-input
					v-model="form.repoName"
					placeholder="请输入仓库名称"
				/>
			</el-form-item>
			<el-form-item label="描述" prop="desc">
				<el-input v-model="form.desc" placeholder="请输入仓库描述" />
			</el-form-item>
			<el-form-item label="存储路径" prop="repoPath">
				<el-input
					v-model="form.repoPath"
					placeholder="默认路径: backend/repos/[仓库名称]"
				/>
				<div class="form-tip">留空将使用默认路径 (backend/repos)</div>
			</el-form-item>
		</el-form>

		<template #footer>
			<el-button @click="visible = false">取消</el-button>
			<el-button type="primary" @click="handleSubmit" :loading="loading"
				>创建</el-button
			>
		</template>
	</el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue"

const props = defineProps({
	modelValue: Boolean,
	loading: Boolean,
})

const emit = defineEmits(["update:modelValue", "submit"])

const visible = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
})

const formRef = ref()
const form = ref({
	repoName: "",
	desc: "",
	repoPath: "",
})

const rules = {
	repoName: [
		{ required: true, message: "请输入仓库名称", trigger: "blur" },
		{
			pattern: /^[a-zA-Z0-9_-]+$/,
			message: "仓库名称只能包含字母、数字、下划线和横线",
			trigger: "blur",
		},
	],
	desc: [{ required: true, message: "请输入仓库描述", trigger: "blur" }],
}

const handleSubmit = async () => {
	if (!formRef.value) return
	const valid = await formRef.value.validate().catch(() => false)
	if (!valid) return
	emit("submit", { ...form.value })
}

const handleClose = () => {
	form.value = { repoName: "", desc: "", repoPath: "" }
	formRef.value?.clearValidate()
	emit("update:modelValue", false)
}

watch(visible, (val) => {
	if (!val) {
		handleClose()
	}
})
</script>

<style scoped>
.form-tip {
	font-size: 12px;
	color: #6b7280;
	margin-top: 4px;
}
</style>
