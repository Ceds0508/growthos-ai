import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em desenvolvimento, o Vite roda na porta 5173 e o backend na 3000.
// O proxy abaixo faz o navegador enxergar /api como se fosse o mesmo
// servidor, evitando problemas de CORS durante o `npm run dev`.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
