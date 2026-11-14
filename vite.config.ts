import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// `npm run dev:https` serves over a self-signed certificate. Phones need HTTPS
// for WebXR and camera access when the site is opened by LAN address.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'https' ? [basicSsl()] : [])],
  server: { host: true, port: 5183, strictPort: true },
  preview: { host: true, port: 5183 },
}))
