import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import json from 'rollup-plugin-json'
import { terser } from 'rollup-plugin-terser'

export default {
  external: [
    'util',
    'punycode',
    'http',
    'url',
    'https',
    'stream',
    'zlib',
    'crypto',
    'querystring',
    'fs',
    'net',
    'tls',
    'buffer',
    'path',
    'events',
    'assert'
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs({ }),
    json({ }),
    terser({ mangle: false, keep_fnames: true, keep_classnames: true })
  ]
}
