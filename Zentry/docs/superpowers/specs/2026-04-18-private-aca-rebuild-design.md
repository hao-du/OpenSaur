# Private ACA Rebuild Design

## Goal

Rebuild the broken Azure Container Apps environment in `Home` while keeping the deployment private behind `ca-cloudflared`, then delete obsolete ACA resources to avoid unnecessary cost.

## Current Problem

The current ACA managed environment `ca-environment` is inconsistent:

- it is configured as a private internal environment
- its ingress infrastructure became inconsistent after ACA-managed resources were displaced
- the Cloudflare tunnel cannot reach `ca-gateway`
- `https://app.duchihao.com/identity` currently returns `502`

The current repair attempt of moving `capp-svc-lb` back was not enough to restore the environment.

## Target Topology

- one new private ACA managed environment in resource group `Home`
- environment attached to the existing delegated subnet `Home-vnet/container`
- one new internal deployment set for:
  - gateway
  - identity
  - umbraco
  - cloudflared
- Cloudflare tunnel remains the only public entry point
- the tunnel forwards `app.duchihao.com` to the new internal gateway origin

## Resources To Keep

These resources are out of scope for deletion:

- `Home-vnet`
- subnet `container`
- PostgreSQL flexible server `home-db`
- storage account `opensaurblob`
- jumpbox resources
- non-ACA private DNS resources unless replacement requires a controlled update

## Resources To Replace

The ACA stack will be replaced cleanly:

- managed environment `ca-environment`
- container apps:
  - `ca-gateway`
  - `ca-identity`
  - `ca-umbraco`
  - `ca-cloudflared`

## Rebuild Strategy

### Phase 1: Create replacement ACA environment

Create a new private ACA managed environment in `Home` on the existing delegated subnet. Use a new environment name so validation can happen without mutating the broken environment in place.

### Phase 2: Deploy replacement apps

Deploy replacement apps with temporary names into the new environment:

- replacement gateway
- replacement identity
- replacement umbraco
- replacement cloudflared

Using temporary names reduces rollback risk and avoids destructive in-place updates during validation.

### Phase 3: Validate private connectivity

Validate:

- new gateway revision is healthy
- new identity route responds behind the new gateway
- replacement cloudflared can reach the new internal gateway origin
- `app.duchihao.com/identity` returns a successful application response after tunnel cutover

### Phase 4: Cut over public traffic

Update the Cloudflare tunnel origin to the replacement private gateway endpoint. Re-test the public route through Cloudflare before deleting anything old.

### Phase 5: Delete obsolete ACA resources

After successful cutover:

- delete old ACA apps
- delete old ACA managed environment
- delete obsolete ACA infrastructure resource group contents if Azure does not clean them automatically

## Deletion Rules

Deletion is allowed only after:

- replacement apps are healthy
- tunnel cutover succeeds
- `app.duchihao.com/identity` is verified working

Do not delete:

- shared data services
- VNet and subnet
- storage
- jumpbox resources

## Verification

Success criteria:

- new ACA environment exists and is healthy
- replacement gateway and identity are reachable internally
- `ca-cloudflared` reaches the new origin without timeout
- `https://app.duchihao.com/identity` returns success
- old ACA resources are removed

## Risks

- the delegated subnet may still carry stale ACA service association state
- Cloudflare origin config may still point to the wrong scheme or host after rebuild
- deleting the old environment before validation would create unnecessary downtime

## Recommendation

Use a new private ACA environment and replacement app names first, cut over only after validation, then remove the broken ACA stack to minimize downtime and avoid repeating the current inconsistent environment state.
