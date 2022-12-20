import { getNameFromFilePath, parseId, pascalCase, slash, stringifyComponentImport, toArray, matchGlobs, transformVue2, transformVue3 } from "./utils"
import { resolve } from "node:path"
import fg from 'fast-glob'
import MagicString from 'magic-string'
import { ViteDevServer } from "vite"
import { fileURLToPath, pathToFileURL, URL } from "node:url"
import type { Options, ResolveOptions, ResolveResult } from "./types"

const defaultOptions:Options = {
  dirs: 'src/components',
  extensions: 'vue',
  deep: true,
  transformer: 'vue3',
  importPathTransform: v => v
}

export class Context{
  root = process.cwd()
  alias: Record<string, string>
  options: ResolveOptions
  private _globs:string[] = []
  private _componentPaths: Set<string> = new Set()
  private _componentNamesMap = {}
  constructor(private rawOptions: Options = {}) {
    this.options = this.resolveOptions(rawOptions, this.root)
    this._globs = this.resolveGlobs(this.options.resolvedDirs)
  }
  setRoot(root: string) {
    this.root = root
    this.options = this.resolveOptions(this.rawOptions, this.root)
    this._globs = this.resolveGlobs(this.options.dirs)
  }
  private _server:ViteDevServer | undefined
  setServer(server: ViteDevServer) {
    this._server = server
    this._server.watcher.on('add', (filePath) => {
      if (!matchGlobs(filePath, this.options.dirs.map(path => fileURLToPath(new URL(path, pathToFileURL(this.root).toString() + '/').href)))) return
      this.searchComponents()
      this.generateDeclarant()
    })
    this._server.watcher.on('unlink', (filePath) => {
      if (!matchGlobs(filePath, this.options.dirs.map(path => fileURLToPath(new URL(path, pathToFileURL(this.root).toString() + '/').href)))) return
      this.searchComponents()
      this.generateDeclarant()
    })
  }
  resolveOptions(rawOptions: Options, root):ResolveOptions {
    const resolveOptions = Object.assign(Object.create(null), defaultOptions, rawOptions) as ResolveOptions
    resolveOptions.extensions = toArray(resolveOptions.extensions)
    resolveOptions.dirs = toArray(resolveOptions.dirs)
    resolveOptions.resolvedDirs = resolveOptions.dirs.map(u => slash(resolve(root, u)))
    resolveOptions.root = root
    resolveOptions.dts = !rawOptions.dts ? false : resolve(
      root,
      typeof rawOptions.dts === 'string'
        ? rawOptions.dts
        : 'components.d.ts',
    )
    return resolveOptions
  }
  resolveGlobs(dirs:string[]) {
    if (this.options.globs) {
      return toArray(this.options.globs).map((glob: string) => slash(resolve(this.options.root, glob)))
    } else {
      const extsGlob = this.options.extensions.length==1 ? this.options.extensions[0] : `{${(this.options.extensions as string[]).join(',')}}`
      return dirs.map((dir: string) => this.options.deep ? slash(`./${dir}/**/*.${extsGlob}`) : slash(`./${dir}/*.${extsGlob}`))
      if (!this.options.extensions.length) throw new Error('[vite-plugin-components] `extensions` option is required to search for components')
    }
  }
  searchComponents() {
    const paths = fg.sync(this._globs, { cwd: this.options.root, ignore: ['node_modules'], onlyFiles: true, absolute: true})
    toArray(paths).forEach(item => this._componentPaths.add(item))
    Array.from(this._componentPaths).forEach((path) => {
      const name = pascalCase(getNameFromFilePath(path, this.options))
      this._componentNamesMap[name] = {
        as: name,
        from: path
      }
    })
  }
  findComponent(name) {
    return this.componentNameMap[name]
  }
  transform(code: string, id: string) {
    let no = 0
    const { path, query } = parseId(id)
    const s = new MagicString(code)
    let results: ResolveResult[] = []
    if (this.options.transformer === 'vue3') {
      results = transformVue3(code, s)
    } else {
      results = transformVue2(code, s)
    }
    for (const { rawName, replace } of results) {
      const name = pascalCase(rawName)
      const component = this.findComponent(name)
      if (component) {
        const varName = `components_${no}`
        s.prepend(`${stringifyComponentImport({ ...component, as: varName }, this)};\n`)
        no += 1
        replace(varName)
      }
    }
    return {
      code: s.toString(),
      map: s.generateMap({ source: id, includeContent: true })
    }
  }
  generateDeclarant() {
    if (!this.options.dts)
      return
    //todo generate dts method
  }
  get componentNameMap() {
    return this._componentNamesMap
  }
  get globs() {
    return this._globs
  }
}
