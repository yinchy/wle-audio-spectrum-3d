import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts',
    output: {
        file: 'js/bundle.js',
        format: 'es',
        sourcemap: true,
    },
    plugins: [
        resolve(),
        typescript({ tsconfig: './tsconfig.json' }),
    ],
};
