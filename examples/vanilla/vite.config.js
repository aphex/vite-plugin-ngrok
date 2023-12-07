import { loadEnv } from 'vite'
import { ngrok } from 'vite-plugin-ngrok'
const { NGROK_AUTH_TOKEN } = loadEnv('', process.cwd(), 'NGROK')

/**
 * @type {import('vite').UserConfig}
 */
export default {
  plugins: [
    ngrok({
      authtoken: NGROK_AUTH_TOKEN,
    }),
  ],
}
