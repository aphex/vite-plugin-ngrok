import type { Plugin } from 'vite'
import pc from 'picocolors'
import _ngrok, { type Listener, type Config } from '@ngrok/ngrok'

/**
 * Vite ngrok plugin allowing you to expose your local server to the internet.
 */
export const ngrok = (options?: Config | string) => {
  let listener: Listener
  let url: string = ''

  return {
    name: 'ngrok',
    apply: (_config, { command, mode }) => command === 'serve' && mode !== 'test',

    async configResolved(config) {
      const port = config.server.port || 5173

      listener = await _ngrok.forward({
        addr: port,
        ...(typeof options === 'string'
          ? { authtoken: options }
          : !options
            ? { authtoken_from_env: true }
            : options),
      })

      url = listener.url() ?? ''
      if (!url) return

      const hostname = new URL(url).hostname

      if (config.server.allowedHosts === true) return

      const hosts = Array.isArray(config.server.allowedHosts) ? config.server.allowedHosts : []
      config.server.allowedHosts = [...hosts, hostname]
    },

    configureServer(server) {
      const { config, printUrls } = server

      if (url) {
        server.printUrls = () => {
          printUrls()
          config.logger.info(`  ${pc.magenta('➜')}  ${pc.magenta('ngrok')}:   ${pc.cyan(url)}`)
        }
      }

      server.httpServer?.on('close', () => listener?.close())
    },
  } satisfies Plugin
}
