# Estudio de versiones y compatibilidad — Monorepo Nx (Angular + NestJS)

Fecha del estudio: 2026-11-17 · Verificado contra el registry de npm (fuente autoritativa: `peerDependencies` y `engines` publicados por cada paquete).

## 1. Estado del repositorio

- Directorio vacío (proyecto verde, no hay código que migrar).
- Git inicializado en rama `main`, sin commits previos.

## 2. Entorno local disponible

| Herramienta | Versión local | Observación |
|---|---|---|
| Node.js | **v24.22.3** | Cumple `^24.15.0` exigido por Nx 24 |
| npm | 12.2.2 | Válido; pnpm/yarn no instalados |
| corepack | 0.36.0 | Disponible por si se decide usar pnpm |
| git user | jal / javier.angulo.luna@gmail.com | Configurado |

## 3. Versiones actuales (npm `latest`, al 2026-11-17)

| Paquete | `latest` |
|---|---|
| `nx` / `@nx/angular` / `@nx/nest` | **24.0.6** |
| `@angular/core` / `@angular/cli` / `@angular/build` | **22.2.6** / 22.2.7 |
| `@nestjs/core` / `@nestjs/cli` | **12.5.1** / 12.0.13 |
| `typescript` | 7.0.2 (⚠️ NO utilizable, ver §5) |

## 4. Matriz de compatibilidad declarada (peers/engines)

| Paquete | Requisito declarado |
|---|---|
| `nx@24.0.6` | `node ^22.22.3 \|\| ^24.15.0 \|\| >=26` |
| `@nx/angular@24.0.6` | `@angular/*` y `@angular-devkit/*` `>=20.0.0 <23.0.0`, `ng-packagr >=20 <23`, `rxjs ^6.5.3 \|\| ^7.5.0` |
| `@angular/core@22.2.6` | `rxjs ^6.5.3 \|\| ^7.4.0`, `zone.js ~0.15.0 \|\| ~0.16.0`, `@angular/compiler 22.2.6` |
| `@angular/compiler-cli@22.2.6` | **`typescript >=6.0 <6.1`** |
| `@nx/nest@24.0.6` | `@nestjs/core` y `@nestjs/common` **`>=10.0.0 <12.0.0`**, `rxjs ^7.0.0`, `reflect-metadata >=0.1 <0.3` |
| `@nx/nest@24.1.0-beta.1` (`dist-tag next`) | `@nestjs/*` **`>=10.0.0 <13.0.0`** ✅ ya declara Nest 12 |
| `@nestjs/core@12.5.1` | `node >= 20`, `rxjs ^7.1.0`, `reflect-metadata ^0.1.12 \|\| ^0.2.0` |
| `@nestjs/cli@12.0.13` | `typescript ~6.0.2`, `@nestjs/schematics ^12.0.13`, `@angular-devkit/* 22.2.6` |

## 5. Conclusiones y puntos críticos

1. **Node 24.22.3 es compatible** con las tres piezas (Nx 24, Angular 22, Nest 12). ✅
2. **TypeScript debe clavarse en `~6.0.3`**, NO en la última (7.0.2): Angular 22 exige `>=6.0 <6.1` y `@nestjs/cli` 12 usa `~6.0.2`. Coinciden, así que `~6.0.3` satisface a ambos. TS 7 rompería el compilador de Angular.
3. **Único conflicto real: `@nx/nest` estable (24.0.6) declara `<12.0.0`**, es decir, no soporta oficialmente NestJS 12. Dos caminos:
   - **Opción A (estable):** Nx `24.0.6` + NestJS `11.2.10` (dist-tag `legacy`). Cero fricción, todo dentro de rangos declarados. Nest 11 sigue siendo LTS-ish para el ecosistema Nx.
   - **Opción B (bleeding edge):** Nx `24.1.0-beta.1` (tag `next`) + NestJS `12.5.1`. La beta ya declara `<13.0.0`. Riesgo: usar una beta de Nx.
   - Camino híbrido posible: arrancar con Opción A y saltar a Nx 24.1 estable cuando publique (el upgrade es un `nx migrate` trivial).
4. **`rxjs ^7.8.x`** satisface simultáneamente a Angular 22 (`^7.4`), Nest 11/12 (`^7.1`/`^7.1`) y `@nx/nest` (`^7`). Un solo `rxjs` compartido en la raíz.
5. Angular 22 puede ejecutarse **zoneless** (zone.js ya es opcional — peer `~0.15 || ~0.16` solo si se mantiene change detection con zones).
6. `@nestjs/cli@12` depende de `@angular-devkit/* 22.2.6`: Nicaraguas del ecosistema convergen hoy en Angular DevKit 22, señal sana de coexistencia en el mismo workspace.

## 6. Stack recomendado

```
Node 24.22.3 (ya instalado)
npm 12.2.2 como gestor de paquetes del workspace
nx 24.0.6 + @nx/js, @nx/eslint, @nx/angular, @nx/nest
typescript ~6.0.3
rxjs ^7.8

apps/frontend  → Angular 22.2 (standalone, zoneless, @angular/build 22)
apps/backend   → NestJS 11.2.10  (Opción A, estable)
libs/          → librerías compartidas TS puro (modelos, contratos API)
```

## 7. Plan de scaffolding propuesto

1. `npx create-nx-workspace@24.0.6` (npm, workspace integrado, apps/ + libs/, ESLint, Jest o Vitest).
2. Aplicación Angular: `nx g @nx/angular:app frontend --style=scss --zoneless --ssr=false`.
3. API Nest: `nx g @nx/nest:app backend` (generadores de @nx/nest 24 sobre Nest 11). Alias de proxy de dev: `proxies.conf.json` → `/api` al puerto 3000.
4. `nx g @nx/js:lib shared/models` para tipos compartidos FE/BE.
5. Tareas: `nx serve frontend`, `nx serve backend`, `nx build`, `nx affected -t build`.
6. Commit inicial del andamiaje.
