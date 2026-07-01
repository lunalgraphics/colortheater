import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env variables re[gardless of prefix (3rd arg '')
  const env = loadEnv(mode, process.cwd(), '');
  
  // Set output directory based on env var, fallback to 'dist'
  let outDir = 'dist';
  if (env.VITE_PLATFORM === 'electron') {
      outDir = 'electron-app/app';
  }

  return {
    plugins: [svelte()],
    base: "./",
    build: { outDir },
  }
})
