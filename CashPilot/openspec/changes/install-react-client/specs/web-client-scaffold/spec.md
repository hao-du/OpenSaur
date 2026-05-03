## ADDED Requirements

### Requirement: Scaffold React Project
The system must be able to initialize a new React project using Vite and TypeScript in the specified directory.

#### Scenario: Successful Scaffolding
- **WHEN** the user runs the installation command in the empty `client` directory.
- **THEN** the directory should contain `package.json`, `vite.config.ts`, and a `src` folder with basic React components.

### Requirement: TypeScript Support
The scaffolded project must have full TypeScript support including `tsconfig.json` and `.tsx` files.

#### Scenario: Verify TypeScript Config
- **WHEN** the installation is complete.
- **THEN** a valid `tsconfig.json` should exist and reference React-related types.
