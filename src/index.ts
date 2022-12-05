import { type PluginOption, type ResolvedConfig } from 'vite'
import { resolve } from 'node:path'
import fg from 'fast-glob'

export function createComponentPlugin():PluginOption {
  let root = process.cwd()
  const dirs = 'src/components'
  const componentsMap = {}
  function findComponents(glob:(string)[]){
    const paths = fg.sync(glob, { cwd: root })
    console.log(paths)
  }
  function resolveGlob() {

  }

  return {
    name: 'component-plugin',
    configResolved(config: ResolvedConfig) {
      root = config.root
      findComponents([dirs])
      console.log('---', root)
    },
    transform: (code, id) => {

    }
  }
}
