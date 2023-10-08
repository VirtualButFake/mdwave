<script setup>
	const props = defineProps({
		title: String,
		desc: String,
		type: String,
	});
</script>

<template>
	<div class="VPBadge v-raw danger custom-block">
		<p class="custom-block-title text-md font-semibold">
			{{ props.title }}
		</p>
		<p class="text-sm font-normal leading-6 text-zinc-600 dark:text-zinc-300">
			{{ props.desc }}
		</p>
	</div>
</template>
