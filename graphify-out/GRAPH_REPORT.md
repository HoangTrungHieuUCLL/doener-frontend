# Graph Report - doener-frontend  (2026-09-11)

## Corpus Check
- Corpus is ~12,590 words - fits in a single context window. You may not need a graph.

## Summary
- 319 nodes · 577 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.83)
- Token cost: 106,724 input · 0 output

## Community Hubs (Navigation)
- API Hooks & Data Fetching
- Exercise Motion Guide
- App Shell & Auth Context
- Session Hooks & Rest Timer
- Package Dependencies
- TS Config (App)
- Docs & Entry HTML
- Plan Hooks & Date Utils
- TS Config (Node)
- Dev Dependencies
- API Client
- Lint Config
- TS Config (Root)
- Favicon Asset

## God Nodes (most connected - your core abstractions)
1. `react` - 18 edges
2. `compilerOptions` - 18 edges
3. `compilerOptions` - 15 edges
4. `Today()` - 11 edges
5. `useAuth()` - 10 edges
6. `Plan()` - 9 edges
7. `Doener Frontend (Project)` - 9 edges
8. `@tanstack/react-query` - 7 edges
9. `api` - 7 edges
10. `ExerciseMotionGuideProps` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Standalone Deployment Model` --conceptually_related_to--> `index.html (App Entry Document)`  [INFERRED]
  README.md → index.html
- `/src/main.tsx Module Script` --conceptually_related_to--> `React`  [INFERRED]
  index.html → README.md
- `Today()` --calls--> `usePlan()`  [EXTRACTED]
  src/pages/Today.tsx → src/api/hooks/usePlan.ts
- `SetPlanInput` --references--> `WorkoutKey`  [EXTRACTED]
  src/api/hooks/usePlan.ts → src/api/types.ts
- `AuthState` --references--> `User`  [EXTRACTED]
  src/auth/AuthContext.tsx → src/api/types.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Tech Stack** — readme_react, readme_vite, readme_typescript, readme_tailwind_css, readme_react_router, readme_tanstack_query, readme_recharts [EXTRACTED 1.00]
- **Docker Deployment Pipeline** — readme_dockerfile, readme_nginx_conf, readme_configuration [EXTRACTED 1.00]

## Communities (14 total, 2 thin omitted)

### Community 0 - "API Hooks & Data Fetching"
Cohesion: 0.07
Nodes (40): recharts, @tanstack/react-query, LogCardioInput, LogSetInput, PAGE_SIZE, useSessionsList(), usePrStats(), useVolumeStats() (+32 more)

### Community 1 - "Exercise Motion Guide"
Cohesion: 0.07
Nodes (41): AnimatedNum(), approxEqual(), BONE_DEFS, BoneDef, darken(), ExerciseMotionGuide(), ExerciseMotionGuideProps, fillFor() (+33 more)

### Community 2 - "App Shell & Auth Context"
Cohesion: 0.09
Nodes (33): react, react-router-dom, App(), queryClient, AuthContext, AuthContextValue, AuthProvider(), AuthState (+25 more)

### Community 3 - "Session Hooks & Rest Timer"
Cohesion: 0.08
Nodes (29): useExercises(), useFinishSession(), useLogCardio(), useLogSet(), useSession(), useStartSession(), Exercise, SessionSetDetail (+21 more)

### Community 4 - "Package Dependencies"
Cohesion: 0.07
Nodes (27): dependencies, react, react-dom, react-router-dom, recharts, @tanstack/react-query, name, private (+19 more)

### Community 5 - "TS Config (App)"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 6 - "Docs & Entry HTML"
Cohesion: 0.14
Nodes (17): index.html (App Entry Document), favicon.svg Icon Reference, /src/main.tsx Module Script, #root Mount Element, Backend Configuration via VITE_API_BASE_URL, Standalone Deployment Model, Multi-stage Dockerfile, Doener Frontend (Project) (+9 more)

### Community 7 - "Plan Hooks & Date Utils"
Cohesion: 0.23
Nodes (13): SetPlanInput, usePlan(), useSetPlan(), WorkoutKey, addDays(), formatDayLabel(), MONTH, todayISO() (+5 more)

### Community 8 - "TS Config (Node)"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, oxlint, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript (+3 more)

### Community 10 - "API Client"
Cohesion: 0.24
Nodes (8): api, API_BASE_URL, ApiError, getToken(), request(), RequestOptions, TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT

### Community 11 - "Lint Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

## Knowledge Gaps
- **127 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+122 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 144 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App Shell & Auth Context` to `API Hooks & Data Fetching`, `Exercise Motion Guide`, `Session Hooks & Rest Timer`, `Package Dependencies`, `Plan Hooks & Date Utils`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Dependencies` to `Package Dependencies`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `@tanstack/react-query` connect `API Hooks & Data Fetching` to `App Shell & Auth Context`, `Session Hooks & Rest Timer`, `Package Dependencies`, `Plan Hooks & Date Utils`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _127 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Hooks & Data Fetching` be split into smaller, more focused modules?**
  _Cohesion score 0.07346938775510205 - nodes in this community are weakly interconnected._
- **Should `Exercise Motion Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.06938775510204082 - nodes in this community are weakly interconnected._
- **Should `App Shell & Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.09393939393939393 - nodes in this community are weakly interconnected._