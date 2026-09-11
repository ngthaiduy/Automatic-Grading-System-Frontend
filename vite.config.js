import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/

export default ({ mode }) => {
  // Đỏ nhưng mà xài được, để tải biến môi trường
  const loadedEnv = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    define: {
      // Biến môi trường cho url backend
      __BASE_URL__: JSON.stringify(loadedEnv.VITE_API_BASE_URL),
    },
    plugins: [react()],
  });
};

// export default defineConfig({
//   define: {
//   },
//   plugins: [react()],
// });
