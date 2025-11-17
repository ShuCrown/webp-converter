import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { config } from "shared-configs";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: `https://${config.https.host}:${config.https.port}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    basicSsl({
      name: "test",
      domains: [config.https.host],
      certDir: "./certificates",
    }),
  ],
});
