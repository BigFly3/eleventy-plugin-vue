export default {
  input: "main.js",
  output: {
    file: "dist/main.cjs",
    format: "cjs",
    exports: "named",
    sourcemap: true,
  },
  external: [
    "@vitejs/plugin-vue",
    "@rollup/plugin-alias",
    "module-from-string",
    "rollup",
    "rollup-plugin-css-only",
    "vue",
    "vue/server-renderer",
    /^node:/,
  ],
};
