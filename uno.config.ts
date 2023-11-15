// uno.config.ts
import {
	defineConfig,
	presetAttributify,
	presetIcons,
	presetUno,
} from "unocss";

export default defineConfig({
	shortcuts: {
		"shadow-around": "shadow-[0px_2px_10px_0px_rgba(0,0,0,0.1)]",
		"border-base": "border-gray-500 border-op-20",
		"text-base": "text-gray-700 dark:text-gray-200",
		"bg-base": "bg-back dark:bg-back-dark",
	},
	theme: {
		colors: {
			primary: {
				DEFAULT: "#8742E0",
				deep: "#5E1EA9",
				dark: "#4C0D6D",
			},
			secondary: {
				DEFAULT: "#EADCF8",
				dark: "#D4BFF0",
			},
			card: {
				DEFAULT: "#FFFFFF",
				dark: "#161B22",
			},
			back: {
				DEFAULT: "#FFFFFF",
				dark: "#121212",
			},
			border: {
				DEFAULT: "#E8EAED",
				dark: "#30363D",
			},
			inputBack: "#E8EAED",
			warning: {
				DEFAULT: "#F2A324",
			},
			iconBtnBack: "#CFE4FE",
			text: {
				DEFAULT: "#FFFFFF",
				secondary: "#767676",
				dark: "#1A202C",
			},
		},
	},
	presets: [
		presetUno(),
		presetAttributify(),
		presetIcons({
			scale: 1.2,
			warn: true,
		}),
	],
});
