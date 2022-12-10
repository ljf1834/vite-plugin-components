import { type Plugin, type ResolvedConfig } from 'vite'
import { resolve } from 'node:path'
import { Context, type Options  } from "./context"

export function createComponentPlugin(options?: Options):Plugin {
  const ctx = new Context(options = {})

  return {
    name: 'components-plugin',
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
