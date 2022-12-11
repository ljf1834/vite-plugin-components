import {getNameFromFilePath, parseId, pascalCase, slash, stringifyComponentImport, toArray, matchGlobs} from "./utils"
import {resolve} from "node:path"
import fg from 'fast-glob'
import MagicString from 'magic-string'
import { ViteDevServer } from "vite"
import {fileURLToPath, pathToFileURL, URL} from "node:url"

export interface Options {
  /**
   * Relative paths to the directory to search for components.
   * @default 'src/components'
   */
  dirs?: string | string[]

  /**
   * Valid file extensions for components.
   * @default ['vue']
   */
  extensions?: string | string[]

  /**
   * Glob patterns to match file names to be detected as components.
   *
   * When specified, the `dirs` and `extensions` options will be ignored.
   */
  globs?: string | string[]

  /**
   * Search for subdirectories
   * @default true
   */
  deep?: boolean

  /**
   * Subdirectory paths for ignoring namespace prefixes
   *
   * Works when `directoryAsNamespace: true`
   * @default "[]"
   */
  globalNamespaces?: string[]

  /**
   * Collapse same prefixes (case-insensitive) of folders and components
   * to prevent duplication inside namespaced component name
   *
   * Works when `directoryAsNamespace: true`
   * @default false
   */
  collapseSamePrefixes?: boolean

  /**
   * Allow subdirectories as namespace prefix for components
   * @default false
   */
  directoryAsNamespace?: boolean

  /**
   * Apply custom transform over the path for importing
   */
  importPathTransform?: (path: string) => string | undefined
}
export type ResolveOptions = Omit<Options, 'extensions' | 'dirs'>  & {
  extensions: string[]
  dirs: string[]
  resolvedDirs: string[]
  dts?: string | false
  root: string
  globs: string[]
}
interface ResolveResult {
  rawName: string
  replace: (resolved: string) => void
}
const defaultOptions = {
  dirs: 'src/components',
  extensions: 'vue',
  deep: true,
  importPathTransform: v => v
}

export class Context {
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
  private server:ViteDevServer | undefined
  setServer(server: ViteDevServer) {
    this.server = server
    this.server.watcher.on('add', (filePath) => {
      if (!matchGlobs(filePath, this.options.dirs.map(path => fileURLToPath(new URL(path, pathToFileURL(this.root).toString() + '/').href)))) return
      this.searchComponents()
    })
    this.server.watcher.on('unlink', (filePath) => {
      if (!matchGlobs(filePath, this.options.dirs.map(path => fileURLToPath(new URL(path, pathToFileURL(this.root).toString() + '/').href)))) return
      this.searchComponents()
    })
  }
  resolveOptions(rawOptions: Options, root):ResolveOptions{
    const resolveOptions = Object.assign({}, defaultOptions, rawOptions) as ResolveOptions
    resolveOptions.extensions = toArray(resolveOptions.extensions)
    resolveOptions.dirs = toArray(resolveOptions.dirs)
    resolveOptions.resolvedDirs = resolveOptions.dirs.map(u => slash(resolve(root, u)))
    resolveOptions.root = root
    return resolveOptions
  }
  resolveGlobs(dirs:string[]) {
    if (this.options.globs) {
      return toArray(this.options.globs).map((glob: string) => slash(resolve(this.options.root, glob)))
    } else {
      const extsGlob = this.options.extensions.length==1 ? this.options.extensions[0] : `{${(this.options.extensions as string[]).join(',')}}`
      return dirs.map((dir: string) => this.options.deep ? slash(`./${dir}/**/*.${extsGlob}`) : slash(`./${dir}/*.${extsGlob}`))
      if (!this.options.extensions.length) throw new Error('[components-plugin] `extensions` option is required to search for components')
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
    return this._componentNamesMap[name]
  }
  transform(code: string, id: string) {
    let no = 0
    const { path, query } = parseId(id)
    const s = new MagicString(code)
    const results: ResolveResult[] = []
    for (const match of code.matchAll(/_resolveComponent[0-9]*\("(.+?)"\)/g)) {
      const matchedName = match[1]
      if (match.index != null && matchedName && !matchedName.startsWith('_')) {
        const start = match.index
        const end = start + match[0].length
        results.push({
          rawName: matchedName,
          replace: resolved => s.overwrite(start, end, resolved),
        })
      }
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
  get componentNameMap() {
    return this._componentNamesMap
  }
  get globs() {
    return this._globs
  }
}
