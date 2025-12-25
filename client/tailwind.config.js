/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  safelist: [
    // 动态赛道颜色类 - 背景色
    {
      pattern: /bg-(orange|purple|blue|green|red|pink|yellow|indigo|gray)-(50|100|500|600|900)/,
      variants: [],
    },
    // 带透明度的背景色
    {
      pattern: /bg-(orange|purple|blue|green|red|pink|yellow|indigo|gray)-500\/(10|20|30)/,
    },
    {
      pattern: /bg-(orange|purple|blue|green|red|pink|yellow|indigo|gray)-900\/10/,
    },
    // 文字颜色
    {
      pattern: /text-(orange|purple|blue|green|red|pink|yellow|indigo|gray)-(300|400|500|600|700)/,
    },
    // 边框颜色
    {
      pattern: /border-(orange|purple|blue|green|red|pink|yellow|indigo|gray)-500\/30/,
    },
    // 渐变类
    {
      pattern: /from-(orange|purple|blue|green|red|pink|yellow|indigo|gray)-500\/20/,
    },
    {
      pattern: /to-(orange|purple|blue|green|red|pink|yellow|indigo|gray)-900\/10/,
    },
    // 阴影类
    {
      pattern: /shadow-(orange|purple|blue|green|red|pink|yellow|indigo|gray)-500\/30/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
