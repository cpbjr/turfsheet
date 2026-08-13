# Idaho Pesticide Application Record-Keeping — Legal Overview & TurfSheet Compliance Review

**Prepared:** 2026-08-12
**Scope:** Idaho statutory and administrative requirements for pesticide application records, checked
against what TurfSheet stores (`turfsheet.pesticide_applications` + `pesticide_application_products`)
and what it prints (`buildPesticideLogPrintHtml` / `downloadPesticideLogPdf`).

> **Not legal advice.** This is an engineering compliance review against the published rule text.
> Confirm interpretation with ISDA or counsel before relying on it for a regulatory inspection.
> Rule text below was read from the current official IDAPA compilation; sub-item dates read `(7-1-24)`.

---

## 1. The governing law

### 1.1 Statute — Idaho Code Title 22, Chapter 34

[Title 22, Chapter 34 — **Pesticides and Chemigation**](https://legislature.idaho.gov/statutesrules/idstat/Title22/T22CH34/)
is the enabling statute (26 sections, 22-3401 – 22-3426).

The sections that matter for records:

| Section | Relevance |
|---|---|
| [**22-3421**](https://legislature.idaho.gov/statutesrules/idstat/title22/t22ch34/sect22-3421/) | **Adoption and Scope of Rules.** This is the specific delegation ISDA cites as its authority to promulgate IDAPA 02.03.03 — including the record-keeping rule. |
| [**22-3420**](https://legislature.idaho.gov/statutesrules/idstat/title22/t22ch34/sect22-3420/) | **Prohibited Acts.** The enforcement hook. It is a prohibited act to (i) *refuse or neglect to keep and maintain records* required by the act, and (ii) make **false, misleading or fraudulent records or reports**. |
| [**22-3419**](https://legislature.idaho.gov/statutesrules/idstat/title22/t22ch34/sect22-3419/) | Restricted areas; the Director inspects applicator records within a restricted area. |

**Key point:** the statute does not itself enumerate the required fields. It delegates that to rule.
The operative list lives in IDAPA. Citing only the statute is insufficient.

### 1.2 Rule — IDAPA 02.03.03.101

[**IDAPA 02.03.03**](https://adminrules.idaho.gov/rules/current/02/020303.pdf) — *Rules Governing
Pesticide and Chemigation Use and Application*, Idaho Dept. of Agriculture, Ag Resources Division.
Section **101, Professional Applicator Record Keeping Requirements**, is the controlling provision.
Secondary copy: [Cornell LII — IDAPA 02.03.03.101](https://www.law.cornell.edu/regulations/idaho/IDAPA-02.03.03.101).

**101.01 Records Requirements** *(verbatim)*:

> Maintain pesticide application records for two (2) years, ready to be inspected, duplicated, or
> submitted when requested by the Director. Such records shall contain:

| # | Required element | Rule text |
|---|---|---|
| a | Customer | The name and address of the person for whom the pesticide was applied |
| b | Site type | The specific crop, animal, or property treated |
| c | **Location** | The location by the address, general legal description (township, range, and section) **or** latitude/longitude of the specific crop, animal, or property treated |
| d | Size | The size or amount of specific crop, animal, or property treated |
| e | Product | The trade name or brand name of the pesticide applied |
| f | Total amount | The total amount of pesticide applied |
| g | EPA reg. # | The EPA registration number of the pesticide applied |
| h | Date | The date of application |
| i | Time | The time of day when the pesticide is applied |
| j | Wind velocity | The approximate wind velocity |
| k | Wind direction | The approximate wind direction |
| l | Applicator name | The full name of the professional applicator applying the pesticide |
| m | License # | The license number of the professional applicator applying the pesticide |
| n | **Supervisor** | Full name and license number of professional applicator supervising the application of a professional applicator holding the **Apprentice Category (CA)** |
| o | WPS exchange | Worker protection information exchange, if required, prior to pesticide application, **including name of grower or operator contacted and date and time of contact** |

**101.02 Restricted Use Records** *(verbatim)*:

> Professional applicators who have made an application of a restricted use pesticide shall, within
> thirty (30) days of the pesticide application, provide a copy of the application records
> required under this rule for each application of any restricted use pesticide to the person for whom
> the pesticide application was made.

### 1.3 Related provisions worth knowing

- [IDAPA 02.03.03.400 — Pesticide Restrictions](https://www.law.cornell.edu/regulations/idaho/IDAPA-02.03.03.400) — use restrictions, pollinator protection.
- [IDAPA 02.03.01.421 — Pesticide Use and Record Keeping Requirements](https://www.law.cornell.edu/regulations/idaho/IDAPA-02.03.01.421) — a *different* chapter (02.03.01, ground water quality). Applies in designated management areas; do not conflate with 02.03.03.
- [IDAPA 02.03.03.201 — RUP Dealer Records](https://regulations.justia.com/states/idaho/02/02-03-03/subchapter-a/section-02-03-03-201) — dealer distribution records retained **three (3)** years. Different actor, different clock.
- **Federal overlay:** 40 CFR Part 171 (certification) and the EPA Worker Protection Standard, 40 CFR Part 170, referenced throughout the Idaho rules. Federal RUP records for private applicators run **two (2)** years under 7 CFR 110. A golf course is also subject to WPS if it employs handlers.
- [ISDA Pesticide Compliance](https://agri.idaho.gov/pesticides/pesticide-compliance/) — agency guidance and inspection posture.

---

## 2. Compliance review of TurfSheet

Mapping IDAPA 02.03.03.101.01(a)–(o) against the schema
([`types/index.ts:294-340`](turfsheet-app/src/types/index.ts#L294-L340)) and the printed log columns
([`pesticideLogExport.ts:8-33`](turfsheet-app/src/lib/pesticideLogExport.ts#L8-L33)).

| # | Required | Stored? | Printed? | Status |
|---|---|---|---|---|
| a | Customer name **and address** | ✗ | ✗ | **GAP** |
| b | Crop/animal/property treated | ~ `area_applied` | ✓ Area | Adequate |
| c | **Location** (address / township-range-section / lat-long) | ✗ | ✗ | **GAP** |
| d | Size treated | ✓ `area_size` | ✓ Size | OK |
| e | Trade/brand name | ✓ `product_name` | ✓ Product | OK |
| f | Total amount applied | ✓ `total_amount_used` | ✓ Total Used | OK |
| g | EPA registration # | ✓ `epa_registration_number` | ✓ EPA Reg # | OK |
| h | Date | ✓ `application_date` | ✓ Date | OK |
| i | Time of day | ✓ `application_time` | ✓ Time | OK |
| j | Wind velocity | ✓ `wind_speed` | ✓ Wind | OK |
| k | Wind direction | ✓ `wind_direction` | ✓ Wind Dir | OK |
| l | Applicator full name | ✓ `operator_id` → staff | ✓ Applicator | OK |
| m | License number | ✓ `applicator_license` | ✓ License # | **Empty in practice** |
| n | Supervisor name + license (Apprentice CA) | ✗ | ✗ | **GAP (conditional)** |
| o | WPS exchange **+ name of grower/operator contacted + date/time of contact** | ~ boolean only | ✓/✗ tick only | **PARTIAL** |

### Findings, most severe first

**1. No location field at all — 101.01(c). Hard gap.**
The rule requires address, or township/range/section, or latitude/longitude. TurfSheet stores
`area_applied` (free text like "Greens", "#4 Fairway") and nothing else. A regulator reading the
printed log cannot determine *where* the application occurred in any of the three accepted forms.
This is the single clearest non-conformity. For a single-site golf course the fix is cheap: a
course-level address/legal description stored once and printed in the log header.

**2. The printed log asserts a legal citation that is partly wrong.**
[`pesticideLogExport.ts:178`](turfsheet-app/src/lib/pesticideLogExport.ts#L178) and
[`:226`](turfsheet-app/src/lib/pesticideLogExport.ts#L226) print on every page:

> `Records maintained per Idaho Statutes Title 22, Ch. 34 & IDAPA 02.03.03 | Retain for minimum 2 years`

- The **2-year retention is correct** (101.01).
- The chapter references are correct but imprecise — the operative rule is **IDAPA 02.03.03.101**,
  and the statutory authority is specifically **Idaho Code § 22-3421**.
- More seriously: this line **asserts compliance** on a document that is missing required element (c)
  and partially missing (o). Under [§ 22-3420](https://legislature.idaho.gov/statutesrules/idstat/title22/t22ch34/sect22-3420/),
  false or misleading records are a prohibited act. I am not suggesting this rises to a violation —
  it is a boilerplate footer, not a sworn statement — but **printing a compliance claim on a
  non-conforming record is the wrong risk posture.** Either close the gaps or soften the wording.

**3. `applicator_license` is blank on every record — 101.01(m).**
Already tracked in [`active.md`](.agent/Tasks/active.md). The field exists and prints, but it is
free text re-typed per application, so it never gets filled. The log prints `--`. **A required
element that is structurally present but always empty is still a missing record.** The fix already
proposed — move it to `staff` and autofill from the selected operator — is the right one, and this
review raises its priority from housekeeping to compliance.

**4. WPS exchange is a bare boolean — 101.01(o). Partial.**
The rule wants the *name of the grower or operator contacted* and the *date and time of contact*.
TurfSheet stores `worker_protection_exchange: boolean` plus free-text
`worker_protection_requirements`, and prints only ✓/✗. The three specific data points are not
captured as fields.

**5. No supervising-applicator fields — 101.01(n). Conditional.**
Only applies when the applicator holds the **Apprentice Category (CA)**. If Banbury never has an
apprentice apply pesticides, this is inapplicable. If it ever does, the record is non-conforming.
Worth a decision, not necessarily a build.

**6. `rei_hours = 0` on every product.**
Already tracked. Note for scope: **REI is not an IDAPA 02.03.03.101 required record element** — it
comes from the product label and the federal WPS (40 CFR 170). So this is a label/WPS accuracy
problem, not an Idaho record-keeping violation. Still worth fixing; just don't file it under this rule.

**7. Retention is not enforced anywhere.**
2 years is a *minimum*. There is no archival, no delete protection, and no immutability on
`pesticide_applications`. An edit or delete silently rewrites a regulatory record with no audit
trail. Consider append-only history or at minimum blocking hard deletes inside the retention window.

**8. RUP 30-day customer copy — 101.02. Not applicable as configured, but unmodeled.**
The rule requires furnishing records to "the person for whom the application was made" within 30
days for restricted-use products. A superintendent applying to their own course has no external
customer, so this likely does not bite. But TurfSheet has no RUP flag on products at all, so the
system cannot tell you whether it applies. Low priority; worth a field if RUPs are used.

---

## 3. Recommended remediation, in order

| Priority | Action | Rule |
|---|---|---|
| 1 | Add course location — address or township/range/section or lat-long. Store once, print in log header. | 101.01(c) |
| 2 | Move `applicator_license` to `staff`; autofill from operator so it stops printing `--`. | 101.01(m) |
| 3 | Soften or correct the printed compliance footer; cite **IDAPA 02.03.03.101** and **§ 22-3421**. | § 22-3420 |
| 4 | Expand WPS capture to contact name + date + time. | 101.01(o) |
| 5 | Decide whether Apprentice (CA) supervision applies; add two fields if yes. | 101.01(n) |
| 6 | Protect records within the 2-year window (no hard delete; audit trail on edit). | 101.01 |
| 7 | Add customer name/address, or document why a self-applying course is exempt. | 101.01(a) |

---

## 4. Sources

- [Idaho Code Title 22, Chapter 34 — Pesticides and Chemigation](https://legislature.idaho.gov/statutesrules/idstat/Title22/T22CH34/)
- [Idaho Code § 22-3421 — Adoption and Scope of Rules](https://legislature.idaho.gov/statutesrules/idstat/title22/t22ch34/sect22-3421/)
- [Idaho Code § 22-3420 — Prohibited Acts](https://legislature.idaho.gov/statutesrules/idstat/title22/t22ch34/sect22-3420/)
- [Idaho Code § 22-3419 — Procedure for Establishing a Restricted Area](https://legislature.idaho.gov/statutesrules/idstat/title22/t22ch34/sect22-3419/)
- [IDAPA 02.03.03 — Rules Governing Pesticide and Chemigation Use and Application (current PDF)](https://adminrules.idaho.gov/rules/current/02/020303.pdf) — § 101 at p. 10
- [IDAPA 02.03.03.101 — Professional Applicator Record Keeping Requirements (Cornell LII)](https://www.law.cornell.edu/regulations/idaho/IDAPA-02.03.03.101)
- [IDAPA 02.03.03.100 — Professional Applicator Licensing](https://www.law.cornell.edu/regulations/idaho/IDAPA-02.03.03.100)
- [IDAPA 02.03.03.400 — Pesticide Restrictions](https://www.law.cornell.edu/regulations/idaho/IDAPA-02.03.03.400)
- [IDAPA 02.03.01.421 — Pesticide Use and Record Keeping (ground water chapter — distinct)](https://www.law.cornell.edu/regulations/idaho/IDAPA-02.03.01.421)
- [IDAPA 02.03.03.201 — RUP Dealer Records (3-year retention)](https://regulations.justia.com/states/idaho/02/02-03-03/subchapter-a/section-02-03-03-201)
- [ISDA — Pesticide Compliance](https://agri.idaho.gov/pesticides/pesticide-compliance/)
