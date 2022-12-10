import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'
import { resolve } from "node:path"
import { matchGlobs } from "../src/utils"
import {URL, pathToFileURL, fileURLToPath} from "node:url"
import chokidar from "chokidar"

const root = resolve(__dirname, '../examples/vue3/')

describe('search', () => {
  it('should work', async () => {
    const ctx = new Context()
    ctx.setRoot(root)
    ctx.searchComponents()

    expect(ctx.componentNameMap).toMatchSnapshot()
  })

  it('match Glob to be true', function () {
    const ctx = new Context()
    const addFilePath = `${ctx.root}/src/components/Foo.vue`
    ctx.setRoot(root)
    chokidar.watch(root + '/src/components').on('add', (filePath) => {
      ctx.searchComponents()
      expect(ctx.componentNameMap).toMatchSnapshot()
    })
    expect(matchGlobs(addFilePath, ctx.options.dirs.map(path => fileURLToPath(new URL(path, pathToFileURL(ctx.root).href + '/').href)))).toBe(true)
  });
})
