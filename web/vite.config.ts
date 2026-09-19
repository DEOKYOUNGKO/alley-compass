import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Supabase Redirect URLs · Google/카카오 콘솔에 등록한 주소가 localhost:5173 이다.
    // 다른 포트로 슬쩍 넘어가면 소셜 로그인 후 돌아올 곳이 어긋나므로, 사용 중이면
    // 조용히 5174 로 가지 말고 오류로 알린다.
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
