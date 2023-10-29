<script setup>
	import { useRouter } from "vitepress";
	import { useData } from 'vitepress'
	const router = useRouter();
	const { site } = useData()

	const props = defineProps({
		href: String,
	});

	const isLink = props.href.startsWith("http");

	function navigate() {
		console.log(isLink, props.href)
		if (isLink) {
			return;
		}

		// prepend base url
		router.go(site.value.base + props.href);
	}
</script>

<template>
	<component
		:is="isLink ? 'a' : 'span'"
		:target="isLink ? '_blank' : null"
		class="cursor-pointer text-blue-400 underline transition-colors duration-75 hover:text-blue-500"
		:href="(isLink && props.href) || null"
		@click="navigate"
	>
		<slot></slot>
	</component>
</template>
