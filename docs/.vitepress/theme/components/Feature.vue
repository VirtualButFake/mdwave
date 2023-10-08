<template>
	<a
		class="flex-[0_32%] rounded-md px-4 py-3 text-sm font-semibold"
		:href="props.href"
	>
		<h2 class="text-lg font-semibold text-slate-800 dark:text-slate-200">
			{{ props.title }}
		</h2>
		<p class="text-slate-500 dark:text-slate-400" v-html="props.details" />
	</a>
</template>

<script setup>
	const props = defineProps({
		href: String,
		title: String,
		details: String,
	});
</script>
