# TurfSheet PRD: Security & Compliance

> Extracted from PRD.md lines 2432-2506. Source of truth: [PRD.md](../../PRD.md)

## Security & Compliance

### Data Protection

#### Encryption
- **At Rest:** Database-level encryption (AES-256)
- **In Transit:** TLS 1.3 for all connections
- **Passwords:** bcrypt with salt rounds >= 12
- **API Keys:** Encrypted in database, rotated every 90 days

#### Backup Strategy
- **Frequency:** Daily automated backups
- **Retention:** 30 days rolling + monthly archives for 1 year
- **Testing:** Monthly restore tests
- **Disaster Recovery:** RTO 4 hours, RPO 24 hours

#### Access Control
- Multi-factor authentication (optional, recommended for managers)
- Session timeout after 30 minutes of inactivity
- Device authorization (new device requires email confirmation)
- IP whitelist option for manager accounts

### Compliance Considerations

#### Pesticide Application Records (State Requirements)

Most states require:
- Applicator name and certification number
- Date and time of application
- Product name and EPA registration number
- Application rate and total amount used
- Target pest/disease
- Weather conditions (temperature, wind speed)
- Re-entry interval

**TurfSheet Implementation:**
- All required fields in ApplicationRecord model
- PDF export template matching state forms
- Automatic retention for required period (typically 2-3 years)
- Audit trail for all modifications

#### Right to Work / Worker Certifications
- Track employee certifications with expiration dates
- Alert when certifications expire
- Prevent task assignment requiring expired certifications
- Document storage for certificate copies

#### Audit Trails
- All data modifications logged with timestamp and user
- Immutable audit log (append-only)
- Query capability for compliance officers
- Export for external audits

### Privacy & GDPR Considerations

**Data Collection:**
- Minimal data collection (only what's necessary)
- Clear privacy policy and terms of service
- Opt-in for SMS and push notifications
- Right to data deletion (account deletion removes all personal data)

**Data Retention:**
- Active user data: Retained indefinitely while account active
- Deleted account data: Purged after 90 days
- Compliance records: Retained per regulatory requirements (2-3 years)
- Backup data: Excluded from purge for recovery purposes

**Third-Party Data Sharing:**
- No data sold to third parties
- Weather data shared with NOAA (anonymous)
- Push notifications via Expo/Firebase (minimal PII)
- Analytics via self-hosted instance (no external tracking)
