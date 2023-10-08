<template>
	<a
		class="mb-5 inline-block rounded-md px-4 py-2 text-base font-semibold transition-colors duration-150"
		:href="props.href"
	>
		<slot />
	</a>
</template>

<script setup>
	const props = defineProps({
		href: String,
	});
</script>
