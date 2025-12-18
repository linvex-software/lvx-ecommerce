import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  bundle: true,
  dts: false,
  splitting: false,
  minify: false,
  outExtension({ format }) {
    return {
      js: `.js`,
    }
  },
  noExternal: [/^@white-label\//],
  esbuildOptions(options) {
    options.platform = 'node'
  },
})

