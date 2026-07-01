# Business Requirements

This directory contains the "What" of the application. While `.agent/rules/` defines **how** the code should be written, this folder defines **what** the application is supposed to do.

## Contents

### `core-business-logic.md`
Fundamental rules and domain constraints that apply across the entire application (e.g., "Users cannot have negative balances").

### `feature-specs/`
Detailed functional specifications for specific business domains or features (e.g., "How a transaction is processed from detection to categorization").

## How to use this folder

1.  **During Investigation**: Before implementing a new feature, check this folder to understand the intended business logic and edge cases.
2.  **When implementing**: Refer to these requirements to ensure the code behavior matches the product vision.
3.  **When documenting**: If you discover a critical business rule through code analysis that isn't documented here, create a new markdown file in the appropriate subdirectory.
