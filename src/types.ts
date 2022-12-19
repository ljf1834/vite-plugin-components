import type { FilterPattern } from "vite"

export type SupportedTransformer = 'vue3' | 'vue2'
export interface Options {
  /**
   * RegExp or glob to match files to be transformed
   */
  include?: FilterPattern

  /**
   * RegExp or glob to match files to NOT be transformed
   */
  exclude?: FilterPattern
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

  /**
   * Transformer to apply
   *
   * @default 'vue3'
   */
  transformer?: SupportedTransformer
  /**
   * Generate TypeScript declaration for global components
   *
   * Accept boolean or a path related to project root
   *
   * @see https://github.com/vuejs/core/pull/3399
   * @see https://github.com/johnsoncodehk/volar#using
   * @default true
   */
  dts?: boolean | string
}
export type ResolveOptions = Omit<Options, 'extensions' | 'dirs'>  & {
  extensions: string[]
  dirs: string[]
  resolvedDirs: string[]
  dts?: string | false
  root: string
  globs: string[]
}
export type ResolveResult = {
  rawName: string
  replace: (resolved: string) => void
}
export type Nullable<T> = T | null | undefined
export type Arrayable<T> = T | Array<T>
