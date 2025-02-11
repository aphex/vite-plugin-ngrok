import type { Plugin } from 'vite'
import pc from 'picocolors'
import _ngrok, { type Listener, type Config } from '@ngrok/ngrok'

/**
 * Vite ngrok plugin allowing you to expose your local server to the internet.
 */
export const ngrok = (options?: Config | string) =>
  ({
    name: 'ngrok',
    configureServer({ config, httpServer }) {
      let listener: Listener
      httpServer?.on('listening', async () => {
        const address = httpServer.address()
        if (listener || !address || typeof address === 'string') return

        listener = await _ngrok.forward({
          addr: address.port,
          ...(typeof options === 'string'
            ? { authtoken: options }
            : !options
              ? { authtoken_from_env: true }
              : options),
        })

        const url = listener.url()
        if (!url) return

        if (Array.isArray(config.server.allowedHosts)) {
          config.server.allowedHosts.push(new URL(url).hostname)
        }

        config.logger.info(pc.magenta('  ➜') + pc.magenta('  ngrok:   ') + pc.cyan(url))
      })

      // Clean up ngrok when the server closes
      httpServer?.on('close', async () => listener?.close())
    },
  }) satisfies Plugin
