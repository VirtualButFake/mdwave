import { defineConfig } from "vitepress";
import { fileURLToPath } from "node:url";

export default defineConfig({
	title: "MDWave",
	description: "Documentation for MDWave",
	base: "/mdwave/",
	themeConfig: {
		search: {
			provider: "local",
		},
		nav: [
			{ text: "Home", link: "/" },
			{ text: "Guide", link: "/guide/intro" },
			{ text: "Changelog", link: "/changelog" },
		],
		sidebar: {
			["/guide/"]: [
				{
					text: "Guide",
					link: "/guide/",
					items: [
						{
							text: "Introduction",
							link: "/guide/intro",
						},
						{
							text: "Tags",
							link: "/guide/tags",
						},
						{
							text: "Markdown",
							link: "/guide/markdown",
						},
						{
							text: "Configuration",
							link: "/guide/configuration",
						}
					],
				},
			],
		},
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/VirtualButFake/mdwave",
			},
		],
		footer: {
			message: "MDWave Documentation by VirtualButFake",
		},
	},
	srcDir: "./src",
	outDir: "./dist",
	vite: {
		resolve: {
			alias: [
				{
					find: /^.*\/VPBadge\.vue$/,
					replacement: fileURLToPath(
						new URL("./theme/components/Badge.vue", import.meta.url)
					),
				},
			],
		},
	},
});
