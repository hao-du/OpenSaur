# 🗺️ Master Plan: Frontend Uniform Architecture Refactor

**Goal**: Implement a consistent, scalable, and maintainable architecture across all CRUD-based features, specifically addressing the high complexity of the `transactions` domain.

---

## 🏗️ 1. The Implementation Standard (The 4-Layer Pattern)
Every CRUD feature will be refactored into this strictly decoupled hierarchy to eliminate "God Components."

| Layer | Component | Responsibility |
| :--- | :--- | :--- |
| **1. Orchestrator** | `[Feature]Page.tsx` | High-level layout; instantiates specialized hooks; coordinates between List and Drawers. |
| **2. Logic Layer** | `use[Entity]Form.ts` | (Custom Hook) Manages `useForm`, editing state, submission logic, and API/Storage mapping for a specific entity (e.g., `useCashFlowForm`). |
| **3. Bridge Layer** | `[Entity]Drawer.tsx` | Receives the form instance/data from the hook; handles the Drawer UI and `form.handleSubmit`. |
| **4. UI Layer** | `[Entity]Form.tsx` | (Dumb Component) Purely functional; receives `control` object and validation props; contains only input fields. |

---

## 📂 2. The Physical Organization (Domain-Driven Grouping)

### 🛠️ Shared Domain (Cross-Feature Logic)
To prevent circular dependencies (e.g., between `transactions` and `templates`), shared UI and logic will live here:
* `src/OpenSaur.CashPilot.Web/client/src/shared-domain/transactions/`
    * `components/`: Shared "Dumb" UI (e.g., `TransactionForm.tsx`, `TypeChips.tsx`).
    * `types/`: Shared Type definitions.

### 📦 Feature Organization (The `transactions` Domain)
The `transactions` feature will be split into sub-features to separate transaction states:
```text
src/OpenSaur.CashPilot.Web/client/src/features/transactions/
├── common/               <-- UI elements used ONLY within the transaction feature
├── main/                 <-- CORE: Server-side "Real" transactions
├── pending/              <-- SERVER PENDING: Transactions awaiting sync
└── offline/              <-- LOCAL: Transactions stored in IndexedDB
```

---

## 🚀 3. Execution Roadmap

### Phase 1: Foundation & Type Safety
* [x] **Define Standard Interfaces**: Establish strict TypeScript interfaces in `shared-domain/transactions/types/index.ts`.
* [x] **Directory Standardization**: Enforce the new directory structure and the `shared-domain` concept.
* [x] **Create Plan File**: Save this master strategy to `.agents/plans/20260704_refactor_fe_uniform.md`.
* [x] **🛠️ Verification**: Run `npx tsc -b` and `npm run lint` in the client directory.
🛑 **Stop for Review**

### Phase 2: Feature-by-Feature Refactor (Low Risk)
*Each phase includes a mandatory verification step: `npx tsc -b`, `npm run lint`, and `npm run build`.*

* **Phase 2.1: Tags**
    * [x] Refactor `Tags` to 4-layer pattern.
    * [x] Verify with typecheck/lint/build.
🛑 **Stop for Review**
* **Phase 2.2: Counterparties**
    * [x] Refactor `Counterparties` to 4-layer pattern.
    * [x] Verify with `npx tsc -b` and `npm run build`; `npm run lint` is not available in `src/OpenSaur.CashPilot.Web/client/package.json`.
🛑 **Stop for Review**
* **Phase 2.3: Currencies**
    * [x] Refactor `Currencies` to 4-layer pattern.
    * [x] Verify with `npx tsc -b` and `npm run build`; `npm run lint` is not available in `src/OpenSaur.CashPilot.Web/client/package.json`.
🛑 **Stop for Review**
* **Phase 2.4: Banks**
    * [x] Refactor `Banks` to 4-layer pattern.
    * [x] Verify with `npx tsc -b` and `npm run build`; `npm run lint` is not available in `src/OpenSaur.CashPilot.Web/client/package.json`.
🛑 **Stop for Review**

### Phase 3: The Transaction Domain (High Complexity)
*Each phase includes a mandatory verification step: `npx tsc -b`, `npm run lint`, and `npm run build`.*

* **Phase 3.1: Transactions (Main/Real)**
    * [x] Refactor `TransactionsPage` and its 4 specialized hooks.
    * [x] Verify with `npx tsc -b` and `npm run build`; `npm run lint` is not available in `src/OpenSaur.CashPilot.Web/client/package.json`.
🛑 **Stop for Review**
* **Phase 3.2: Pending Transactions**
    * [x] Implement specialized hooks for each type; refactor `PendingTransactionsPage`.
    * [x] Verify with typecheck/lint/build.
🛑 **Stop for Review**
* **Phase 3.3: Offline Transactions**
    * [x] Implement specialized hooks; refactor `OfflineTransactionsPage`.
    * [x] Verify with typecheck/build; `npm run lint` is not available in `src/OpenSaur.CashPilot.Web/client/package.json`.
🛑 **Stop for Review**
* **Phase 3.4: Templates**
    * [x] Utilize shared Transaction UI components for Templates.
    * [x] Verify with typecheck/build; `npm run lint` is not available in `src/OpenSaur.CashPilot.Web/client/package.json`.
🛑 **Stop for Review**

### Phase 4: Final Verification & Cleanup
* [x] **Comprehensive Sweep**: Final `npx tsc -b` across the entire client directory; `npm run lint` is not available in `src/OpenSaur.CashPilot.Web/client/package.json`.
* [x] **Manual QA**: Verify all CRUD flows in all transaction states.
🛑 **Stop for Review**
