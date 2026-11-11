import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// ─────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE VITEST (frontend-jarvis)
// ─────────────────────────────────────────────────────────────────────────
// Vitest es el runner de tests. Usa Vite por debajo, así que reutiliza el
// mismo sistema de módulos, alias y transformación de TS/JSX que el proyecto.
//
// Se usa la extensión .mts para que Vite cargue este archivo como ESM
// (evita el warning de "ESM syntax in a file loaded as CommonJS").
//
// ¿Por qué no Jest? Porque este proyecto es ESM + Next 16 + React 19, y
// Vitest lo soporta de forma nativa sin configuraciones frágiles de Babel.
// ─────────────────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [
    // Transforma JSX/TSX con el runtime automático de React 19.
    react(),
  ],

  resolve: {
    // Vite 8 lee los "paths" del tsconfig.json de forma nativa.
    // Gracias a esto funciona el alias "@/..." en los archivos de test.
    tsconfigPaths: true,
  },

  test: {
    // ─────────────────────────────────────────────────────────────────────
    // ENTORNO
    // ─────────────────────────────────────────────────────────────────────
    // jsdom simula un navegador (document, window, DOM) dentro de Node.
    // Es lo que permite renderizar componentes con React Testing Library.
    environment: 'jsdom',

    // Archivo que se ejecuta ANTES de cada suite. Aquí cargamos los matchers
    // de jest-dom, limpiamos el DOM y definimos polyfills del navegador.
    setupFiles: ['./vitest.setup.ts'],

    // ─────────────────────────────────────────────────────────────────────
    // QUÉ ARCHIVOS SON TESTS
    // ─────────────────────────────────────────────────────────────────────
    // Solo archivos *.test.ts(x) o *.spec.ts(x) dentro del proyecto.
    include: ['**/*.{test,spec}.{ts,tsx}'],

    // Nunca buscar tests dentro de dependencias ni builds.
    exclude: ['node_modules', '.next', 'dist', 'coverage'],

    // ─────────────────────────────────────────────────────────────────────
    // COMPORTAMIENTO
    // ─────────────────────────────────────────────────────────────────────
    // "globals" en false: en cada test importamos describe/it/expect desde
    // "vitest". Es más explícito y evita tocar los tipos de tsconfig.
    globals: false,

    // Limpia los mocks entre tests para que no se filtre estado de uno a otro.
    clearMocks: true,

    // Restaura las implementaciones originales de los spies (vi.spyOn) al
    // terminar cada test. Evita que un mock "contamine" el siguiente.
    restoreMocks: true,

    // ─────────────────────────────────────────────────────────────────────
    // COBERTURA (opcional: `pnpm test:cov`)
    // ─────────────────────────────────────────────────────────────────────
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Medimos el código de la app, no los componentes de UI de shadcn.
      include: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'services/**/*.{ts,tsx}',
        'schemas/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'components/ui/**',
        'app/**/layout.tsx',
      ],
    },
  },
})
