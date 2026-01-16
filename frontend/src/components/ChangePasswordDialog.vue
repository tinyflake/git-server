<template>
	<el-dialog
		v-model="visible"
		title="修改密码"
		width="500px"
		@close="handleClose"
	>
		<el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
			<el-form-item label="当前密码" prop="oldPassword">
				<el-input
					v-model="form.oldPassword"
					type="password"
					placeholder="请输入当前密码"
					show-password
				/>
			</el-form-item>
			<el-form-item label="新密码" prop="newPassword">
				<el-input
					v-model="form.newPassword"
					type="password"
					placeholder="请输入新密码（至少6位）"
					show-password
				/>
			</el-form-item>
			<el-form-item label="确认密码" prop="confirmPassword">
				<el-input
					v-model="form.confirmPassword"
					type="password"
					placeholder="请再次输入新密码"
					show-password
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
})

const emit = defineEmits(["update:modelValue", "submit"])

const visible = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
})

const formRef = ref()
const form = ref({
	oldPassword: "",
	newPassword: "",
	confirmPassword: "",
})

const validateConfirmPassword = (rule, value, callback) => {
	if (value !== form.value.newPassword) {
		callback(new Error("两次输入的密码不一致"))
	} else {
		callback()
	}
}

const rules = {
	oldPassword: [
		{ required: true, message: "请输入当前密码", trigger: "blur" },
	],
	newPassword: [
		{ required: true, message: "请输入新密码", trigger: "blur" },
		{ min: 6, message: "密码长度至少6位", trigger: "blur" },
	],
	confirmPassword: [
		{ required: true, message: "请再次输入新密码", trigger: "blur" },
		{ validator: validateConfirmPassword, trigger: "blur" },
	],
}

const handleSubmit = async () => {
	if (!formRef.value) return
	const valid = await formRef.value.validate().catch(() => false)
	if (!valid) return
	emit("submit", { ...form.value })
}

const handleClose = () => {
	form.value = { oldPassword: "", newPassword: "", confirmPassword: "" }
	formRef.value?.clearValidate()
	emit("update:modelValue", false)
}

watch(visible, (val) => {
	if (!val) {
		handleClose()
	}
})
</script>
