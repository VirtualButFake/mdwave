<script setup lang="ts">
	import { useData } from "vitepress";
	import HomeButton from "./HomeButton.vue";
	import Feature from "./Feature.vue";

	const { frontmatter } = useData();
</script>

<template>
	<section class="flex flex-col items-center justify-center px-8 pt-32">
		<div
			class="flex h-[calc(50vh-var(--vp-nav-height)*2)] flex-col items-center justify-center pt-[10vh]"
		>
			<h1
				class="leading-2 mb-4 mt-2 bg-clip-text text-5xl font-semibold tracking-tight text-slate-800 dark:text-slate-200 md:leading-8"
			>
				{{ frontmatter.title }}
			</h1>
			<p
				class="mb-4 mt-2 text-lg leading-4 text-[color:var(--vt-c-text-2)] text-slate-600 dark:text-slate-400 md:text-2xl"
			>
				{{ frontmatter.description }}
			</p>
			<div class="py-1 text-center">
				<HomeButton
					v-for="action in frontmatter.actions"
					:class="action.class"
					:href="action.href"
				>
					{{ action.text }}
					<p class="relative inline" v-if="action.content != undefined" v-html="action.content" />
				</HomeButton>
			</div>
		</div>
		<section
			class="pb-18 -mb-50 mt-60 flex max-w-[972px] flex-col justify-between px-8 md:flex-row md:flex-wrap"
		>
			<Feature
				v-for="feature in frontmatter.features"
				:title="feature.title"
				:href="feature.link"
				:details="feature.details"
			/>
		</section>
	</section>
</template>
