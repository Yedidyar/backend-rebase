import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Backend Rebase Documentation",
  description:
    "Technical documentation for the Backend Rebase project - a comprehensive backend rebase project",
  base: "/backend-rebase/",
  themeConfig: {
    nav: [{ text: "Home", link: "/" }],

    sidebar: [
      {
        text: "Project Overview",
        items: [{ text: "Introduction", link: "/README" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/yedidyar/backend-rebase" },
    ],
  },

  ignoreDeadLinks: [(url) => url.includes("http://localhost")],
});
