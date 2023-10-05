<script setup>
	import Link from "./Link.vue";
	import CustomCodeBlock from "./CustomCodeBlock.vue";

	const props = defineProps({
		tokenMap: Object,
	});

	const DEPTH_CLASSES = [
		"text-syntax-depth1-light dark:text-syntax-depth1-dark",
		"text-syntax-depth2-light dark:text-syntax-depth2-dark",
		"text-syntax-depth3-light dark:text-syntax-depth3-dark",
	];

	const DEPTH_OFFSETS = [
		"ml-[0rem]",
		"ml-[1rem]",
		"ml-[2rem]",
		"ml-[3rem]",
		"ml-[4rem]",
		"ml-[5rem]",
		"ml-[6rem]",
		"ml-[7rem]",
		"ml-[8rem]",
		"ml-[9rem]",
		"ml-[10rem]", // if you manage to go past 11, you're insane
	];
</script>
<template>
	<CustomCodeBlock>
		<code>
			<span :class="'line block ' + ``" v-for="line in props.tokenMap">
				<span>{{ " ".repeat(line.depth * 4) }}</span>
				<span v-for="token in line.tokens">
					<Link v-if="token.type === 'link'" :href="token.href">{{
						token.text
					}}</Link>
					<span v-else-if="token.type === 'description'" class="text-syntax-desc-light dark:text-syntax-desc-dark text-xs font-sans">&nbsp-- {{ token.text }}</span>
					<span
						v-else
						:class="
							token.color ||
							DEPTH_CLASSES[
								(token.depth - 1) % DEPTH_CLASSES.length
							]
						"
						>{{ token.text }}</span
					>
				</span>
			</span>
		</code>
	</CustomCodeBlock>
</template>
