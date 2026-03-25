# Skill: ERP IO

## Scope

Outbound XML export to ERP systems via external SFTP.
Inbound ERP responses are received as files via SFTP.

ERP is system-of-record.
This service produces and interprets data — it does not own accounting state.

---

## Contract Authority

Each ERP vendor defines its own XML contract via XSD.

Schemas are located in:

    /lib/erp/schema/<vendor>/

The XSD defines structure, cardinality, and data types.

Outbound XML must validate against the vendor XSD before transmission.

No structural assumptions beyond the XSD are allowed.

---

## Transport Model

- File-based integration via external SFTP.
- Outbound and inbound communication is asynchronous.
- Transport logic must be isolated from domain logic.

---

## Export Semantics

- Export may be batch or single-document.
- Export must be deterministic.
- Identical input state must produce identical XML output.
- No random identifiers.
- No non-deterministic timestamps.

Vendor systems handle idempotency.
This system must not implement competing idempotency rules.

---

## Response Handling

Inbound response formats are vendor-specific.

The system must:

- Parse response files according to vendor schema.
- Map vendor-specific response semantics to a canonical internal status model.
- Avoid hardcoding assumptions about tag names or message structures.

Vendor response interpretation must be isolated in an adapter layer.

---

## Vendor Isolation

- Vendor-specific export and response logic must not leak into core domain logic.
- Core domain must depend only on canonical models.
- Vendor adapters handle schema and response differences.

---

## Separation of Concerns

ERP IO layer is responsible for:

- Mapping canonical model → vendor XML
- XSD validation
- SFTP transport
- Parsing vendor responses
- Translating vendor responses to canonical status

It is NOT responsible for:

- Matching logic
- Bank ingestion
- Business rule evaluation
- Ownership of accounting state