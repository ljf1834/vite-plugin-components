import type { Plugin, ResolvedConfig } from 'vite'
import { createFilter } from "vite"
import { resolve } from 'node:path'
import { Context } from "./context"
import type { Options } from "./types"

export default function createComponentPlugin(options?: Options):Plugin {
  const ctx = new Context(options = {})
  const filter = createFilter(
    options.include || [/\.vue$/, /\.vue\?vue/, /\.vue\?v=/],
    options.exclude || [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/, /[\\/]\.nuxt[\\/]/],
  )
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
    transformInclude(id) {
      return filter(id)
    },
    transform(code: string, id: string) {
      return ctx.transform(code, id)
    }
  }
}
