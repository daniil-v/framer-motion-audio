import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['dist', '.vite', 'node_modules'],
  },
  // Config for TypeScript/React files
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        // Web Audio API globals
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        // DOM globals
        HTMLElement: 'readonly',
        HTMLAudioElement: 'readonly',
        HTMLDivElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        // Web Audio API interfaces
        AnalyserNode: 'readonly',
        MediaElementAudioSourceNode: 'readonly',
        MediaStreamAudioSourceNode: 'readonly',
        GainNode: 'readonly',
        AudioNode: 'readonly',
        AudioBuffer: 'readonly',
        MediaStream: 'readonly',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      // Allow explicit any in some cases (can be tightened later)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable no-undef for TypeScript files since TypeScript handles this
      'no-undef': 'off',
    },
  },
  // Config for JavaScript config files
  {
    files: ['*.js', '*.ts', '*.mjs', '*.cjs'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Node.js globals for config files
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...js.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off',
    },
  },
];
