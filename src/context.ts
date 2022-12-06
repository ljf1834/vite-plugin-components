import { toArray, slash, getNameFromFilePath } from "./utils"
import { resolve } from "node:path"
import fg from 'fast-glob'


interface Options {
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
}
export type ResolveOptions = Omit<Options, 'extensions' | 'dirs'>  & {
  extensions: string[]
  dirs: string[]
  resolvedDirs: string[]
  dts?: string | false
  root: string
  globs: string[]
}
const defaultOptions = {
  dirs: 'src/components',
  extensions: 'vue',
}

export class Context {
  root = process.cwd()
  alias: Record<string, string> = {}
  options: ResolveOptions
  private _globs:string[] = []
  private _componentPaths: Set<string> = new Set()
  private _componentNames = {}
  constructor(private rawOptions: Options) {
    this.options = this.resolveOptions(rawOptions, this.root)
    this._globs = this.resolveGlobs(this.options.resolvedDirs)
  }
  setRoot(root: string) {
    this.root = root
  }
  resolveOptions(rawOptions: Options, root):ResolveOptions{
    const resolveOptions = Object.assign({}, defaultOptions, rawOptions) as resolveOptions
    resolveOptions.extensions = toArray(this.options.extensions)
    resolveOptions.dirs = toArray(this.options.dirs)
    resolveOptions.resolvedDirs = resolveOptions.dirs.map(u => slash(resolve(root, u)))
    resolveOptions.root = root
    return resolveOptions
  }
  resolveGlobs(dirs:string[]) {
    let globs
    if (this.options.globs) {
      globs = toArray(this.options.globs).map((glob: string) => slash(resolve(this.options.root, glob)))
    } else {
      const extsGlob = `{${(this.options.extensions as string[]).join(',')}}`
      globs = dirs.map((dir: string) => this.options.deep ? slash(`${dir}**/*.${extsGlob}`) : slash(`${dir}*.${extsGlob}`))
      if (!this.options.extensions.length) throw new Error('[components-plugin] `extensions` option is required to search for components')
    }
    return globs
  }
  findComponents() {
    const paths = fg.sync(this._globs, { cwd: this.options.root })
    toArray(paths).forEach(item => this._componentPaths.add(item))
    Array.from(this._componentPaths).forEach((path) => {
      const name = getNameFromFilePath(path, this.options)
    })
  }
}