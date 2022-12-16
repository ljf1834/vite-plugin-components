import type { Plugin, ResolvedConfig } from 'vite'
import { resolve } from 'node:path'
import { Context } from "./context"
import type { Options } from "./types"

export function createComponentPlugin(options?: Options):Plugin {
  const ctx = new Context(options = {})

  return {
    name: 'vite-plugin-components',
    enforce: 'post',
    configResolved(config: ResolvedConfig) {
      ctx.setRoot(config.root)
      ctx.searchComponents()
    },
    configureServer(server) {
      ctx.setServer(server)
    },
    transform(code: string, id: string) {
      return ctx.transform(code, id)
    }
  }
}
