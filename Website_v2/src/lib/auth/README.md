# Ternak OS — Frontend Auth/RLS Architecture Refactor Summary

## Executive Summary

Frontend Ternak OS menggunakan arsitektur:

* Hybrid RBAC + Capability-Based Authorization
* Separation antara platform access dan business access
* Full alignment dengan Supabase RLS backend
* Elimination of legacy inline role checks
* Future-proof multi-tenant architecture

Ini bukan sekadar refactor UI role-checking, tetapi sinkronisasi total antara:

* React authorization layer
* Supabase RLS policies
* PostgreSQL capability helpers
* Tenant isolation model
* Platform-level admin system

---

# 1. NEW AUTH ARCHITECTURE

Authorization sekarang dibagi menjadi 4 layer berbeda.

## A. Platform Layer (`app_role`)

Digunakan untuk akses internal platform/global system.

Stored in:
```js
profiles.app_role
```

Allowed values:
```js
'user'
'superadmin'
```

> [!IMPORTANT]
> `superadmin` TIDAK BOLEH lagi diperlakukan sebagai business role.
> JANGAN gunakan `profile.role === 'superadmin'`. SELALU gunakan `isSuperadmin(profile)`.

---

## B. Business Role Layer (`role`)

Digunakan untuk authorization tenant/business.

Stored in:
```js
profiles.role
```

Allowed values:
```js
owner
admin
manajer
manager
staff
view_only
anak_buah
sales
supir
gudang
kurir
admin_rpa
operator
qc
gudang_rpa
finance
lainnya
```

> [!IMPORTANT]
> Role ini sekarang murni tenant-scoped. Tidak ada lagi role global di layer ini.

---

## C. Business Type Layer (`user_type`)

Digunakan untuk routing/module segmentation.

Stored in:
```js
profiles.user_type
```

Allowed values:
```js
broker
peternak
rpa
```

> [!IMPORTANT]
> `user_type` sekarang adalah ROOT business category. BUKAN lagi subdomain granular.

---

## D. Vertical Layer (`tenants.business_vertical`)

Digunakan untuk subdomain/industry specialization.

Stored in:
```js
tenants.business_vertical
```

Examples:
```js
poultry_broker
egg_broker
sembako_broker
distributor_sembako
peternak
peternak_sapi_penggemukan
peternak_domba_penggemukan
rpa
rpa_livebird
rpa_karkas
```

> [!IMPORTANT]
> Semua vertical-specific logic HARUS berasal dari `tenant.business_vertical`.
> JANGAN derive vertical dari `profile.user_type`.
> Karena: `user_type` = root category, `business_vertical` = specialization.

---

# 2. FRONTEND AUTH MODULE STRUCTURE

New auth structure:
```txt
src/lib/auth/
├── constants.js
├── app-roles.js
├── business-roles.js
├── capabilities.js
├── guards.jsx
└── index.js
```

---

# 3. AUTH HELPERS (MANDATORY)

## Platform Helpers
```js
isSuperadmin(profile)
```
Checks: `profile.app_role === 'superadmin'`

## Business Helpers
```js
isOwner(profile)
isAdmin(profile)
isManager(profile)
isStaff(profile)
```
Checks business role ONLY.

## Capability Helpers
Frontend sekarang mirror backend SQL capability functions.

Examples:
```js
canManageSales(profile)
canUpdateSales(profile)

canManagePayments(profile)
canUpdatePayments(profile)

canManagePurchases(profile)
canUpdatePurchases(profile)

canManageInventory(profile)

canManageRPA(profile)

canManageDrivers(profile)
```

> [!IMPORTANT]
> JANGAN buat helper generik seperti `canWrite()` atau `canEdit()`.
> Semua capability harus explicit dan mirror backend.

---

# 4. ABSOLUTELY FORBIDDEN PATTERNS

## ❌ Forbidden #1
```js
profile.role === 'superadmin'
```
**Replace with:** `isSuperadmin(profile)`

## ❌ Forbidden #2
```js
profile.user_type === 'superadmin'
```
Tidak valid lagi.

## ❌ Forbidden #3
```js
profile.role === 'owner' || profile.role === 'superadmin'
```
**Replace with:** `isOwner(profile) || isSuperadmin(profile)`

## ❌ Forbidden #4
Deriving business vertical from user_type.
**BAD:** `if (profile.user_type === 'broker')`
**GOOD:** Use `tenant.business_vertical` for module specialization.

---

# 5. ROUTE GUARDS

New route guards added:
```jsx
<RequireSuperadmin />
<RequireOwner />
<RequireCapability />
```

> [!IMPORTANT]
> Sidebar visibility ≠ security. Route protection MUST happen at router level.

---

# 6. SUPERADMIN MODEL

## Previous Architecture (REMOVED)
OLD: `role = 'superadmin'`
This caused: tenant auth leakage, mixed permission context, broken scaling, impossible capability separation.

## New Architecture
NOW:
```js
app_role = 'superadmin'
role = 'owner'
```
Meaning:
* platform authority comes from app_role
* business authority comes from role

This allows:
* one user owning multiple tenants
* superadmin remaining business-owner inside tenant
* clean multi-tenant scaling

---

# 7. DATABASE/RLS ALIGNMENT

Frontend now fully aligned with backend.

Backend contains:
- **Protected Columns:** `profiles.app_role`, `profiles.role`, `profiles.user_type`
- **Trigger Protection:** Users CANNOT self-escalate `app_role`, `role`, `user_type`
- **RLS Forced:** `ALTER TABLE profiles FORCE ROW LEVEL SECURITY;`
- **Capability Functions:** Backend helper examples: `can_manage_sales()`, `can_update_sales()`, dsb. Frontend helpers MUST remain synchronized with SQL behavior.

---

# 8. CURRENT CANONICAL DOMAIN MODEL

## Identity Model
```txt
User
 └── app_role
      ├── user
      └── superadmin
```

## Tenant Authorization Model
```txt
Tenant Membership
 └── role
      ├── owner
      ├── admin
      ├── manager
      └── staff
```

## Business Category Model
```txt
Tenant Type
 └── user_type
      ├── broker
      ├── peternak
      └── rpa
```

## Industry Specialization Model
```txt
Tenant Vertical
 └── business_vertical
      ├── poultry_broker
      ├── egg_broker
      ├── peternak_sapi_penggemukan
      └── etc
```

---

# 9. FUTURE DEVELOPMENT RULES

## When adding new module
DO:
1. Add backend capability function
2. Add frontend capability helper
3. Use capability in UI
4. Use capability in router guard
5. Use capability in Supabase query assumptions

## When adding new business vertical
DO NOT:
* add new user_type
* add new app_role

ONLY add: `tenants.business_vertical`

## When adding new permission
DO NOT: `if (role === 'x')`
DO: `canManageSomething(profile)`
