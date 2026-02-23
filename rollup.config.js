import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';

export default defineConfig([
  {
    external: [
      'node:events',
      'node:fs',
      'node:fs/promises',
      'node:module',
      'node:os',
      'node:path',
      'node:url',
    ],
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.build.json',
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [
      dts({
        tsconfig: './tsconfig.build.json',
      }),
    ],
  },
]);
