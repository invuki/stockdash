import type { IncomingMessage } from 'node:http'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

interface LocalApiResponse {
  setHeader(name: string, value: string): void
  status(code: number): LocalApiResponse
  json(body: unknown): LocalApiResponse
}

interface LocalAlpacaEnvironment {
  ALPACA_API_KEY?: string
  ALPACA_API_SECRET?: string
}

function localQuotesApi(environment: LocalAlpacaEnvironment): Plugin {
  return {
    name: 'local-quotes-api',
    configureServer(server) {
      server.middlewares.use('/api/quotes', (request, response, next) => {
        const requestLike: Pick<IncomingMessage, 'method'> = request
        const apiResponse: LocalApiResponse = {
          setHeader: (name, value) => response.setHeader(name, value),
          status(code) {
            response.statusCode = code
            return apiResponse
          },
          json(body) {
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.end(JSON.stringify(body))
            return apiResponse
          },
        }

        void server.ssrLoadModule('/api/quotes.ts')
          .then((module) => module.default(requestLike, apiResponse, environment))
          .catch((error: unknown) => {
            next(error instanceof Error ? error : new Error('Local quotes API failed.'))
          })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const alpacaEnvironment: LocalAlpacaEnvironment = {
    ALPACA_API_KEY: env.ALPACA_API_KEY,
    ALPACA_API_SECRET: env.ALPACA_API_SECRET,
  }

  return {
    plugins: [react(), localQuotesApi(alpacaEnvironment)],
  }
})
