# RoomBae Enterprise AES-256-GCM Envelope Encryption & Key Rotation Guide

This guide details the cryptographic implementation, envelope format, field protection scope, and zero-downtime key rotation workflow for the RoomBae production environment.

---

## 1. Authenticated Envelope Format

All sensitive PII and financial fields are stored in the versioned envelope format:

```text
v1:<keyId>:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
```

- **`v1`**: Envelope schema version.
- **`keyId`**: Key identifier matching environment secrets (e.g. `v1`, `v2`, `v3`).
- **`iv_hex`**: 96-bit (12-byte) cryptographically random initialization vector (hex).
- **`auth_tag_hex`**: 128-bit (16-byte) GCM authentication tag (hex).
- **`ciphertext_hex`**: Encrypted payload string (hex).

> [!NOTE]
> For backward compatibility, legacy 4-part envelopes `v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>` are transparently decrypted using key ID `v1` and upgraded on subsequent writes or via the rotation script.

---

## 2. Protected Fields Scope

| Entity Model | Protected Fields | Purpose |
| :--- | :--- | :--- |
| **`OwnerProfile`** | `bankDetails` (`accountNumber`, `ifscCode`, `accountHolderName`), `upiId`, `gstNumber` | Banking & Tax Compliance Protection |
| **`OwnerKYC`** | `idNumber` (`aadhaarNumber`, `panNumber`), `documentUrls` | National ID PII Data Protection |
| **`ResidentProfile`** | `aadhaarNumber`, `panNumber`, `emergencyContact` | Resident PII Protection |

---

## 3. Environment Variable Configuration

```bash
# Key v1 (Initial master key)
ENCRYPTION_MASTER_KEY_V1="<32_byte_or_strong_secret_key_v1>"

# Key v2 (Rotated key)
ENCRYPTION_MASTER_KEY_V2="<32_byte_or_strong_secret_key_v2>"

# Active Key for new encryptions
ACTIVE_ENCRYPTION_KEY="v2"
```

---

## 4. Key Rotation Execution Procedure

When rotating the master encryption key from `v1` to `v2`:

### Step 1: Provision Key in Production Secrets

Add `ENCRYPTION_MASTER_KEY_V2` to the production environment secrets without changing `ACTIVE_ENCRYPTION_KEY`.

### Step 2: Update Active Key Setting

Set `ACTIVE_ENCRYPTION_KEY="v2"`. All newly created records and updates will immediately encrypt using `v2`. Existing records with `v1` remain readable.

### Step 3: Run Database Migration Script

Execute the batch re-encryption script:

```bash
cd backend
npx ts-node scripts/rotate-encryption.ts v2
```

The script:

1. Iterates over all `OwnerProfile` and `OwnerKYC` records.
2. Identifies fields encrypted with older keys (e.g. `v1`).
3. Re-encrypts with `v2` without modifying plaintext data.
4. Generates an immutable `KEY_ROTATED` `SecurityAuditEvent` record in MongoDB.

### Step 4: Decommission Old Key

Once all historical records are verified with `v2`, `ENCRYPTION_MASTER_KEY_V1` can be safely deprecated.
