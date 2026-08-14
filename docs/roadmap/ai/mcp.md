# MCP (Model Context Protocol)

## Estado

🔴 Pendiente

---

## Prioridad

⭐⭐⭐⭐

---

## Nivel actual

Nada

---

## Nivel objetivo

Básico

---

## Complejidad

Alta

---

## Tiempo estimado

2 semanas

---

## ¿Qué es?

Protocolo estándar para conectar LLMs con herramientas y datos externos. Permite que un modelo de lenguaje acceda a bases de datos, APIs, archivos, etc. de forma segura y estandarizada.

---

## ¿Por qué aprenderlo?

- Tecnología emergente con mucho potencial
- Jarvis es un asistente de IA, MCP es la forma de conectarlo con datos externos
- Permite que Jarvis acceda a recetas, preferencias, etc. de forma estructurada
- Cada vez más empresas lo adoptan
- Diferenciador profesional (pocos desarrolladores lo dominan)

---

## ¿Cuándo implementarlo?

Cuando Jarvis necesite:
- Conectar con APIs externas de recetas
- Acceder a base de datos de ingredientes
- Integrar con herramientas externas (calendar, shopping lists)
- Crear agentes que ejecuten acciones

---

## Prerrequisitos

- LLMs (OpenAI, Anthropic)
- APIs REST
- TypeScript

---

## Casos de uso en Jarvis

- Conectar Jarvis con APIs de recetas (Spoonacular, Edamam)
- Acceder a la base de datos de recetas propias
- Generar listas de compras
- Integrar con calendario de comidas
- Crear agente que sugiera recetas basado en ingredientes disponibles

---

## Dependencias

- LLM API (OpenAI o Anthropic)
- Backend NestJS

---

## Coste

✅ Gratuito (protocolo open source)

---

## Desarrollo local

```bash
# Crear servidor MCP
npx @modelcontextprotocol/create-server my-server
```

---

## Cuenta necesaria

Sí, cuenta de OpenAI o Anthropic para usar LLMs.

---

## Demanda en ofertas laborales

⭐⭐⭐ Media (creciente rápidamente)

---

## Objetivo de aprendizaje

- Entender la arquitectura MCP (host, client, server)
- Crear un servidor MCP básico
- Definir tools y resources
- Conectar un servidor MCP con un LLM
- Implementar seguridad (autenticación, rate limiting)

---

## Recursos oficiales

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [MCP Servers](https://github.com/modelcontextprotocol/servers)

---

## Estado en Jarvis

❌ No implementado
