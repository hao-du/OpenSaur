## 1. Mounted Backoffice Routing

- [x] 1.1 Narrow the `/cms` redirect shim so root backoffice asset requests are not redirected into broken mounted asset URLs
- [x] 1.2 Inject the mounted `/cms/umbraco` backoffice path into the rendered Umbraco shell HTML
- [x] 1.3 Rewrite fingerprinted mounted backoffice asset requests to the unversioned asset paths Umbraco serves

## 2. Verification

- [x] 2.1 Build the Umbraco project successfully
- [x] 2.2 Verify `/cms/umbraco` loads without backoffice CSS/JS 404 responses
