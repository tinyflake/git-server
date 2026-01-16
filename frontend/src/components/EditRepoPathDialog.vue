<template>
	<el-dialog
		v-model="visible"
		title="修改仓库路径"
		width="500px"
		@close="handleClose"
	>
		<el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
			<el-form-item label="仓库名称">
				<el-input v-model="form.repoName" disabled />
			</el-form-item>
			<el-form-item label="新路径" prop="newPath">
				<el-input
					v-model="form.newPath"
					placeholder="请输入新的存储路径"
				/>
			</el-form-item>
		</el-form>

		<template #footer>
			<el-button @click="visible = false">取消</el-button>
			<el-button type="primary" @click="handleSubmit" :loading="loading"
				>确认修改</el-button
			>
		</template>
	</el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue"

const props = defineProps({
	modelValue: Boolean,
	loading: Boolean,
	repoData: {
		type: Object,
		default: () => ({ repoName: "", newPath: "" }),
	},
})

const emit = defineEmits(["update:modelValue", "submit"])

const visible = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
})

const formRef = ref()
const form = ref({
	repoName: "",
	newPath: "",
})

const rules = {
	newPath: [{ required: true, message: "请输入新路径", trigger: "blur" }],
}

watch(
	() => props.repoData,
	(val) => {
		if (val) {
			form.value = { ...val }
		}
	},
	{ immediate: true }
)

const handleSubmit = async () => {
	if (!formRef.value) return
	const valid = await formRef.value.validate().catch(() => false)
	if (!valid) return
	emit("submit", { ...form.value })
}

const handleClose = () => {
	formRef.value?.clearValidate()
	emit("update:modelValue", false)
}
</script>
