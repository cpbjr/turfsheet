# TurfSheet — Pesticide Record-Keeping: Compliance, Safeguards, and Ease of Use

**Prepared:** 2026-08-12
**Scope:** Idaho commercial/professional pesticide application records
**Governing rule:** [IDAPA 02.03.03.101](https://adminrules.idaho.gov/rules/current/02/020303.pdf) — Rules Governing Pesticide and Chemigation Use and Application
**Statutory authority:** [Idaho Code § 22-3421](https://legislature.idaho.gov/statutesrules/idstat/Title22/T22CH34/SECT22-3421)

> **Note on use.** Sections 1–3 are written for a general audience and may be adapted for
> marketing. Everything in them is verifiable against the running application. Section 4 is
> operating instructions for OldTom, the Hermes agent that maintains the site.
>
> Two claims to avoid until the corresponding step is finished are flagged inline as
> **[pending]**. TurfSheet makes compliant record-keeping achievable; it does not make a course
> compliant on its own, and the material should not say otherwise.

---

## 1. Records that match what Idaho actually requires

Idaho does not describe pesticide records in general terms. IDAPA 02.03.03.101.01 lists **fifteen
specific elements**, lettered (a) through (o), that a record must contain. Most spray logs — paper
or software — capture ten or twelve of them and are silently short.

TurfSheet captures all fifteen:

| # | Element required by IDAPA 02.03.03.101.01 | Where TurfSheet captures it |
|---|---|---|
| (a) | Date of application | Application date |
| (b) | Property treated | Area applied (green, fairway, hole, tee complex) |
| (c) | Location of the property | Course address, stored once and printed on every log |
| (d) | Crop, commodity, or site treated | Area applied + target |
| (e) | Size of the area treated | Area size |
| (f) | Brand or product name | Product line |
| (g) | EPA registration number | Product line |
| (h) | Active ingredient | Product line |
| (i) | Manufacturer | Product line |
| (j) | EPA lot number | Product line |
| (k) | Rate of application | Rate + rate unit |
| (l) | Total amount applied | Total used, and amount per tank |
| (m) | Applicator name and license number | Operator, license autofilled from the staff record |
| (n) | Worker Protection Standard contact | Contact name, date, and time |
| (o) | Supervising applicator, where applicable | Supervisor name and license |

Beyond the minimum, each record also carries **temperature, wind speed, wind direction, humidity,
and general weather conditions**, the application method and equipment used, who recommended the
treatment, and free-text notes. Those are not required by 101.01, but they are the fields that
decide whether a drift complaint or a turf-loss dispute can be answered a year later.

**One record, many products.** A tank mix is recorded as a single application with a product line
for each chemical in it. Each line carries its own EPA registration number, lot number, rate, and
REI. The printed log expands to one row per product, which is the form a regulator expects to
read, while the person entering it fills in the conditions once.

**The printed log cites its own authority.** Every export carries the footer
*"Records maintained per IDAPA 02.03.03.101 (authority: Idaho Code § 22-3421) | Retain minimum
2 years."* A log that states the rule it was built against is straightforward to hand to an
inspector.

---

## 2. Safeguards — the record resists being lost or quietly altered

Under [Idaho Code § 22-3420](https://legislature.idaho.gov/statutesrules/idstat/Title22/T22CH34/SECT22-3420),
it is a prohibited act both to **neglect to keep the required records** and to **make a false or
misleading record**. Those are two different failures, and TurfSheet defends against each in the
database itself — not in the interface, where a determined click or a bug could route around it.

**Two-year retention is enforced, not requested.** IDAPA 101.01 requires records be kept two years.
TurfSheet refuses to delete an application dated inside that window. The refusal lives in a
database trigger, so it holds no matter how the deletion is attempted — through the app, through a
script, or through a direct query. The user sees a plain explanation and a suggestion to correct
the record rather than remove it.

**Every edit and deletion is audited.** Changes to an application are written to a separate audit
table capturing what changed and when. A corrected record stays honest: the correction is visible
as a correction, rather than replacing history with no trace. This is the difference between fixing
a typo and rewriting a log — and it is precisely the distinction § 22-3420 draws.

**Records are behind a login.** The application requires authentication, and the underlying tables
enforce it independently through row-level security. Anonymous access to application records is
revoked at the database, so an unauthenticated request returns nothing regardless of what the
front end does.

**License numbers come from the staff record, not from memory.** Element (m) was the single most
commonly blank field in the industry's logs, because free-text license fields get retyped on every
application until someone stops bothering. In TurfSheet the number is stored once on the staff
member and fills in automatically whenever that person is selected as the operator. The field that
was always blank is now the field nobody has to think about.

> **[pending]** Applicator license numbers still need to be entered once per staff member before
> element (m) prints on the log. Until then the log shows `--` in that column. Do not use
> screenshots of a log with a blank License # column as marketing material.

---

## 3. Ease of record-keeping and worker safety

Compliance that is tedious does not get done. The design goal here was that a fully compliant
record should take less effort than an incomplete one.

**The log fills itself in wherever it honestly can.**
- Product details — EPA registration number, active ingredient, manufacturer, lot number — come
  from the chemical library when the product is selected. They are not retyped, so they cannot
  drift between records.
- The applicator's license autofills from the operator.
- The course location is entered once and prints on every log.
- Date and time default to now.
- An application can be started directly from the spray calculator, carrying the rates over.

**Worker safety is part of the record, not a separate binder.**
- **Worker Protection Standard contact (element (n))** is captured with the name of the person
  notified, and the date and time they were notified. The fields appear only when a WPS exchange
  actually occurred, so the form stays short for applications where it does not apply — and when
  it does apply, the date and time prefill to the current moment, which is when the notification
  genuinely happened. A WPS record is only worth having if it is contemporaneous.
- **Restricted-entry interval is calculated for the tank, not the bottle.** When several products
  are applied together, the site's REI is the *longest* of them. TurfSheet computes that maximum
  across every product in the application. A per-product REI — which is what a single-line log
  shows — is wrong for any tank mix, and wrong in the unsafe direction: it sends crews back onto
  turf early.
- **Personal protective equipment and re-entry requirements** are recorded per application.
- **Weather at the time of application** is captured on every record, which is what supports a
  drift question and what tells a superintendent whether conditions were within label limits.

> **[pending]** REI hours are currently `0` for every product in the chemical library. The
> longest-REI logic is implemented and correct, but it will report zero until the values are
> verified against the physical product labels and entered. REI is a regulated figure and was
> deliberately not populated from estimates. Do not claim REI enforcement in marketing until the
> library is filled in from labels.

**Printing is one action.** The log exports to PDF with all fifteen elements, one row per product,
filtered to whatever date range is needed — an inspection, a season summary, a single week.

---

## 4. For OldTom — what changed, and how to record applications now

This section is operating instructions for the Hermes agent maintaining the site. It reflects the
2026-08-12 compliance work on branch `feature/idaho-pesticide-compliance`.

### 4.1 Schema changes

New columns on `turfsheet.pesticide_applications`:

| Column | Type | Element | Notes |
|---|---|---|---|
| `wps_contact_name` | text | (n) | Person notified under the Worker Protection Standard |
| `wps_contact_date` | date | (n) | Date of that notification |
| `wps_contact_time` | text | (n) | Time of that notification |
| `supervisor_name` | text | (o) | Supervising applicator, where applicable |
| `supervisor_license` | text | (o) | That supervisor's license number |

New column on `turfsheet.staff`:

| Column | Type | Notes |
|---|---|---|
| `applicator_license` | text | Element (m). Source of truth for the license number. |

New tables:

- **`turfsheet.course_settings`** — singleton holding the property location for element (c):
  `street_address`, `city`, `state`, `postal_code`, `legal_description`, `latitude`, `longitude`.
  Any one of address / legal description / lat-long satisfies the rule; address is preferred.
- **`turfsheet.pesticide_application_audit`** — append-only record of edits and deletions.

### 4.2 Behavioural changes that affect how you write

**Do not delete pesticide applications.** A `BEFORE DELETE` trigger raises an exception
(SQLSTATE `23514`) for any record dated within two years. This applies to the service key as
well — it is not an RLS policy that `service_role` bypasses. If a record is wrong, **update it**;
the audit table captures the correction. If you receive a `23514` on a delete, that is the
retention rule working as designed, not a fault to route around.

**Do not write `applicator_license` from a guess.** Read it from the operator's `staff` row. If
that row's `applicator_license` is null, leave the application's field null and say so — an
invented license number on a regulatory record is a false record under § 22-3420, which is a worse
outcome than a blank.

**Do not backfill historical records.** The 2026-08-12 decision was fix-forward. Existing
applications keep null values in the new columns. Retroactively populating a WPS contact or a
supervisor for an application where you were not present would be fabrication, not correction.

### 4.3 How to record an application

Required for a compliant record — a POST to `pesticide_applications` should carry:

- `application_date`, `application_time`
- `area_applied` (element (b)/(d)) and `area_size` (element (e))
- `operator_id`, and `applicator_license` **read from that staff member's row**
- `method`, `equipment_used`
- weather: `temperature`, `wind_speed`, `wind_direction`, `humidity`, `weather_conditions`
- if a WPS exchange occurred: `worker_protection_exchange: true` plus `wps_contact_name`,
  `wps_contact_date`, `wps_contact_time` — the date and time of the **actual notification**, not of
  your data entry
- if the applicator worked under supervision: `supervisor_name`, `supervisor_license`

Then one row in `pesticide_application_products` per chemical, each with `line_number`,
`product_name`, `epa_registration_number`, `active_ingredient`, `manufacturer`, `epa_lot_number`,
`application_rate`, `rate_unit`, `total_amount_used`, `rei_hours`, and `target_pest`.

**A tank mix is one application with several product lines** — never several applications sharing
a timestamp. The printed log flattens lines back out; splitting them at entry double-counts the
area treated.

**Product details belong to the product, not the application.** Pull EPA registration number,
active ingredient, and manufacturer from the chemical library rather than restating them, so a
correction to the library propagates.

### 4.4 One thing to flag to Chris

Element (m) prints `--` until each applicator's license number is entered on their staff record
(Staff → Edit → Applicator License #). Until that is done, the log's compliance footer overstates
the record. Worth raising, and worth not describing the log as complete in the meantime.

### 4.5 A note on the anon-key diagnostic

Unrelated to this work but relevant to any check you run against these tables: since the
2026-08-08 auth lockdown, an anon-key query returns `401` on every table rather than rows. A
diagnostic that reads with the anon key now reports "no rows," which looks identical to missing
data. Mint a user token for any "what does the browser see?" check. See `.agent/Tasks/active.md`.

---

## Sources

- [IDAPA 02.03.03 — Rules Governing Pesticide and Chemigation Use and Application](https://adminrules.idaho.gov/rules/current/02/020303.pdf) (record-keeping at Section 101)
- [Idaho Code § 22-3421 — Rules](https://legislature.idaho.gov/statutesrules/idstat/Title22/T22CH34/SECT22-3421)
- [Idaho Code § 22-3420 — Prohibited Acts](https://legislature.idaho.gov/statutesrules/idstat/Title22/T22CH34/SECT22-3420)
- [Idaho Code Title 22, Chapter 34 — Pesticides and Chemigation](https://legislature.idaho.gov/statutesrules/idstat/Title22/T22CH34/)
- [Idaho State Department of Agriculture — Pesticides Program](https://agri.idaho.gov/main/plants/pesticides/)
- Full legal analysis: `tmp/idaho-pesticide-recordkeeping-compliance.md`
