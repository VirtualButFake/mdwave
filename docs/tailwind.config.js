const colors = require("tailwindcss/colors");

module.exports = {
	darkMode: "class",
	content: [
		"./dist/**/*.{html,js,vue,ts,md}",
		"./.vitepress/**/*.{html,js,vue,ts,md}",
		"./src/**/*.md"
	],
	important: true,
	theme: {
		colors: {
			current: "currentColor",
			slate: colors.slate,
			indigo: colors.indigo,
			blue: colors.blue,
			gray: colors.gray,
			zinc: colors.zinc,
			red: colors.red,
			yellow: colors.yellow,
			green: colors.green,
			cyan: colors.cyan,
			orange: colors.orange,
			amber: colors.amber,
			syntax: {
				identifier: {
					dark: "#F97583",
					light: "#D73A49"
				},
				number: {
					dark: "#79B8FF",
					light: "#032F62"
				},
				default: {
					dark: "#f7c874",
					light: "#005CC5"
				},
				punc: {
					dark: "#E1E4E8",
					light: "#272829"
				},
				desc: {
					dark: "#828181",
					light: "#636262"
				},
				depth1: {
					dark: "#f2904e",
					light: "#0431FA"
				},
				depth2: {
					dark: "#C678DD",
					light: "#319337"
				},
				depth3:{
					dark: "#56B6C2",
					light: "#7B3814x	"
				}
			},
		},
	},
};
