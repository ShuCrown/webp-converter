import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://192.168.110.37:4000",
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
      domains: ["192.168.110.37"],
      /** custom certification directory */
      certDir: "../cert.pem",
    }),
  ],
});
