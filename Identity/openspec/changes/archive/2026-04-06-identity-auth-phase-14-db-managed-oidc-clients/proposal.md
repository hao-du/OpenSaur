# Proposal

## Summary

Move first-party OIDC client registration from static URI arrays in config to managed database records, and add a super-administrator CRUD surface for those clients in the hosted Identity shell.

## Why

- The shared issuer now needs to support more than one first-party or trusted browser client.
- Redirect and post-logout URIs should be derived consistently from a small set of managed public origins plus app path bases.
- Super administrators need an in-product way to manage client onboarding without editing appsettings for every new host.

## Scope

- Add DB-backed managed OIDC client and origin records.
- Store client-owned callback and post-logout paths alongside each managed client.
- Derive exact redirect and post-logout URIs by combining:
  - managed public origins from DB
  - managed app path base from DB
  - managed callback and post-logout paths from DB
- Synchronize managed active clients into OpenIddict applications.
- Add super-administrator-only CRUD APIs and a hosted shell page for managed OIDC clients.
- Keep a bootstrap config path so an empty database can seed the initial shell client, including its default callback and post-logout paths.

## Out Of Scope

- Wildcard redirect URIs
- Public/self-service OIDC client registration
- Replacing issuer/crypto deployment config with database configuration
