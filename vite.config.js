import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import babel from 'vite-plugin-babel';
import micromatch from 'micromatch';

export default defineConfig({
  plugins: [
    react(),
    babel({
      babelConfig: {
        presets: ['@babel/preset-react'], // 👈 Enables JSX support
        plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]], // 👈 Removes console.log
      },
      filter: (id) =>
        micromatch.isMatch(id, '**/*.{js,jsx,ts,tsx}') &&
        !micromatch.isMatch(id, 'node_modules/**'),
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
