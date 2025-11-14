import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { config } from "shared-configs";

// https://vite.dev/config/
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
      /** name of certification */
      name: "test",
      /** custom trust domains */
      domains: [config.https.host],
      /** custom certification directory */
      certDir: "./certificates",
    }),
  ],
});
