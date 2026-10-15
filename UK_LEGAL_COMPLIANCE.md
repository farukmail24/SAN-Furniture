# UK Legal, Regulatory & Compliance Framework: SAN Furniture

This document outlines the mandatory legal frameworks, statutory requirements, and technical implementations governing the sale of furniture and e-commerce operations in the United Kingdom.

---

## 1. Furniture and Furnishings (Fire Safety) Regulations 1988 (as amended)

### Statutory Scope
The **Furniture and Furnishings (Fire Safety) Regulations 1988 (SI 1988/1324)** impose stringent flammability standards on all domestic upholstered furniture supplied in the UK.

### Mandatory Compliance Rules
1. **Filling Materials**:
   - All foam fillings (polyurethane foam) must pass the ignitability test (BS 5852: Part 2).
   - Non-foam fillings must pass relevant tests in Schedule 2 of the regulations.
2. **Upholstery Covers**:
   - Primary upholstery covers must pass the match test (Schedule 5, Part 1) or be used over a fire-resistant interliner (BS 5852: Part 1).
   - All covers must be cigarette resistant (Schedule 4, Part 1).
3. **Labelling Requirements**:
   - **Display Labels**: Every upholstered item displayed for sale or delivered to a UK consumer must carry the statutory display label (swing tag) indicating compliance with cigarette and match resistance.
   - **Permanent Labels**: A permanent label must be securely sewn into the furniture containing the manufacturer's name, batch number, date of manufacture, and compliance declaration.
4. **Dropshipping Implementation**:
   - Every UK supplier contract must mandate that suppliers provide a **Certificate of Compliance (BS 5852)** for every SKU before it is published on the storefront.
   - The database stores a `fire_safety_compliant: true` flag and the certificate reference number.
   - The storefront displays a clear badge on all PDPs: *"Meets UK Fire Safety Regulations 1988 (BS 5852)"*.

---

## 2. Consumer Contracts (Information, Cancellation & Additional Charges) Regulations 2013

### Statutory Scope
Governs distance selling (online sales) to UK consumers, mandating clear pre-contract information and statutory cancellation rights.

### Mandatory Compliance Rules
1. **14-Day Statutory Right of Cancellation**:
   - Customers have the right to cancel their order within **14 calendar days** starting the day after physical delivery of goods is received.
   - Customers are entitled to a full refund including standard outbound delivery costs within 14 days of the goods being returned.
2. **Exclusions from Cancellation**:
   - Custom-made / bespoke furniture (e.g. customized fabric upholstery manufactured to bespoke specifications).
   - Items unsealed that cannot be returned for hygiene reasons (e.g., unwrapped mattresses or mattress toppers once protective seal is broken).
3. **Return Carriage Costs**:
   - The terms of service must explicitly state who pays for return carriage. For large 2-man furniture (sofas, wardrobes), the terms must clearly outline the estimated return collection fee (e.g., *"Return collection for 2-man delivery items is £65.00 deducted from the refund"*).
4. **Pre-Contract Information**:
   - Full company details, registered address, VAT number, and a downloadable standard cancellation form must be accessible prior to checkout.

---

## 3. Pricing & Tax Transparency (Consumer Rights Act 2015 & HMRC)

1. **VAT Inclusive Pricing**:
   - Under the Consumer Protection from Unfair Trading Regulations 2008 and HMRC guidelines, all prices displayed to UK consumers must clearly include the standard **20% UK VAT**.
   - Hidden delivery fees at checkout are illegal: delivery fees or thresholds must be clearly stated on product pages before the customer enters the checkout funnel.
2. **VAT Invoicing**:
   - A valid VAT invoice must be issued for all B2C and B2B transactions upon request, detailing:
     - Supplier business name and registered UK address.
     - UK VAT Registration Number (e.g., `GB 123 4567 89`).
     - Tax point (date of order or delivery).
     - Net price, VAT rate (20%), VAT amount, and gross payable.

---

## 4. UK GDPR & PECR (Data Protection and Privacy)

### Statutory Scope
The **Data Protection Act 2018 (UK GDPR)** and the **Privacy and Electronic Communications Regulations (PECR)** govern personal data handling, tracking cookies, and marketing consents.

### Mandatory Compliance Rules
1. **Cookie Consent (PECR)**:
   - Non-essential cookies (Google Analytics 4, Meta Pixel, Hotjar, marketing trackers) MUST NOT be fired before the user grants affirmative consent.
   - A granular cookie banner must provide:
     - **Accept All**
     - **Reject Non-Essential** (Must be equal visual weight to Accept All; no dark patterns)
     - **Customize Preferences** (Categorized into: Essential, Functional, Analytics, Marketing).
2. **Customer Consent for Marketing**:
   - Pre-ticked newsletter / marketing checkboxes at checkout are strictly forbidden under UK GDPR. Checkboxes must default to unchecked (opt-in).
3. **Data Subject Rights**:
   - Automated workflows to support:
     - Right to Access (export all orders and personal data).
     - Right to Erasure / "To Be Forgotten" (anonymize customer records while preserving required 6-year HMRC accounting invoices).
4. **ICO Registration**:
   - The operating UK company must register as a data controller with the **Information Commissioner's Office (ICO)** and display the registration number in the Privacy Policy.

---

## 5. Payment Security & PCI-DSS Compliance

1. **Zero Cardholder Data Storage**:
   - SAN Furniture servers NEVER touch, transmit, or store unencrypted primary account numbers (PAN), CVV/CVC codes, or expiration dates.
   - All card data is handled exclusively inside **Stripe Elements** (hosted iframes with direct tokenization).
2. **Strong Customer Authentication (SCA / 3D Secure 2)**:
   - All UK payments trigger SCA authentication when mandated by the cardholder's issuing bank to minimize fraud and chargeback liabilities.
3. **Idempotency Protection**:
   - All payment endpoints and webhook handlers verify idempotency keys to eliminate double-billing risks during network jitter or retries.

---

## 6. Website Mandatory Footer Disclosures

To comply with the UK Companies Act 2006, the footer of every page on SAN Furniture must include:
- Registered Company Name: `SAN Furniture Ltd` (or operating entity)
- Registered in: `England and Wales`
- Company Registration Number: `[UK Company Number]`
- Registered Office Address: `[UK Physical Business Address]`
- VAT Registration Number: `GB [VAT Number]`
- ICO Data Protection Number: `[ICO Registration Number]`
- Customer Support: UK Phone Number, Support Email, and Operating Hours (GMT/BST).
