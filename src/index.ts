import { type PluginOption, type ResolvedConfig } from 'vite'
import { resolve } from 'node:path'
import { Context } from "./context"

export function createComponentPlugin():PluginOption {
  const ctx = new Context({})

  return {
    name: 'components-plugin',
    enforce: 'post',
    configResolved(config: ResolvedConfig) {
      ctx.setRoot(config.root)
      ctx.searchComponents()
    },
    transform(code: string, id: string) {
      return ctx.transform(code, id)
    }
  }
}
