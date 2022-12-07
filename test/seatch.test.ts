import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'
import { resolve } from "node:path"

const root = resolve(__dirname, '../examples/vue3')

describe('search', () => {
  it('should work', async () => {
    const ctx = new Context({})
    ctx.setRoot(root)
    ctx.searchComponents()

    expect(ctx.componentNameMap).toMatchSnapshot()
  })
})
