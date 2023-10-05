import { defineConfig } from "vitepress"
import { fileURLToPath } from "node:url"
import config from "../config.json"
import { DefaultTheme } from "vitepress"

export default defineConfig({
  title: config.title || "moonwave_convert site",
  description: config.vitepress.description,
  base: config.baseUrl,
  themeConfig: {
    nav: config.vitepress.nav,
    sidebar: config.vitepress.sidebar,
    socialLinks: config.vitepress.socialLinks as DefaultTheme.SocialLink[],
    footer: config.vitepress.footer,
  },
  srcDir: "./src",
  outDir: config.outDir || "./dist",
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
})
