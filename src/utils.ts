import fg from "fast-glob";
import { parse } from 'path'
import { type ResolveOptions, type Options } from "./context"

type Nullable<T> = T | null | undefined
type Arrayable<T> = T | Array<T>

export function toArray<T>(array?: Nullable<Arrayable<T>>): Array<T> {
  array = array ?? []
  return Array.isArray(array) ? array : [array]
}

export function slash(str: string) {
  return str.replace(/\\/g, '/')
}

export function isEmpty(value: any) {
  if (!value || value === null || value === undefined || (Array.isArray(value) && Object.keys(value).length <= 0))
    return true
  else
    return false
}

export function getNameFromFilePath(filePath: string, options: ResolveOptions): string {
  const { resolvedDirs, directoryAsNamespace, globalNamespaces, collapseSamePrefixes, root } = options
  const parsedFilePath = parse(slash(filePath))
  let strippedPath = ''
  // remove include directories from filepath
  for (const dir of resolvedDirs) {
    if (parsedFilePath.dir.startsWith(dir)) {
      strippedPath = parsedFilePath.dir.slice(dir.length)
      break
    }
  }
  let folders = strippedPath.slice(1).split('/').filter(Boolean)
  let filename = parsedFilePath.name
  // set parent directory as filename if it is index
  if (filename === 'index' && !directoryAsNamespace) {
    // when use `globs` option, `resolvedDirs` will always empty, and `folders` will also empty
    if (isEmpty(folders))
      folders = parsedFilePath.dir.slice(root.length + 1).split('/').filter(Boolean)
    filename = `${folders.slice(-1)[0]}`
    return filename
  }
  if (directoryAsNamespace) {
    // remove namesspaces from folder names
    if (globalNamespaces.some((name: string) => folders.includes(name)))
      folders = folders.filter(f => !globalNamespaces.includes(f))
    folders = folders.map(f => f.replace(/[^a-zA-Z0-9\-]/g, ''))
    if (filename.toLowerCase() === 'index')
      filename = ''
    if (!isEmpty(folders)) {
      // add folders to filename
      let namespaced = [...folders, filename]
      if (collapseSamePrefixes) {
        const collapsed: string[] = []
        for (const fileOrFolderName of namespaced) {
          const collapsedFilename = collapsed.join('')
          if (collapsedFilename && fileOrFolderName.toLowerCase().startsWith(collapsedFilename.toLowerCase())) {
            const collapseSamePrefix = fileOrFolderName.slice(collapsedFilename.length)
            collapsed.push(collapseSamePrefix)
            continue
          }
          collapsed.push(fileOrFolderName)
        }
        namespaced = collapsed
      }
      filename = namespaced.filter(Boolean).join('-')
    }
    return filename
  }
  return filename
}

export function pascalCase(str: string) {
  return capitalize(camelCase(str))
}

export function camelCase(str: string) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

export function kebabCase(key: string) {
  const result = key.replace(/([A-Z])/g, ' $1').trim()
  return result.split(' ').join('-').toLowerCase()
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function parseId(id: string) {
  const index = id.indexOf('?')
  if (index < 0) {
    return { path: id, query: {} }
  }
  else {
    const query = Object.fromEntries(new URLSearchParams(id.slice(index)) as any)
    return {
      path: id.slice(0, index),
      query,
    }
  }
}

export function stringifyComponentImport({ as: name, from: path, name: importName, sideEffects }, ctx) {
  path = getTransformedPath(path, ctx.options.importPathTransform)

  const imports = [
    stringifyImport({ as: name, from: path, name: importName }),
  ]

  if (sideEffects)
    toArray(sideEffects).forEach(i => imports.push(stringifyImport(i)))

  return imports.join(';')
}

export function getTransformedPath(path: string, importPathTransform?: Options['importPathTransform']): string {
  if (importPathTransform) {
    const result = importPathTransform(path)
    if (result != null)
      path = result
  }
  return path
}

export function stringifyImport(info) {
  if (typeof info === 'string')
    return `import '${info}'`
  if (!info.as)
    return `import '${info.from}'`
  else if (info.name)
    return `import { ${info.name} as ${info.as} } from '${info.from}'`
  else
    return `import ${info.as} from '${info.from}'`
}
