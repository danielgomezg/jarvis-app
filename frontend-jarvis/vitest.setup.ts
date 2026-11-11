// ─────────────────────────────────────────────────────────────────────────
// SETUP GLOBAL DE VITEST
// ─────────────────────────────────────────────────────────────────────────
// Este archivo se ejecuta una vez por cada archivo de test, ANTES de los
// tests. Sirve para preparar el entorno (matchers, limpieza y polyfills).
// ─────────────────────────────────────────────────────────────────────────

// 1) Matchers extra de jest-dom: toBeInTheDocument, toHaveTextContent,
//    toBeVisible, toBeDisabled, etc. La ruta "/vitest" registra los tipos
//    y matchers correctos para Vitest.
import '@testing-library/jest-dom/vitest'

// 2) Limpieza automática del DOM entre tests.
//    Sin esto, el HTML renderizado por un test se acumularía en el siguiente.
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// ─────────────────────────────────────────────────────────────────────────
// POLYFILLS DE jsdom
// ─────────────────────────────────────────────────────────────────────────
// jsdom no implementa algunas APIs que usan los componentes de Radix/Base UI
// (popovers, selects, toasts). Los simulamos para que los tests no exploten.
// ─────────────────────────────────────────────────────────────────────────

// matchMedia: usado por componentes que detectan preferencias del sistema
// (ej. tema claro/oscuro).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// ResizeObserver: usado por Popover/Select para posicionarse.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub

// IntersectionObserver: usado por algunos componentes que observan visibilidad.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
  root = null
  rootMargin = ''
  thresholds = []
}
globalThis.IntersectionObserver =
  IntersectionObserverStub as unknown as typeof IntersectionObserver

// scrollTo: jsdom no lo implementa y algunos componentes lo invocan.
window.scrollTo = () => {}
