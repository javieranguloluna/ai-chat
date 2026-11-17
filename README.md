# AI Chat — Nx Monorepo Scaffold

Proyecto de **scaffolding**: un monorepo Nx con Angular + NestJS ya integrados y conectados, listo para empezar una app de chat (o cualquier otra) sin repetir el setup inicial.

## Stack

| Pieza         | Versión | Notas                                               |
| ------------- | ------- | --------------------------------------------------- |
| Nx            | 24.0.6  | Monorepo, cache y task pipeline                     |
| Angular       | 22.2    | Frontend standalone + zoneless, SCSS                |
| NestJS        | 11.2    | Backend con prefijo global `/api`                   |
| TypeScript    | ~6.0.3  | Angular 22 exige `>=6.0 <6.1`; **no usar TS 7**     |
| Vercel AI SDK | 7.0     | `ai` + `@ai-sdk/angular` (clase `Chat` con signals) |
| NVIDIA NIM    | —       | Provider de modelos vía `@ai-sdk/openai-compatible` |

Detalles del estudio de compatibilidad que dio forma al setup: [`docs/compatibilidad-monorepo.md`](docs/compatibilidad-monorepo.md).

## Estructura

```
apps/
  frontend/        Angular 22 (serve :4200, proxy /api → :3000)
  backend/         NestJS 11 (serve :3000)
backend-e2e/       Tests e2e del backend (requiere server en :3000)
libs/
  shared/models/   Tipos compartidos (@org/shared/models)
docs/              Estudio de compatibilidad del stack
```

## Empezar

```sh
npm ci
npm run dev          # levanta backend (:3000) y frontend (:4200) en paralelo
```

Configuración del proveedor de modelos (el chat no funciona sin esto):

```sh
cp .env.example .env
# editar .env y completar NIM_API_KEY (clave nvapi-... de https://build.nvidia.com)
```

## Comandos útiles

```sh
npx nx run-many -t build,lint,test --exclude=backend-e2e   # verificación completa
npx nx graph                                               # grafo de dependencias
npx nx g @nx/js:lib libs/mi-lib                            # nueva lib
npx nx g @nx/angular:component apps/frontend/src/...       # componente Angular
```

Al agregar paquetes al workspace, usar las herramientas del package manager (no `tsconfig` paths a mano).

## Arquitectura del chat

```
Angular (Chat de @ai-sdk/angular, signals)
   │  POST /api/chat — UI Messages (protocolo AI SDK) + Bearer token
   ▼
NestJS (streamText + @ai-sdk/openai-compatible)
   │  OpenAI estándar
   ▼
NVIDIA NIM — https://integrate.api.nvidia.com/v1/chat/completions
```

- **Token**: `AuthService` (hardcoded de momento) → `AppChatTransport` lo inyecta en el header `authorization` de cada request; `DevAuthGuard` lo valida en el backend.
- **Variables de inicio**: el componente pasar `userName`/`language` en el body; el backend las integra al system prompt.
- **Nuevo chat**: reemplaza la instancia de `Chat` y arranca la conversación de cero.
- **Streaming**: el backend framea el UI Message Stream a mano (Express no expone fetch `Response`); ver `apps/backend/src/app/chat/chat.controller.ts`.

## Logs (en `logs/`, gitignored)

Todos a archivo, nada a consola:

| Archivo        | Contenido                                                                   |
| -------------- | --------------------------------------------------------------------------- |
| `context.log`  | Ventana de contexto completa enviada al provider (system prompt + mensajes) |
| `backend.log`  | Cada request HTTP que procesa el backend (método, URL, status, duración)    |
| `frontend.log` | Eventos del front: requests/responses del chat y acciones del usuario       |

El front acumula eventos en `LoggingService` y los envía a `POST /api/logs`; el backend los persiste.

## Gotchas descubiertos

- **TS setup clásico por aliases** (no project references): el generador `@nx/angular` no soporta project references. `tsconfig.base.json` sin `lib` explícita (DOM incluido por defecto), sin `composite`.
- **`npm run dev` y locks de Nx**: si `nx serve backend` queda "Waiting for backend:serve:development in another nx process", matar el proceso que retiene el lock antes de relevar.
- **npm 12 bloquea postinstalls** por defecto (aviso `install-scripts`).
- **Modelos de NIM con EOL**: los modelos rotan; con clave inválida, 403 = modelo vivo, 410 = modelo muerto. Verificar el catálogo vigente en [docs de NIM](https://docs.api.nvidia.com/nim/reference/llm-apis).
- **Autotraductor del navegador**: Google Translate corrompe el texto en streaming (mensajes que "aparecen y desaparecen"). `index.html` ya lleva `<meta name="google" content="notranslate" />` — no quitar.
- **Generadores**: `@nx/nest:app` no soporta `--dry-run`.

## Roadmap sugerido (scaffold → producto)

- [ ] Reemplazar auth hardcoded por la real
- [ ] Sesiones/persistencia de conversaciones
- [ ] Selección de modelo y adjuntos (el backend ya habla OpenAI-compatible)
- [ ] Reintroducir CI (con `gh auth refresh -s workflow` si se usa GitHub Actions)
