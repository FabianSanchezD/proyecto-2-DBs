import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/** Shared flat ESLint config for Node + TypeScript packages and apps. */
export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((block) => ({
    ...block,
    files: ['**/*.{ts,mts,cts}'],
  })),
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
      ecmaVersion: 2022,
    },
  },
];
