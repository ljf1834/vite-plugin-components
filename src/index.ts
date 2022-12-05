import { type PluginOption, type ResolvedConfig } from 'vite'
import { resolve } from 'node:path'
import fg from 'fast-glob'

export function createComponentPlugin():PluginOption {
  let root = process.cwd()
  const dirs = 'src/components'
  const componentsMap = {}
  function findComponents(){
    const paths = fg.sync(resolveGlob(), { cwd: root })
    console.log(paths)
  }
  function resolveGlob():(string)[] {
    return [dirs + '/**/*.vue']
  }

  return {
    name: 'component-plugin',
    configResolved(config: ResolvedConfig) {
      root = config.root
      findComponents()
      console.log('---', root)
    },
    transform: (code, id) => {

    }
  }
}
