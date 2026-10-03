# Project Instructions for AI Agents

This file is the entrypoint for AI agent guidance in this project.

## Core Rules

- Always read the relevant local skills before thinking, planning, or implementing
- Do not add unit tests or automation tests unless explicitly requested
- Do not create git commits automatically unless explicitly requested
- Do not place agentic files, AI instruction files, or workflow docs inside "src/"
- Do not add data seeding or startup seeding code unless explicitly requested
- Do not treat example names, client IDs, secrets, URLs, or sample values from discussion as real implementation values
- Do not create markdown TODO lists or use a second issue tracker
- No need to give me any code samples during planning phase if not necessary, to save tokens and time.
- Review all other rules in "agents\rules".
- All explaination from you will be short, easy to understand and simple sample if needed.
- You must always STOP and wait for the user's explicit manual review and approval after implementing each item. NEVER mark an item completed `[x]` or proceed to the next item automatically.

## Skills

- Use "agents\skills\superpowers\brainstorming\SKILL.md" to brainstorm ideas for all requirements
- Use "agents\skills\superpowers\writing-plans\SKILL.md" and "agents\skills\superpowers\writing-skills\SKILL.md" before writing implementation plans.

## Folders

- agents: contain all agentic-related items such as skills, instructions, memory etc
- docs: contain all documentation files which is writen by agentic coding tool.
- devops: contain all yaml-related deployment files
- src: contain all the implementation code

## Release cycle

- All release scopes will be defined manually.
- Folder structure will follow:

```
 docs\
 -- release-001\
 ---- specs.md
 ---- tasks\
 ------ feature-001.md
 ------ feature-002.md
```

- Foreach feature-xxx.md, split out big feature into smaller items, each item must be reviewed before moving to another item.
- Need [] checkbox to track changes for each item inside feature-xxx.md. Only add 'x' if the item is approved manually by the user. Do not check off items or advance to subsequent items without explicit user confirmation.