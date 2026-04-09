# Agent Context — Guardrails, Exceptions, Anti-Patterns, and Project Plan
## Proyecto: Control de Vacaciones
### Stack definido
- Frontend: Next.js
- Backend: NestJS
- Base de datos: MS SQL Server corriendo en Docker
- Regla obligatoria: toda operación de base de datos debe ejecutarse mediante Stored Procedures. No se permite SQL incrustado en capa lógica.

---

## 1) Contexto general del proyecto

Este proyecto consiste en construir una aplicación sencilla para control de vacaciones de empleados. Debe incluir:
- login y logout
- CRUD de empleados
- filtro por nombre o documento
- listado e inserción de movimientos
- bitácora de eventos
- manejo de errores
- transacciones de base de datos
- validaciones de entrada
- trazabilidad completa

---

## 2) Restricciones críticas que los agentes deben respetar SIEMPRE

### 2.1 Restricciones funcionales y académicas
1. No usar SQL incrustado en NestJS.
2. No usar ORM para consultar o mutar tablas libremente si eso evita Stored Procedures.
3. La capa lógica solo puede invocar Stored Procedures.
4. No usar LINQ ni equivalentes de procesamiento en DB si se estuviera en .NET.
5. No usar cursores.
6. No usar tablas temporales.
7. Los IDs no deben mostrarse al usuario final.
8. La selección de empleados en UI no debe depender de capturar manualmente el ID.
9. El borrado de empleados es lógico, no físico.
10. El saldo de vacaciones no es editable manualmente en update de empleado.
11. El catálogo de errores debe vivir en base de datos.
12. Los mensajes que ve el usuario deben salir del catálogo de errores.
13. La bitácora debe registrar todas las operaciones definidas por el enunciado.
14. El login debe bloquearse temporalmente si se superan los intentos fallidos requeridos.
15. El sistema debe validar que un movimiento no deje saldo negativo.
16. Los datos de prueba deben poder cargarse desde XML.
17. Se debe usar GitHub obligatoriamente.
18. Se debe respetar el estándar de codificación SQL entregado por el curso.

### 2.2 Restricciones de arquitectura
1. Next.js solo consume el API de NestJS.
2. Next.js no se conecta directo a SQL Server.
3. NestJS centraliza auth, validaciones, llamadas a SP y mapeo de errores.
4. SQL Server vive en Docker y debe poder levantarse localmente con configuración reproducible.
5. El proyecto debe funcionar localmente sin depender de infraestructura externa innecesaria.
6. La lógica de negocio sensible debe quedar en Stored Procedures o validarse en backend si es validación de formato/UI, nunca duplicar lógica crítica de forma inconsistente.
7. La trazabilidad debe salir desde backend usando el usuario autenticado y la IP de la request, o desde el SP cuando corresponda.

---

## 3) Cosas que NO se deben hacer

### 3.1 Anti-patrones de base de datos
- NO usar `SELECT *`
- NO omitir el esquema `dbo`
- NO escribir consultas largas en una sola línea
- NO dejar código muerto comentado
- NO usar cursores
- NO usar tablas temporales
- NO iniciar transacción demasiado pronto
- NO mezclar prevalidaciones complejas dentro de una transacción si pueden hacerse antes
- NO dejar parámetros sin prefijos de entrada/salida
- NO devolver mensajes hardcodeados desde SQL cuando existe catálogo de errores
- NO hacer inserts parciales sin listar columnas explícitamente
- NO usar nombres ambiguos en alias o columnas
- NO hacer lógica de negocio dispersa entre controller, service y SQL sin criterio

### 3.2 Anti-patrones en NestJS
- NO poner lógica de negocio en controllers
- NO llamar la BD directamente desde controllers
- NO devolver errores crudos de SQL Server al frontend
- NO hardcodear credenciales de DB
- NO mezclar DTOs de entrada con modelos de respuesta sin separación clara
- NO duplicar validaciones de negocio de forma contradictoria
- NO crear endpoints sin contrato claro
- NO usar nombres genéricos como `data`, `item`, `thing`, `handleEverything`
- NO ignorar el manejo de IP, usuario autenticado y timestamp para bitácora
- NO asumir que un SP siempre devuelve éxito

### 3.3 Anti-patrones en Next.js
- NO conectar el frontend directo a SQL
- NO meter reglas de negocio críticas solo en cliente
- NO mostrar IDs internos en tablas o formularios
- NO permitir editar campos prohibidos como `SaldoVacaciones`
- NO confiar en validación del navegador como única validación
- NO acoplar componentes de UI con llamadas fetch desordenadas
- NO construir una UI demasiado compleja; esto es una tarea académica, la prioridad es cumplir requisitos correctamente

### 3.4 Anti-patrones de proyecto
- NO comenzar por la UI antes de tener DB y SP definidos
- NO improvisar nombres de tablas o SP distintos al dominio del enunciado
- NO dejar documentación para el final
- NO avanzar sin casos de prueba mínimos
- NO romper el estándar SQL del profesor
- NO introducir librerías innecesarias que compliquen la evaluación
- NO asumir que Docker resuelve por sí solo la persistencia; configurar volumen

---

## 4) Excepciones permitidas y decisiones prácticas

### 4.1 Excepciones aceptables
1. Se permite usar un ORM solo como cliente de conexión o ejecución de SP, pero no para reemplazar la lógica obligatoria en Stored Procedures.
2. Se permite usar validación en frontend para UX y en backend para seguridad, aunque la validación final relevante también exista en SP.
3. Se permite usar tablas variables o CTEs en SQL si ayudan a claridad y cumplen el estándar.
4. Se permite encapsular acceso a DB en un repositorio o provider de NestJS mientras internamente solo invoque SP.
5. Se permite usar cookies o JWT para sesión, pero el proyecto debe mantener simpleza y trazabilidad.

### 4.2 Decisiones recomendadas
- Auth simple basada en sesión o JWT corto
- API REST en NestJS
- Next.js con App Router
- UI sencilla con formularios, tablas y modales básicos
- Configuración por `.env`
- Docker Compose para SQL Server
- Turborepo para orquestar frontend y backend en un monorepo
- Scripts separados para:
  - creación de schema
  - tablas
  - seed desde XML o carga inicial
  - SP
  - catálogos

---

## 5) Estándar de SQL que los agentes deben seguir

### 5.1 Reglas obligatorias
- Palabras reservadas en mayúscula
- `SET NOCOUNT ON`
- `BEGIN ... END`
- `BEGIN TRY ... END TRY` y `BEGIN CATCH ... END CATCH`
- Un parámetro `@outResultCode` en todos los SP
- Parámetros de entrada con prefijo `@in`
- Parámetros de salida con prefijo `@out`
- Insertar errores de plataforma en `dbo.DBError` dentro del `CATCH`
- Alias obligatorios para tablas
- `dbo.NombreTabla` siempre
- Expresiones condicionales entre paréntesis
- `SELECT`, `FROM`, `WHERE` en líneas separadas
- Un `INNER JOIN` por línea
- Filtros del `WHERE` una condición por línea
- Nada de `SELECT *`
- Transacciones al final del SP
- Preproceso antes de iniciar transacción
- Código limpio, bonito y ordenado
- Indentación consistente

### 5.2 Convención recomendada de nombres
- `dbo.spAuth_Login`
- `dbo.spEmployee_GetAll`
- `dbo.spEmployee_Insert`
- `dbo.spEmployee_Update`
- `dbo.spEmployee_DeleteLogical`
- `dbo.spMovement_GetByEmployee`
- `dbo.spMovement_Insert`
- `dbo.spLog_InsertEvent`
- `dbo.spError_GetByCode`

---

## 6) Arquitectura propuesta

## 6.1 Monorepo con Turborepo
```txt
vacation-control/
  apps/
    web/                      # Next.js
    api/                      # NestJS
  packages/
    eslint-config/            # configuración compartida opcional
    types/                    # tipos compartidos opcionales
    config/                   # utilidades/config compartida opcional
  db/
    docker/
      docker-compose.yml
    scripts/
      001_create_database.sql
      002_create_tables.sql
      003_seed_catalogs.sql
      004_seed_test_data.sql
      005_create_procedures.sql
      006_permissions.sql
    xml/
      catalogos.xml
      empleados.xml
      movimientos.xml
  docs/
    agent-context.md
    roadmap.md
    api-contract.md
    testing-checklist.md
  turbo.json
  package.json
  pnpm-workspace.yaml
  .env.example
  README.md
```

### 6.1.1 Decisión de monorepo
Se usará **Turborepo** para manejar `apps/web` y `apps/api` dentro de un mismo repositorio.  
Esto permite:
- estandarizar scripts
- compartir configuración
- correr frontend y backend en paralelo
- escalar mejor la estructura si luego se agregan paquetes compartidos
- mantener documentación, DB scripts y apps en un mismo workspace

## 6.2 Módulos de NestJS
- `auth`
- `employees`
- `movements`
- `logs`
- `errors`
- `database`
- `common`

## 6.3 Pantallas de Next.js
- `/login`
- `/employees`
- `/employees/[id-or-token]/view` solo si internamente resolvemos sin exponer id real
- modal o drawer para:
  - insertar empleado
  - editar empleado
  - confirmar borrado
  - listar movimientos
  - insertar movimiento

Nota: aunque exista una ruta dinámica, no exponer el ID crudo en la UI. Se puede usar selección desde lista y resolver internamente con state o un identificador no visible al usuario.

---

## 7) Plan del proyecto re-hecho para Next.js + NestJS + MS SQL en Docker

## Fase 0 — Definición y setup
### Objetivo
Dejar listo el entorno y la base del repositorio.

### Tareas
1. Crear monorepo con **Turborepo**
2. Crear apps:
   - `apps/web` con Next.js
   - `apps/api` con NestJS
3. Crear paquetes compartidos opcionales:
   - `packages/eslint-config`
   - `packages/types`
   - `packages/config`
4. Configurar `turbo.json`
5. Configurar workspace (`pnpm-workspace.yaml` recomendado)
6. Crear `docker-compose.yml` para SQL Server
7. Definir `.env.example`
8. Crear README de arranque local
9. Definir estrategia de ramas:
   - `main`
   - `develop`
   - `feature/...`

### Entregables
- repo inicial en Turborepo
- SQL Server levantando en Docker
- frontend y backend corriendo desde el monorepo
- conexión probada desde NestJS

---

## Fase 1 — Base de datos
### Objetivo
Implementar esquema completo y datos base.

### Tareas
1. Crear tablas del modelo físico:
   - Puesto
   - Empleado
   - TipoMovimiento
   - Movimiento
   - Usuario
   - TipoEvento
   - BitacoraEvento
   - DBError
   - Error
2. Definir llaves primarias y foráneas
3. Configurar defaults de trazabilidad donde aplique
4. Cargar catálogos base
5. Diseñar carga de XML o script equivalente de seed

### Entregables
- scripts SQL versionados
- seed reproducible

---

## Fase 2 — Stored Procedures
### Objetivo
Construir toda la lógica obligatoria en SQL Server.

### Tareas
1. Auth
   - login
   - consulta de intentos fallidos
   - bloqueo temporal
   - logout
2. Employees
   - listar todos
   - filtrar por nombre
   - filtrar por documento
   - insertar
   - actualizar
   - borrado lógico
   - consultar detalle
3. Movements
   - listar por empleado
   - insertar movimiento
   - calcular nuevo saldo
   - impedir saldo negativo
4. Logs
   - registrar eventos
5. Errors
   - consultar descripción por código
6. Catch estándar
   - insertar en `DBError`
   - devolver `@outResultCode`

### Entregables
- archivo de SP completo
- checklist de cumplimiento del estándar SQL

---

## Fase 3 — Backend NestJS
### Objetivo
Exponer API limpia y conectada a SP.

### Tareas
1. Configurar módulo de base de datos
2. Crear executor genérico de SP
3. Crear módulos:
   - auth
   - employees
   - movements
   - logs
   - errors
4. DTOs y validaciones
5. Guards o middleware de auth
6. Manejo centralizado de errores
7. Interceptor o middleware para IP y usuario autenticado
8. Swagger opcional si no complica

### Endpoints sugeridos
- `POST /auth/login`
- `POST /auth/logout`
- `GET /employees`
- `POST /employees`
- `GET /employees/:id/details` interno
- `PATCH /employees/:id`
- `DELETE /employees/:id`
- `GET /employees/:id/movements`
- `POST /employees/:id/movements`

### Entregables
- API funcional
- contratos claros de request/response

---

## Fase 4 — Frontend Next.js
### Objetivo
Construir la UI mínima funcional y clara.

### Tareas
1. Pantalla login
2. Pantalla principal de empleados
3. Filtro por nombre/documento
4. Modal insertar empleado
5. Modal editar empleado
6. Confirmación de borrado
7. Vista de consulta de empleado
8. Vista de movimientos
9. Modal insertar movimiento
10. Mensajes de error provenientes del backend

### Entregables
- flujo completo desde UI

---

## Fase 5 — Bitácora y trazabilidad
### Objetivo
Asegurar registro de acciones.

### Tareas
1. Mapear todos los eventos obligatorios
2. Definir builder de descripciones
3. Registrar:
   - login exitoso
   - login no exitoso
   - login deshabilitado
   - logout
   - inserción exitosa/no exitosa
   - update exitoso/no exitoso
   - intento de borrado
   - borrado exitoso
   - consulta por nombre
   - consulta por cédula
   - intento de insertar movimiento
   - insertar movimiento exitoso

### Entregables
- matriz de eventos vs. implementación

---

## Fase 6 — Testing
### Objetivo
Probar cada requerimiento del enunciado.

### Casos mínimos
1. Login correcto
2. Login incorrecto
3. Bloqueo por intentos
4. Filtro vacío
5. Filtro por nombre
6. Filtro por documento
7. Insert empleado válido
8. Insert duplicado por nombre
9. Insert duplicado por documento
10. Update válido
11. Update inválido por duplicidad
12. Delete lógico
13. Consultar empleado
14. Listar movimientos
15. Insertar movimiento crédito
16. Insertar movimiento débito válido
17. Insertar movimiento con saldo negativo
18. Verificar bitácora
19. Verificar DBError en fallas de plataforma

---

## Fase 7 — Documentación y entrega
### Objetivo
Cerrar el proyecto de forma evaluable.

### Tareas
1. Bitácora del desarrollo
2. Análisis de resultados
3. Instrucciones de ejecución local
4. Evidencias de GitHub
5. Script SQL final
6. Capturas del sistema
7. Checklist final de reglas del profesor

---

## 8) Orden real recomendado de ejecución

1. Crear Turborepo
2. levantar Docker de SQL Server
3. scripts de tablas
4. catálogos
5. Stored Procedures
6. prueba manual en SQL
7. NestJS conexión y ejecución de SP
8. endpoints
9. Next.js login
10. Next.js módulo empleados
11. Next.js movimientos
12. bitácora completa
13. testing
14. documentación

---

## 9) Riesgos del proyecto

1. Empezar por frontend y atrasarse con SQL
2. Romper la regla de “solo SP”
3. No registrar correctamente eventos en bitácora
4. Duplicar reglas de negocio y crear inconsistencias
5. No contemplar IP/usuario en trazabilidad
6. No dejar Docker persistente o reproducible
7. Subestimar el tiempo de SP y validaciones

### Mitigación
- cerrar DB primero
- aprobar cada SP con checklist
- probar casos críticos desde Postman antes del frontend
- mantener documentación viva desde el inicio

---

## 10) Definición de listo por módulo

### Auth listo cuando
- login valida usuario/password
- registra éxitos y fallos
- bloquea tras intentos fallidos
- logout funcional

### Employees listo cuando
- lista
- filtra
- inserta
- actualiza
- consulta
- borra lógicamente
- no expone IDs al usuario

### Movements listo cuando
- lista movimientos
- inserta movimiento
- recalcula saldo
- impide saldo negativo

### Logs listo cuando
- todos los eventos requeridos se registran
- descripción cumple formato

### Delivery listo cuando
- corre local
- DB en Docker
- frontend y backend funcionales
- documentación completa

---

## 11) Recomendaciones finales para agentes

1. Siempre revisar el enunciado antes de implementar.
2. Ante duda, preferir solución simple y alineada al curso.
3. No introducir complejidad innecesaria.
4. Cualquier cambio en DB debe quedar en script versionado.
5. Nunca asumir que el frontend puede corregir una regla que la DB no valida.
6. Mantener naming consistente en inglés técnico o español, pero no mezclar sin criterio.
7. Antes de cerrar una tarea, validar:
   - cumple enunciado
   - cumple estándar SQL
   - no rompe la regla de SP
   - deja evidencia testeable


---

## 12) Reglas específicas por usar Turborepo

1. No mezclar código de `apps/web` con `apps/api`.
2. No colocar lógica de negocio del backend dentro de paquetes compartidos.
3. Los paquetes compartidos deben ser realmente compartibles:
   - tipos
   - config
   - eslint/prettier
   - utilidades puras
4. No poner acceso a DB dentro de `packages/`.
5. La conexión a SQL Server debe vivir únicamente en `apps/api`.
6. Los scripts de DB no deben depender del build de Turbo.
7. Definir scripts consistentes en raíz, por ejemplo:
   - `dev`
   - `build`
   - `lint`
   - `test`
8. Preferir `pnpm` con workspaces para mejor compatibilidad con Turborepo.
9. Mantener alias y tsconfig ordenados para evitar imports rotos entre apps y packages.

### Scripts sugeridos en raíz
- `pnpm dev` → levanta web + api
- `pnpm build` → construye apps necesarias
- `pnpm lint` → lint global
- `pnpm format` → formato global
- `pnpm db:up` → levanta SQL Server en Docker
- `pnpm db:down` → baja contenedor
- `pnpm db:logs` → logs del contenedor
- `pnpm db:migrate` o `pnpm db:init` → ejecuta scripts SQL si decides automatizarlo
