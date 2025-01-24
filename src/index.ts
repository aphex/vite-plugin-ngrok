import type { Plugin } from 'vite'
import pc from 'picocolors'
import _ngrok, { type Listener, type Config } from '@ngrok/ngrok'

/**
 * Vite ngrok plugin allowing you to expose your local server to the internet.
 */
export const ngrok = (config?: Config | string) =>
  ({
    name: 'ngrok',
    configureServer(server) {
      const {
        httpServer,
        config: {
          server: { allowedHosts },
        },
      } = server

      if (allowedHosts !== true) {
        const domain = typeof config === 'string' ? undefined : config?.domain
        const hosts = domain
          ? [domain]
          : allowedHosts.find((h) => h.includes('.ngrok'))
            ? []
            : ['.ngrok.io', '.ngrok.app', '.ngrok.dev', '.ngrok-free.app', '.ngrok-free.dev']

        allowedHosts.push(...hosts)
      }

      let listener: Listener
      httpServer?.on('listening', async () => {
        const address = httpServer.address()
        if (listener || !address || typeof address === 'string') return

        listener = await _ngrok.forward({
          addr: address.port,
          ...(typeof config === 'string'
            ? { authtoken: config }
            : !config
              ? { authtoken_from_env: true }
              : config),
        })

        server.config.logger.info(
          pc.magenta('  ➜') + pc.magenta('  ngrok: ') + pc.cyan(listener.url()),
        )
      })

      // Clean up ngrok when the server closes
      httpServer?.on('close', async () => listener?.close())
    },
  }) satisfies Plugin
