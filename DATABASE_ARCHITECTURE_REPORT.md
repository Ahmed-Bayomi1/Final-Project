# PharmaCare Supabase Database Analysis Report

## Executive Summary
PharmaCare is a **Multi-Pharmacy Inventory & Reservation Platform** where patients reserve medicines from multiple pharmacies, and pharmacy staff manage inventory and fulfill reservations. The system uses Supabase (PostgreSQL) for authentication and database, with a clear separation of concerns for Users (Patients), Pharmacy Staff, and System Admins.

---

## 1. Existing or Implied Tables in the Current Project

### 1.1 `auth.users` (Supabase Built-in)
**Purpose:** Supabase's native authentication table storing email/password credentials.

**Files implying its use:**
- `UserSignUp.jsx` - Uses `supabase.auth.signUp()` to create auth accounts
- `UserLogin.jsx` - Uses `supabase.auth.signInWithPassword()`
- `Userlayout.jsx` - Calls `supabase.auth.getSession()`

**Current columns used:**
- `id` (UUID) - Primary identifier
- `email` - User's email
- `encrypted_password` - Encrypted password
- `user_metadata` - Contains custom data (full_name, national_id, phone, dob, address, role)

**Status:** ✅ Already exists (Supabase managed)

---

### 1.2 `profiles` (User Extended Profile)
**Purpose:** Extends `auth.users` with structured patient/user data.

**Files implying its use:**
- `Userlayout.jsx` - Fetches `profiles` table with `supabase.from('profiles').select('*').eq('id', userId)`
- `ReservationModal.jsx` - Expects `user` object with `id` field from profiles
- `HomeUser.jsx` - Uses `user.full_name` from profiles context

**Current columns used/expected:**
- `id` (UUID, FK → auth.users.id)
- `full_name` (VARCHAR)
- `national_id` (VARCHAR)
- `phone_number` (VARCHAR)
- `date_of_birth` (DATE)
- `address` (TEXT)
- `email` (VARCHAR, from auth)

**Status:** ⚠️ **Partially implemented** - Code expects it to exist but unclear if fully created in Supabase

---

### 1.3 `pharmacies` (Pharmacy Locations)
**Purpose:** Master table of all pharmacies in the system.

**Files implying its use:**
- `MedicineBrowse.jsx` - Queries: `supabase.from('pharmacies').select('id, name, address').eq('is_active', true)`
- `PharmacyManagement.jsx` - Shows pharmacy data: name, license, owner, governorate, street, status
- `PharmacyReservation.jsx` - Implies pharmacy-specific reservations

**Current columns used/expected:**
- `id` (UUID)
- `name` (VARCHAR)
- `address` (TEXT)
- `is_active` (BOOLEAN)
- `license_number` (VARCHAR) - From UI mock data
- `owner` (VARCHAR) - From UI mock data
- `governorate` (VARCHAR) - From UI mock data
- `street` (VARCHAR) - From UI mock data
- `phone` (VARCHAR) - Referenced in MedicineBrowse
- `email` (VARCHAR) - Referenced in MedicineBrowse
- `latitude` (NUMERIC) - For location services (implied)
- `longitude` (NUMERIC) - For location services (implied)

**Status:** ⚠️ **Partially implemented** - Queries assume it exists but full schema unclear

---

### 1.4 `medicines` (Medicine Master Data)
**Purpose:** Master catalog of all medicines available in the system.

**Files implying its use:**
- `MedicineBrowse.jsx` - Queries with nested select:
  ```javascript
  medicines(id, name, generic_name, dosage, description, requires_prescription, unit)
  ```
- `HomeUser.jsx` - Uses medicine data for display
- `SearchUser.jsx` - Filters medicines by name/dosage
- `Inventory.jsx` - Shows: id, name, description, category, price, quantity, status

**Current columns used/expected:**
- `id` (UUID)
- `name` (VARCHAR)
- `generic_name` (VARCHAR) - Optional generic name
- `dosage` (VARCHAR) - e.g., "500mg"
- `description` (TEXT)
- `requires_prescription` (BOOLEAN)
- `unit` (VARCHAR) - e.g., "tablet", "ml", "capsule"
- `manufacturer` (VARCHAR) - Referenced in initial schema
- `is_active` (BOOLEAN) - Default TRUE

**Status:** ⚠️ **Partially implemented** - Core fields exist in queries, but full scope unclear

---

### 1.5 `pharmacy_medicines` (Inventory Bridge)
**Purpose:** Links pharmacies to medicines, storing inventory quantity and pricing for each pharmacy-medicine combination.

**Files implying its use:**
- `MedicineBrowse.jsx` - Primary query:
  ```javascript
  pharmacy_medicines(id, pharmacy_id, medicine_id, quantity_in_stock, price_per_unit, is_available)
  ```
  with nested joins to `pharmacies` and `medicines`
- `ReservationModal.jsx` - Uses `medicineItem.id` as `pharmacy_medicine_id` when creating reservation items
- `Inventory.jsx` - Shows per-pharmacy inventory data
- `HomeUser.jsx` - Displays inventory with pricing

**Current columns used/expected:**
- `id` (UUID)
- `pharmacy_id` (UUID, FK → pharmacies.id)
- `medicine_id` (UUID, FK → medicines.id)
- `quantity_in_stock` (INT)
- `price_per_unit` (NUMERIC)
- `is_available` (BOOLEAN) - Whether available for purchase
- `expiry_date` (DATE) - Optional, for tracking expiry
- `reorder_level` (INT) - Optional, for low stock alerts

**Constraints:**
- UNIQUE(pharmacy_id, medicine_id) - One price/inventory per pharmacy per medicine

**Status:** ✅ **Actively used** - Code heavily depends on this

---

### 1.6 `reservations` (Patient Reservations / Orders)
**Purpose:** Main booking table tracking when a patient reserves medicines from a pharmacy.

**Files implying its use:**
- `ReservationModal.jsx` - Creates with:
  ```javascript
  supabase.from('reservations').insert({
    user_id, pharmacy_id, reservation_date, total_amount, 
    status: 'pending', payment_status: 'unpaid', notes
  })
  ```
- `ReserveUser.jsx` - Shows user's reservations with status tracking
- `PharmacyReservation.jsx` - Shows reservations for pharmacy staff to manage

**Current columns used/expected:**
- `id` (UUID)
- `user_id` (UUID, FK → profiles.id)
- `pharmacy_id` (UUID, FK → pharmacies.id)
- `reservation_date` (DATE)
- `total_amount` (NUMERIC)
- `status` (VARCHAR) - 'pending', 'ready', 'collected', 'cancelled'
- `payment_status` (VARCHAR) - 'unpaid', 'paid', 'refunded'
- `notes` (TEXT) - Optional special instructions
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Status:** ✅ **Actively used** - Code heavily depends on this

---

### 1.7 `reservation_items` (Reservation Line Items)
**Purpose:** Tracks individual medicines and quantities within each reservation.

**Files implying its use:**
- `ReservationModal.jsx` - Creates with:
  ```javascript
  supabase.from('reservation_items').insert({
    reservation_id, medicine_id, pharmacy_medicine_id,
    quantity_requested, unit_price, subtotal
  })
  ```

**Current columns used/expected:**
- `id` (UUID)
- `reservation_id` (UUID, FK → reservations.id) - ON DELETE CASCADE
- `medicine_id` (UUID, FK → medicines.id)
- `pharmacy_medicine_id` (UUID, FK → pharmacy_medicines.id)
- `quantity_requested` (INT)
- `quantity_allocated` (INT) - Optional, for partial fulfillment
- `unit_price` (NUMERIC)
- `subtotal` (NUMERIC)
- `created_at` (TIMESTAMPTZ)

**Status:** ✅ **Actively used** - Code heavily depends on this

---

## 2. Missing Tables That Should Be Created

### 2.1 `pharmacy_staff` (Pharmacy Employees)
**Why needed:**
- Pharmacy staff manage inventory, reservations, and analytics for their assigned pharmacy
- `PharmacyReservation.jsx` implies staff can update reservation status
- `Inventory.jsx` implies staff can manage their pharmacy's medicines
- `PharmacyDashboard.jsx`, `Analytics.jsx` imply staff dashboards

**Business flow:**
1. A pharmacy may have multiple staff members
2. Staff can only manage their own pharmacy's data
3. Staff role differs from admin or patient role

**Suggested schema:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| pharmacy_id | UUID | FK→pharmacies.id, NOT NULL | Assigned pharmacy |
| user_id | UUID | FK→auth.users.id, NOT NULL, UNIQUE | Link to auth user |
| role | VARCHAR | Check role IN ('staff', 'manager', 'owner') | Hierarchy level |
| full_name | VARCHAR | NOT NULL | Staff member name |
| phone | VARCHAR | NOT NULL | Contact number |
| email | VARCHAR | NOT NULL, UNIQUE | Email for notifications |
| is_active | BOOLEAN | DEFAULT TRUE | Employment status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Hire date |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

---

### 2.2 `admin_users` (System Administrators)
**Why needed:**
- `AdminLogin.jsx`, `AdminSignUp.jsx`, `ManageUser.jsx`, `PharmacyManagement.jsx` imply admin functionality
- Admins manage pharmacies, users, system settings
- RLS policies must distinguish admins from other roles

**Business flow:**
1. Super admins can view/manage all data
2. May have sub-admin roles (e.g., regional admins)
3. Need audit trail for admin actions

**Suggested schema:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | UUID | FK→auth.users.id, NOT NULL, UNIQUE | Link to auth user |
| admin_level | VARCHAR | Check level IN ('super_admin', 'regional_admin', 'moderator') | Admin hierarchy |
| full_name | VARCHAR | NOT NULL | Admin name |
| email | VARCHAR | NOT NULL, UNIQUE | Email for alerts |
| permissions | JSONB | Optional | Custom permission set |
| is_active | BOOLEAN | DEFAULT TRUE | Admin active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Assignment date |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

---

### 2.3 `medicine_categories` (Medicine Classification)
**Why needed:**
- `Inventory.jsx` shows category field (Antibiotics, Analgesics, Gastro, Cardiology, Diabetes, Antihistamines)
- `HomeUser.jsx` shows category pills
- Currently only in UI; should be normalized in DB for filtering and reporting

**Business flow:**
1. Medicines grouped by therapeutic category
2. Used for search/filter
3. May have subcategories in future

**Suggested schema:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| name | VARCHAR | NOT NULL, UNIQUE | Category name |
| description | TEXT | Optional | Category details |
| icon | VARCHAR | Optional | UI icon reference |
| is_active | BOOLEAN | DEFAULT TRUE | Category status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation date |

---

### 2.4 `medicine_category_mapping` (Many-to-Many)
**Why needed:**
- A medicine may belong to multiple categories (e.g., Antibiotic + Pain reliever)
- Normalizes medicine-to-category relationship

**Suggested schema:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| medicine_id | UUID | FK→medicines.id, NOT NULL | Medicine reference |
| category_id | UUID | FK→medicine_categories.id, NOT NULL | Category reference |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation date |
| **PK** | | (medicine_id, category_id) | Composite key |

---

### 2.5 `ratings_reviews` (Pharmacy/Medicine Ratings)
**Why needed:**
- `ProfileUser.jsx` shows star ratings on completed reservations
- Currently UI-only; needs persistent storage
- Essential for rating system and pharmacy reputation

**Business flow:**
1. User rates each collected reservation
2. Ratings visible on pharmacy profile
3. Used for pharmacy ranking

**Suggested schema:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| reservation_id | UUID | FK→reservations.id, NOT NULL, UNIQUE | One rating per reservation |
| user_id | UUID | FK→profiles.id, NOT NULL | Patient who rated |
| pharmacy_id | UUID | FK→pharmacies.id, NOT NULL | Pharmacy being rated |
| medicine_id | UUID | FK→medicines.id, Optional | Medicine specific rating |
| rating | SMALLINT | Check rating BETWEEN 1 AND 5 | Star rating 1-5 |
| comment | TEXT | Optional | User review comment |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Rating date |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Edit date |

---

### 2.6 `reservation_status_history` (Audit Trail)
**Why needed:**
- Track status changes in reservations (pending → ready → collected)
- Useful for analytics and troubleshooting
- Required for audit compliance

**Business flow:**
1. Each status change logged
2. Track who made the change (pharmacy staff user_id)
3. Timestamp of transition

**Suggested schema:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| reservation_id | UUID | FK→reservations.id, NOT NULL | Reservation being tracked |
| old_status | VARCHAR | Optional | Previous status |
| new_status | VARCHAR | NOT NULL | New status |
| changed_by | UUID | FK→pharmacy_staff.user_id, Optional | Staff member who changed |
| notes | TEXT | Optional | Reason for change |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Timestamp of change |

---

### 2.7 `notifications` (User Notifications)
**Why needed:**
- Alert patients when reservation is ready
- Alert pharmacy staff of new reservations
- Used for system-wide announcements

**Business flow:**
1. Various events trigger notifications (status change, new reservation, etc.)
2. Stored for user notification history
3. Marked as read/unread

**Suggested schema:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | UUID | FK→auth.users.id, NOT NULL | Recipient |
| type | VARCHAR | Check type IN ('reservation_ready', 'reservation_created', 'inventory_low', 'order_shipped') | Notification type |
| title | VARCHAR | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification content |
| related_entity | VARCHAR | Optional | Entity type (reservation, pharmacy, etc.) |
| related_id | UUID | Optional | ID of related entity |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Notification timestamp |
| read_at | TIMESTAMPTZ | Optional | When user read it |

---

### 2.8 `audit_logs` (System Audit Trail)
**Why needed:**
- Track sensitive operations (user data changes, pharmacy approval, admin actions)
- Compliance and security requirements
- Troubleshooting and forensics

**Business flow:**
1. Log all critical DB operations
2. Track who did what and when
3. Record before/after values for updates

**Suggested schema:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | UUID | FK→auth.users.id, Optional | User performing action |
| action | VARCHAR | NOT NULL | Action type (CREATE, UPDATE, DELETE) |
| entity_type | VARCHAR | NOT NULL | Table name (users, pharmacies, etc.) |
| entity_id | UUID | NOT NULL | Record affected |
| old_values | JSONB | Optional | Previous column values |
| new_values | JSONB | Optional | New column values |
| ip_address | INET | Optional | IP of requester |
| user_agent | TEXT | Optional | Browser/app info |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Action timestamp |

---

## 3. Existing Tables That Need Modification

### 3.1 `profiles` Table
**Current problem:**
- Code in `Userlayout.jsx` fetches from `profiles` table but it's not clear if all required columns exist
- User signup collects data (full_name, national_id, phone, dob, address) but doesn't explicitly create profile record
- Relationship to `auth.users` not documented

**Required modifications:**

| Column | Current | Required | Reason |
|--------|---------|----------|--------|
| id | Unknown | UUID PK, FK→auth.users.id | Primary key linking to auth |
| full_name | Partial | VARCHAR(255) NOT NULL | From signup form |
| national_id | Unknown | VARCHAR(50) UNIQUE NOT NULL | From signup, should be unique |
| phone_number | Unknown | VARCHAR(20) NOT NULL | From signup |
| date_of_birth | Unknown | DATE NOT NULL | From signup (dob) |
| address | Unknown | TEXT NOT NULL | From signup |
| city | Unknown | VARCHAR(100) | Inferred from address storage |
| state | Unknown | VARCHAR(100) | Regional organization |
| postal_code | Unknown | VARCHAR(20) | For address completeness |
| medical_conditions | Missing | TEXT | Patient medical history |
| allergies | Missing | TEXT | Critical for pharmacist review |
| is_verified | Missing | BOOLEAN DEFAULT FALSE | Email/phone verification |
| role | Unknown | VARCHAR(50) DEFAULT 'user' | Should be stored in profiles too |
| created_at | Unknown | TIMESTAMPTZ DEFAULT NOW() | Account creation |
| updated_at | Unknown | TIMESTAMPTZ DEFAULT NOW() | Last modification |

**Actions needed:**
1. ✅ Ensure all columns exist with correct types
2. ✅ Add UNIQUE constraint on national_id
3. ✅ Add ON DELETE CASCADE from auth.users.id
4. ✅ Create trigger to auto-populate profile on auth signup
5. ✅ Add check constraint: phone_number ~ '^\+?[0-9\s-()]+$' (valid phone format)

---

### 3.2 `pharmacies` Table
**Current problem:**
- Partially implemented; code queries it but full schema unclear
- `PharmacyManagement.jsx` shows fields not yet in queries (license, owner, governorate, street)
- Missing operational fields (opening hours, GPS location, status workflow)

**Required modifications:**

| Column | Current | Required | Reason |
|--------|---------|----------|--------|
| id | ✅ UUID | UUID PK | Primary key |
| name | ✅ VARCHAR | VARCHAR(255) NOT NULL, UNIQUE | Pharmacy name |
| address | ✅ TEXT | TEXT NOT NULL | Full address |
| phone | ✅ | VARCHAR(20) NOT NULL | Contact |
| email | ✅ | VARCHAR(255) NOT NULL | Email contact |
| license_number | Missing | VARCHAR(100) UNIQUE NOT NULL | Government license |
| owner | Missing | VARCHAR(255) | Pharmacy owner name |
| governorate | Missing | VARCHAR(100) | Regional location |
| street | Missing | VARCHAR(255) | Detailed street address |
| latitude | Missing | NUMERIC(10,8) | GPS for location services |
| longitude | Missing | NUMERIC(11,8) | GPS for location services |
| opening_time | Missing | TIME | Store opening hour |
| closing_time | Missing | TIME | Store closing hour |
| is_active | ✅ BOOLEAN | BOOLEAN DEFAULT TRUE | Operational status |
| status | Missing | VARCHAR CHECK status IN ('active', 'pending', 'suspended', 'closed') | Admin approval status |
| created_at | Missing | TIMESTAMPTZ DEFAULT NOW() | Registration date |
| updated_at | Missing | TIMESTAMPTZ DEFAULT NOW() | Last modification |

**Actions needed:**
1. ✅ Add missing columns
2. ✅ Add UNIQUE constraint on license_number
3. ✅ Add CHECK constraints on status and hours
4. ✅ Create spatial index on (latitude, longitude) for location queries

---

### 3.3 `medicines` Table
**Current problem:**
- Core data exists but full pharmaceutical requirements unclear
- Missing fields needed for inventory management and prescriptions

**Required modifications:**

| Column | Current | Required | Reason |
|--------|---------|----------|--------|
| id | ✅ UUID | UUID PK | Primary key |
| name | ✅ VARCHAR | VARCHAR(255) NOT NULL | Medicine name |
| generic_name | ✅ VARCHAR | VARCHAR(255) | Generic/chemical name |
| dosage | ✅ VARCHAR | VARCHAR(100) NOT NULL | Strength (e.g., 500mg) |
| unit | ✅ VARCHAR | VARCHAR(50) NOT NULL | Form (tablet, ml, capsule) |
| description | ✅ TEXT | TEXT | Pharmaceutical info |
| requires_prescription | ✅ BOOLEAN | BOOLEAN DEFAULT FALSE | Rx requirement |
| manufacturer | ✅ VARCHAR | VARCHAR(255) | Pharmaceutical company |
| batch_number | Missing | VARCHAR(100) | Optional batch tracking |
| is_active | ✅ BOOLEAN | BOOLEAN DEFAULT TRUE | Availability |
| created_at | Missing | TIMESTAMPTZ DEFAULT NOW() | Added to catalog |

**Actions needed:**
1. ✅ Add NOT NULL constraints where appropriate
2. ✅ Create index on name, generic_name for search
3. ✅ Ensure data consistency on requires_prescription

---

### 3.4 `pharmacy_medicines` Table
**Current problem:**
- Good structure but missing important constraints and fields
- No expiry tracking or reorder logic
- Missing audit fields

**Required modifications:**

| Column | Current | Required | Reason |
|--------|---------|----------|--------|
| id | ✅ UUID | UUID PK | Primary key |
| pharmacy_id | ✅ UUID FK | UUID FK NOT NULL | Pharmacy reference |
| medicine_id | ✅ UUID FK | UUID FK NOT NULL | Medicine reference |
| quantity_in_stock | ✅ INT | INT NOT NULL DEFAULT 0 | Current stock |
| price_per_unit | ✅ NUMERIC | NUMERIC(10,2) NOT NULL | Sale price |
| expiry_date | ✅ DATE | DATE | Stock expiry date |
| reorder_level | ✅ INT | INT DEFAULT 10 | Auto-reorder threshold |
| is_available | ✅ BOOLEAN | BOOLEAN DEFAULT TRUE | Purchasable status |
| created_at | Missing | TIMESTAMPTZ DEFAULT NOW() | Inventory added |
| updated_at | Missing | TIMESTAMPTZ DEFAULT NOW() | Last update |
| **Constraints** | Missing | UNIQUE(pharmacy_id, medicine_id) | One entry per pharmacy-medicine |
| | Missing | CHECK quantity_in_stock >= 0 | Quantity validation |
| | Missing | CHECK price_per_unit > 0 | Price validation |

**Actions needed:**
1. ✅ Add UNIQUE constraint on (pharmacy_id, medicine_id)
2. ✅ Add CHECK constraints for quantity >= 0 and price > 0
3. ✅ Add created_at, updated_at timestamps
4. ✅ Create trigger to update updated_at on modification

---

### 3.5 `reservations` Table
**Current problem:**
- Core structure exists but missing important audit/tracking fields
- No constraint on status values
- Missing payment tracking fields

**Required modifications:**

| Column | Current | Required | Reason |
|--------|---------|----------|--------|
| id | ✅ UUID | UUID PK | Primary key |
| user_id | ✅ UUID FK | UUID FK NOT NULL | Patient reference |
| pharmacy_id | ✅ UUID FK | UUID FK NOT NULL | Pharmacy reference |
| reservation_date | ✅ DATE | DATE NOT NULL | Requested date |
| total_amount | ✅ NUMERIC | NUMERIC(12,2) NOT NULL | Order total |
| status | ✅ VARCHAR | VARCHAR(50) CHECK status IN (...) | Order state |
| payment_status | ✅ VARCHAR | VARCHAR(50) CHECK payment_status IN (...) | Payment state |
| notes | ✅ TEXT | TEXT | Special instructions |
| estimated_ready_date | Missing | DATE | When pharmacy expects to prepare |
| actual_pickup_date | Missing | TIMESTAMPTZ | When actually picked up |
| pickup_code | Missing | VARCHAR(20) UNIQUE | Code shown at pickup |
| created_at | ✅ | TIMESTAMPTZ DEFAULT NOW() | Order creation |
| updated_at | ✅ | TIMESTAMPTZ DEFAULT NOW() | Last update |

**Actions needed:**
1. ✅ Add CHECK constraints on status values: 'pending', 'confirmed', 'ready', 'collected', 'cancelled'
2. ✅ Add CHECK constraints on payment_status: 'unpaid', 'paid', 'refunded'
3. ✅ Add pickup_code generation logic
4. ✅ Add estimated_ready_date for SLA tracking

---

## 4. Relationships and Foreign Keys

### 4.1 Complete Relationship Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTH.USERS (Supabase)                            │
│                      (email, password)                              │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                ┌────────┴────────┬──────────────────────────┐
                │                 │                          │
           (1)  │              (1)│                       (1)│
                │                 │                          │
         ┌──────▼────────┐  ┌─────▼──────────┐    ┌────────▼────────┐
         │   PROFILES    │  │ PHARMACY_STAFF │    │  ADMIN_USERS    │
         │   (patients)  │  │ (employees)    │    │  (admins)       │
         └───────┬────────┘  └─────┬──────────┘    └─────────────────┘
                 │                 │
                 │                 │ (1)
            (1)  │            (M)  │
                 │                 │
              (M)│             ┌────▼─────────────┐
                 │             │   PHARMACIES    │
            ┌────▼──────────────┤ (multi-pharmacy) │
            │                   └────┬────────────┘
            │                        │
      ┌─────▼──────────────┐    (M) │  (1)
      │  RESERVATIONS      │         │
      │ (orders/bookings)  │         │
      └────────┬───────────┘         │
               │                     │
          (1)  │  (M)            (M) │
               │                     │
         ┌─────▼────────────────────▼─────┐
         │  PHARMACY_MEDICINES            │
         │  (inventory w/ price)          │
         └────────────┬────────────────────┘
                      │
                  (M) │ (1)
                      │
              ┌───────▼────────┐         ┌──────────────────────┐
         ┌────▼────────────────┤         │ MEDICINES (master    │
         │ RESERVATION_ITEMS   │◄────────│  catalog)            │
         │ (line items)        │  (1)    └──────────────────────┘
         └─────────────────────┘    (M)
              │
         (1)  │
              │
    ┌─────────▼──────────────┐
    │ RATINGS_REVIEWS        │
    │ (pharmacy feedback)    │
    └────────────────────────┘

Optional: RESERVATION_STATUS_HISTORY, NOTIFICATIONS, AUDIT_LOGS, MEDICINE_CATEGORIES, MEDICINE_CATEGORY_MAPPING
```

### 4.2 Detailed Relationships

| Relationship | Parent | Child | FK Column | Cardinality | ON DELETE | Reason |
|---|---|---|---|---|---|---|
| User → Profile | auth.users | profiles | id | 1:1 | CASCADE | Profile represents extended user data |
| User → Pharmacy Staff | auth.users | pharmacy_staff | user_id | 1:1 | CASCADE | Staff account for pharmacy employee |
| User → Admin | auth.users | admin_users | user_id | 1:1 | CASCADE | Admin account for system admin |
| Pharmacy ← Staff | pharmacy_staff | pharmacies | pharmacy_id | M:1 | RESTRICT | Staff assigned to pharmacy |
| Pharmacy ← Inventory | pharmacy_medicines | pharmacies | pharmacy_id | M:1 | RESTRICT | Cannot delete pharmacy with inventory |
| Medicine ← Inventory | pharmacy_medicines | medicines | medicine_id | M:1 | RESTRICT | Cannot delete medicine in inventory |
| Patient → Reservation | reservations | profiles | user_id | M:1 | CASCADE | Delete reservations when user deleted |
| Pharmacy → Reservation | reservations | pharmacies | pharmacy_id | M:1 | RESTRICT | Cannot delete pharmacy with reservations |
| Reservation → Items | reservation_items | reservations | reservation_id | M:1 | CASCADE | Delete items when reservation deleted |
| Medicine → Reservation Item | reservation_items | medicines | medicine_id | M:1 | RESTRICT | Medicine is historical reference |
| Pharmacy Medicine → Item | reservation_items | pharmacy_medicines | pharmacy_medicine_id | M:1 | SET NULL | Allows historical reference even if removed |
| Reservation → Rating | ratings_reviews | reservations | reservation_id | 1:1 | CASCADE | Delete rating when reservation deleted |
| Rating → User | ratings_reviews | profiles | user_id | M:1 | CASCADE | User ratings are deleted with profile |
| Rating → Pharmacy | ratings_reviews | pharmacies | pharmacy_id | M:1 | RESTRICT | Keep pharmacy rating history |
| Reservation → Status History | reservation_status_history | reservations | reservation_id | M:1 | CASCADE | Audit trail deleted with reservation |

---

## 5. Row Level Security (RLS) Design

### 5.1 User Roles and Their Database Permissions

#### Role 1: PATIENT / USER
**Identification:** `auth.users.user_metadata->>'role' = 'user'`

**Tables Accessible:**

| Table | SELECT | INSERT | UPDATE | DELETE | Rule |
|-------|--------|--------|--------|--------|------|
| profiles | ✅ Own | ✅ | ✅ Own | ❌ | Users can only view/edit own profile |
| pharmacies | ✅ All (public) | ❌ | ❌ | ❌ | Browse all pharmacies |
| medicines | ✅ All (public) | ❌ | ❌ | ❌ | Browse all medicines |
| pharmacy_medicines | ✅ All (public) | ❌ | ❌ | ❌ | See all inventory |
| reservations | ✅ Own | ✅ | ✅ Own | ⚠️ Own (cancel) | Only own reservations |
| reservation_items | ✅ Own* | ✅ | ❌ | ❌ | View items in own reservations |
| ratings_reviews | ✅ Own | ✅ Own | ✅ Own | ✅ Own | Rate/review own collected orders |
| notifications | ✅ Own | ❌ | ✅ Own (mark read) | ✅ Own | Own notifications only |

*Own = where user_id matches auth.uid()

**RLS Policies:**

```sql
-- profiles: Users can view/edit own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- reservations: Users can create and view own reservations
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status != 'collected');

-- Public tables: Everyone can read
CREATE POLICY "Pharmacies are public"
  ON pharmacies FOR SELECT USING (is_active = true);

CREATE POLICY "Medicines are public"
  ON medicines FOR SELECT USING (is_active = true);

CREATE POLICY "Inventory is public"
  ON pharmacy_medicines FOR SELECT USING (is_available = true);
```

---

#### Role 2: PHARMACY_STAFF / PHARMACY_MANAGER
**Identification:** User has record in `pharmacy_staff` table

**Tables Accessible:**

| Table | SELECT | INSERT | UPDATE | DELETE | Rule |
|-------|--------|--------|--------|--------|------|
| profiles | ✅ Own | ❌ | ✅ Own | ❌ | Can only access own profile |
| pharmacy_staff | ✅ Own | ❌ | ✅ Own | ❌ | View own staff record |
| pharmacies | ✅ Own | ❌ | ✅ Own | ❌ | Manage only assigned pharmacy |
| medicines | ✅ All | ❌ | ❌ | ❌ | Browse all medicines |
| pharmacy_medicines | ✅ Own | ✅ Own | ✅ Own | ⚠️ Own (deactivate) | Manage own pharmacy's inventory |
| reservations | ✅ Own* | ❌ | ✅ Own* | ❌ | View/update reservations for own pharmacy |
| reservation_items | ✅ Own* | ❌ | ❌ | ❌ | View items in own pharmacy's reservations |
| reservation_status_history | ✅ Own* | ✅ Own* | ❌ | ❌ | Log status changes |
| notifications | ✅ Own | ❌ | ✅ Own | ✅ Own | Own notifications |

*Own = reservation belongs to assigned pharmacy

**RLS Policies:**

```sql
-- pharmacy_medicines: Staff can manage own pharmacy inventory
CREATE POLICY "Staff can view own pharmacy inventory"
  ON pharmacy_medicines FOR SELECT
  USING (pharmacy_id IN (
    SELECT pharmacy_id FROM pharmacy_staff
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Staff can update own pharmacy inventory"
  ON pharmacy_medicines FOR UPDATE
  USING (pharmacy_id IN (
    SELECT pharmacy_id FROM pharmacy_staff
    WHERE user_id = auth.uid()
  ))
  WITH CHECK (pharmacy_id IN (
    SELECT pharmacy_id FROM pharmacy_staff
    WHERE user_id = auth.uid()
  ));

-- reservations: Staff can view/update own pharmacy's reservations
CREATE POLICY "Staff can view own pharmacy reservations"
  ON reservations FOR SELECT
  USING (pharmacy_id IN (
    SELECT pharmacy_id FROM pharmacy_staff
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Staff can update own pharmacy reservations"
  ON reservations FOR UPDATE
  USING (pharmacy_id IN (
    SELECT pharmacy_id FROM pharmacy_staff
    WHERE user_id = auth.uid()
  ))
  WITH CHECK (pharmacy_id IN (
    SELECT pharmacy_id FROM pharmacy_staff
    WHERE user_id = auth.uid()
  ));

-- pharmacy_medicines: Can insert new inventory
CREATE POLICY "Staff can insert inventory for own pharmacy"
  ON pharmacy_medicines FOR INSERT
  WITH CHECK (pharmacy_id IN (
    SELECT pharmacy_id FROM pharmacy_staff
    WHERE user_id = auth.uid()
  ));
```

---

#### Role 3: ADMIN / SUPER_ADMIN
**Identification:** User has record in `admin_users` table with `admin_level = 'super_admin'`

**Tables Accessible:**

| Table | SELECT | INSERT | UPDATE | DELETE | Rule |
|-------|--------|--------|--------|--------|------|
| All tables | ✅ All | ✅ All | ✅ All | ✅ All | Full system access (with audit) |
| audit_logs | ✅ All | ✅ Auto | ❌ | ❌ | Immutable audit trail |

**RLS Policies:**

```sql
-- Service role / admin bypass
-- All tables should allow service role full access for migrations/operations

CREATE POLICY "Service role bypass"
  ON {table_name} FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admin can do everything
CREATE POLICY "Admins have full access"
  ON {table_name} FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );
```

---

### 5.2 RLS Enablement by Table

```sql
-- Enable RLS on all user-data tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_status_history ENABLE ROW LEVEL SECURITY;

-- Public tables (no RLS, or optional RLS for safety)
-- medicines - optional (truly public but could add check for is_active)
```

---

## 6. Constraints, Validation Rules, and Performance Recommendations

### 6.1 PRIMARY KEYS & UNIQUE CONSTRAINTS

| Table | PK | Unique Constraints | Reason |
|-------|----|--------------------|--------|
| profiles | id (UUID) | national_id, email (implied from auth) | One profile per person |
| pharmacies | id (UUID) | name, license_number | No duplicate pharmacies or licenses |
| medicines | id (UUID) | name (scoped by dosage/unit) | One medicine per strength/form |
| pharmacy_medicines | id (UUID) | (pharmacy_id, medicine_id) | One inventory entry per pharmacy-medicine |
| reservations | id (UUID) | pickup_code (when generated) | Unique pickup reference |
| reservation_items | id (UUID) | None (can have duplicate items if resubmitted) | Composite PK with reservation_id preferred |
| pharmacy_staff | user_id (FK to auth.users) | (user_id, pharmacy_id) | One staff per user per pharmacy |
| admin_users | user_id (FK to auth.users) | user_id | One admin per auth user |
| ratings_reviews | id (UUID) | reservation_id | One rating per reservation |

### 6.2 CHECK CONSTRAINTS

```sql
-- profiles
ALTER TABLE profiles ADD CONSTRAINT check_phone_format
  CHECK (phone_number ~ '^\+?[0-9\s\-()]{7,}$');

ALTER TABLE profiles ADD CONSTRAINT check_dob_past
  CHECK (date_of_birth < CURRENT_DATE);

-- pharmacies
ALTER TABLE pharmacies ADD CONSTRAINT check_status_values
  CHECK (status IN ('active', 'pending', 'suspended', 'closed'));

ALTER TABLE pharmacies ADD CONSTRAINT check_hours_valid
  CHECK (opening_time < closing_time);

ALTER TABLE pharmacies ADD CONSTRAINT check_lat_lon
  CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude IS NOT NULL AND longitude IS NOT NULL AND
     latitude >= -90 AND latitude <= 90 AND
     longitude >= -180 AND longitude <= 180)
  );

-- pharmacy_medicines
ALTER TABLE pharmacy_medicines ADD CONSTRAINT check_quantity_non_negative
  CHECK (quantity_in_stock >= 0);

ALTER TABLE pharmacy_medicines ADD CONSTRAINT check_price_positive
  CHECK (price_per_unit > 0);

-- reservations
ALTER TABLE reservations ADD CONSTRAINT check_status_values
  CHECK (status IN ('pending', 'confirmed', 'ready', 'collected', 'cancelled'));

ALTER TABLE reservations ADD CONSTRAINT check_payment_status_values
  CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));

ALTER TABLE reservations ADD CONSTRAINT check_total_amount_positive
  CHECK (total_amount > 0);

-- reservation_items
ALTER TABLE reservation_items ADD CONSTRAINT check_quantity_positive
  CHECK (quantity_requested > 0);

ALTER TABLE reservation_items ADD CONSTRAINT check_allocated_valid
  CHECK (
    quantity_allocated IS NULL OR
    (quantity_allocated >= 0 AND quantity_allocated <= quantity_requested)
  );

-- ratings_reviews
ALTER TABLE ratings_reviews ADD CONSTRAINT check_rating_range
  CHECK (rating >= 1 AND rating <= 5);

-- pharmacy_staff
ALTER TABLE pharmacy_staff ADD CONSTRAINT check_role_values
  CHECK (role IN ('staff', 'manager', 'owner'));

-- admin_users
ALTER TABLE admin_users ADD CONSTRAINT check_admin_level
  CHECK (admin_level IN ('super_admin', 'regional_admin', 'moderator'));
```

### 6.3 NOT NULL CONSTRAINTS

| Column | Table | Why |
|--------|-------|-----|
| name | pharmacies, medicines | Core identifiers |
| id | All tables | Primary keys |
| user_id | profiles, reservations | Must reference user |
| pharmacy_id | pharmacy_medicines, reservations, pharmacy_staff | Must reference pharmacy |
| medicine_id | pharmacy_medicines, medicines | Must reference medicine |
| quantity_in_stock | pharmacy_medicines | Inventory must be tracked |
| price_per_unit | pharmacy_medicines | Pricing required |
| status | reservations | Order state required |
| payment_status | reservations | Payment tracking required |
| quantity_requested | reservation_items | Item quantity required |
| unit_price | reservation_items | Price snapshot required |
| full_name | profiles, pharmacy_staff | Identity required |

### 6.4 Recommended Indexes

```sql
-- Search & Filtering
CREATE INDEX idx_pharmacies_name ON pharmacies(name);
CREATE INDEX idx_pharmacies_status ON pharmacies(status);
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_generic_name ON medicines(generic_name);
CREATE INDEX idx_medicines_requires_prescription ON medicines(requires_prescription);

-- Foreign Key Performance
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_pharmacy_id ON reservations(pharmacy_id);
CREATE INDEX idx_reservation_items_reservation_id ON reservation_items(reservation_id);
CREATE INDEX idx_pharmacy_medicines_pharmacy_id ON pharmacy_medicines(pharmacy_id);
CREATE INDEX idx_pharmacy_medicines_medicine_id ON pharmacy_medicines(medicine_id);
CREATE INDEX idx_ratings_reviews_pharmacy_id ON ratings_reviews(pharmacy_id);
CREATE INDEX idx_pharmacy_staff_pharmacy_id ON pharmacy_staff(pharmacy_id);

-- Date-based Queries
CREATE INDEX idx_reservations_reservation_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);
CREATE INDEX idx_reservation_status_history_created_at ON reservation_status_history(created_at);

-- Location-based Queries (if using PostGIS)
CREATE INDEX idx_pharmacies_location ON pharmacies USING GIST(ll_to_earth(latitude, longitude));

-- Status Filtering
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservation_items_medicine_id ON reservation_items(medicine_id);
CREATE INDEX idx_pharmacy_medicines_is_available ON pharmacy_medicines(is_available);

-- Composite Indexes for Common Query Patterns
CREATE INDEX idx_pharmacy_medicines_pharmacy_medicine ON pharmacy_medicines(pharmacy_id, medicine_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_ratings_reviews_pharmacy_user ON ratings_reviews(pharmacy_id, user_id);
```

### 6.5 Data Validation & Trigger Logic

```sql
-- Auto-generate timestamps on insert
CREATE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER profiles_update_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Similar triggers for: pharmacies, medicines, pharmacy_medicines, reservations, ...

-- Auto-create profile when user signs up (optional, can be done in app)
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, COALESCE(new.user_metadata->>'role', 'user'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-generate pickup code for new reservations
CREATE FUNCTION public.generate_pickup_code()
RETURNS trigger AS $$
BEGIN
  IF new.pickup_code IS NULL THEN
    new.pickup_code := 'RX-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYMMDDHH24MI') || 
                       LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_generate_pickup_code
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION public.generate_pickup_code();
```

---

## 7. Final Recommended Supabase Database Schema

### 7.1 Complete Table Definitions

```sql
-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- profiles: Extended user profile (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    medical_conditions TEXT,
    allergies TEXT,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'pharmacy_staff', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_phone_format CHECK (phone_number ~ '^\+?[0-9\s\-()]{7,}$'),
    CONSTRAINT check_dob_past CHECK (date_of_birth < CURRENT_DATE)
);

CREATE INDEX idx_profiles_national_id ON profiles(national_id);
CREATE INDEX idx_profiles_phone ON profiles(phone_number);
CREATE INDEX idx_profiles_role ON profiles(role);

-- pharmacies: Multi-pharmacy locations
CREATE TABLE IF NOT EXISTS public.pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    owner VARCHAR(255),
    governorate VARCHAR(100),
    street VARCHAR(255),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    opening_time TIME,
    closing_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended', 'closed')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_hours_valid CHECK (
        opening_time IS NULL OR closing_time IS NULL OR opening_time < closing_time
    ),
    CONSTRAINT check_lat_lon CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude IS NOT NULL AND longitude IS NOT NULL AND
         latitude >= -90 AND latitude <= 90 AND
         longitude >= -180 AND longitude <= 180)
    )
);

CREATE INDEX idx_pharmacies_name ON pharmacies(name);
CREATE INDEX idx_pharmacies_status ON pharmacies(status);
CREATE INDEX idx_pharmacies_is_active ON pharmacies(is_active);
CREATE INDEX idx_pharmacies_license ON pharmacies(license_number);

-- medicines: Medicine master catalog
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    requires_prescription BOOLEAN DEFAULT FALSE,
    manufacturer VARCHAR(255),
    batch_number VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_generic_name ON medicines(generic_name);
CREATE INDEX idx_medicines_dosage ON medicines(dosage);
CREATE INDEX idx_medicines_requires_prescription ON medicines(requires_prescription);

-- medicine_categories: Medicine classification
CREATE TABLE IF NOT EXISTS public.medicine_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- medicine_category_mapping: Many-to-Many for medicines and categories
CREATE TABLE IF NOT EXISTS public.medicine_category_mapping (
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES medicine_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (medicine_id, category_id)
);

-- pharmacy_medicines: Inventory bridge (Pharmacy × Medicine with pricing)
CREATE TABLE IF NOT EXISTS public.pharmacy_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    price_per_unit NUMERIC(10,2) NOT NULL,
    expiry_date DATE,
    reorder_level INT DEFAULT 10,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pharmacy_id, medicine_id),
    CONSTRAINT check_quantity_non_negative CHECK (quantity_in_stock >= 0),
    CONSTRAINT check_price_positive CHECK (price_per_unit > 0)
);

CREATE INDEX idx_pharmacy_medicines_pharmacy_id ON pharmacy_medicines(pharmacy_id);
CREATE INDEX idx_pharmacy_medicines_medicine_id ON pharmacy_medicines(medicine_id);
CREATE INDEX idx_pharmacy_medicines_is_available ON pharmacy_medicines(is_available);
CREATE INDEX idx_pharmacy_medicines_quantity_low ON pharmacy_medicines(quantity_in_stock) 
  WHERE quantity_in_stock < reorder_level;

-- ============================================================================
-- RESERVATION TABLES
-- ============================================================================

-- reservations: Patient reservations/orders
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
    reservation_date DATE NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'collected', 'cancelled')),
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    notes TEXT,
    estimated_ready_date DATE,
    actual_pickup_date TIMESTAMPTZ,
    pickup_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_total_amount_positive CHECK (total_amount > 0)
);

CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_pharmacy_id ON reservations(pharmacy_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);
CREATE INDEX idx_reservations_pickup_code ON reservations(pickup_code);

-- reservation_items: Line items within a reservation
CREATE TABLE IF NOT EXISTS public.reservation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    pharmacy_medicine_id UUID REFERENCES pharmacy_medicines(id) ON DELETE SET NULL,
    quantity_requested INT NOT NULL,
    quantity_allocated INT DEFAULT 0,
    unit_price NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantity_positive CHECK (quantity_requested > 0),
    CONSTRAINT check_allocated_valid CHECK (
        quantity_allocated IS NULL OR
        (quantity_allocated >= 0 AND quantity_allocated <= quantity_requested)
    )
);

CREATE INDEX idx_reservation_items_reservation_id ON reservation_items(reservation_id);
CREATE INDEX idx_reservation_items_medicine_id ON reservation_items(medicine_id);
CREATE INDEX idx_reservation_items_pharmacy_medicine_id ON reservation_items(pharmacy_medicine_id);

-- reservation_status_history: Audit trail for status changes
CREATE TABLE IF NOT EXISTS public.reservation_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservation_status_history_reservation_id ON reservation_status_history(reservation_id);
CREATE INDEX idx_reservation_status_history_created_at ON reservation_status_history(created_at);

-- ============================================================================
-- STAFF & ADMIN TABLES
-- ============================================================================

-- pharmacy_staff: Pharmacy employees
CREATE TABLE IF NOT EXISTS public.pharmacy_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'owner')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pharmacy_id, user_id)
);

CREATE INDEX idx_pharmacy_staff_pharmacy_id ON pharmacy_staff(pharmacy_id);
CREATE INDEX idx_pharmacy_staff_user_id ON pharmacy_staff(user_id);
CREATE INDEX idx_pharmacy_staff_email ON pharmacy_staff(email);
CREATE INDEX idx_pharmacy_staff_role ON pharmacy_staff(role);

-- admin_users: System administrators
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    admin_level VARCHAR(50) NOT NULL DEFAULT 'super_admin' CHECK (admin_level IN ('super_admin', 'regional_admin', 'moderator')),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_admin_level ON admin_users(admin_level);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

-- ============================================================================
-- FEEDBACK & RATINGS
-- ============================================================================

-- ratings_reviews: User ratings for pharmacies/medicines
CREATE TABLE IF NOT EXISTS public.ratings_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
    medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ratings_reviews_reservation_id ON ratings_reviews(reservation_id);
CREATE INDEX idx_ratings_reviews_user_id ON ratings_reviews(user_id);
CREATE INDEX idx_ratings_reviews_pharmacy_id ON ratings_reviews(pharmacy_id);
CREATE INDEX idx_ratings_reviews_medicine_id ON ratings_reviews(medicine_id);
CREATE INDEX idx_ratings_reviews_rating ON ratings_reviews(rating);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- notifications: System/application notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity VARCHAR(100),
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

-- audit_logs: Immutable system audit trail
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- User reservation summary
CREATE OR REPLACE VIEW public.v_user_reservations AS
SELECT
    r.id,
    r.user_id,
    p.full_name,
    p.phone_number,
    ph.name AS pharmacy_name,
    ph.phone AS pharmacy_phone,
    r.reservation_date,
    r.status,
    r.total_amount,
    r.payment_status,
    COUNT(ri.id) AS items_count,
    r.pickup_code,
    r.created_at
FROM reservations r
JOIN profiles p ON r.user_id = p.id
JOIN pharmacies ph ON r.pharmacy_id = ph.id
LEFT JOIN reservation_items ri ON r.id = ri.reservation_id
GROUP BY r.id, p.id, ph.id;

-- Pharmacy inventory summary
CREATE OR REPLACE VIEW public.v_pharmacy_inventory AS
SELECT
    pm.id,
    ph.id AS pharmacy_id,
    ph.name AS pharmacy_name,
    m.id AS medicine_id,
    m.name AS medicine_name,
    m.dosage,
    m.unit,
    pm.quantity_in_stock,
    pm.price_per_unit,
    pm.reorder_level,
    CASE
        WHEN pm.quantity_in_stock = 0 THEN 'out-of-stock'
        WHEN pm.quantity_in_stock < pm.reorder_level THEN 'low-stock'
        ELSE 'in-stock'
    END AS stock_status,
    pm.is_available,
    pm.expiry_date,
    pm.updated_at
FROM pharmacy_medicines pm
JOIN pharmacies ph ON pm.pharmacy_id = ph.id
JOIN medicines m ON pm.medicine_id = m.id
ORDER BY ph.name, m.name;

-- Pharmacy reservation summary
CREATE OR REPLACE VIEW public.v_pharmacy_reservations AS
SELECT
    r.id,
    r.pickup_code,
    r.user_id,
    p.full_name AS patient_name,
    p.phone_number AS patient_phone,
    r.pharmacy_id,
    ph.name AS pharmacy_name,
    STRING_AGG(m.name || ' (' || ri.quantity_requested || ')', ', ') AS medicines,
    r.total_amount,
    r.status,
    r.reservation_date,
    r.created_at
FROM reservations r
JOIN profiles p ON r.user_id = p.id
JOIN pharmacies ph ON r.pharmacy_id = ph.id
LEFT JOIN reservation_items ri ON r.id = ri.reservation_id
LEFT JOIN medicines m ON ri.medicine_id = m.id
GROUP BY r.id, p.id, ph.id;

-- Pharmacy ratings summary
CREATE OR REPLACE VIEW public.v_pharmacy_ratings AS
SELECT
    ph.id,
    ph.name,
    COUNT(rr.id) AS total_ratings,
    ROUND(AVG(rr.rating)::numeric, 2) AS average_rating,
    SUM(CASE WHEN rr.rating = 5 THEN 1 ELSE 0 END) AS five_star_count,
    SUM(CASE WHEN rr.rating = 4 THEN 1 ELSE 0 END) AS four_star_count,
    SUM(CASE WHEN rr.rating = 3 THEN 1 ELSE 0 END) AS three_star_count,
    SUM(CASE WHEN rr.rating = 2 THEN 1 ELSE 0 END) AS two_star_count,
    SUM(CASE WHEN rr.rating = 1 THEN 1 ELSE 0 END) AS one_star_count,
    MAX(rr.created_at) AS last_review_date
FROM pharmacies ph
LEFT JOIN ratings_reviews rr ON ph.id = rr.pharmacy_id
GROUP BY ph.id, ph.name;
```

---

## 8. Database Migration / Implementation Plan

### 8.1 Execution Order (Safe for Supabase)

#### **Phase 1: Core Foundation (No Dependencies)**
1. ✅ **Create `pharmacies` table**
   ```
   Why first: Independent, needed by other tables
   No FK dependencies
   Can be populated with test data
   ```

2. ✅ **Create `medicines` table**
   ```
   Why: Independent, needed by pharmacy_medicines
   Can create medicine master data
   ```

3. ✅ **Create `medicine_categories` table**
   ```
   Why: Optional reference for medicines
   No FK dependencies
   ```

4. ✅ **Create `profiles` table**
   ```
   Why: Extends auth.users via FK
   Needed for reservations
   Can add auto-creation trigger
   ```

---

#### **Phase 2: Bridge & Inventory (Depends on Phase 1)**
5. ✅ **Create `pharmacy_medicines` table**
   ```
   Depends on: pharmacies, medicines
   Action: Link pharmacies to medicines with pricing/stock
   ```

6. ✅ **Create `medicine_category_mapping` table**
   ```
   Depends on: medicines, medicine_categories
   Action: Many-to-many for categorization
   ```

---

#### **Phase 3: Reservation System (Depends on Phase 1 & 2)**
7. ✅ **Create `reservations` table**
   ```
   Depends on: profiles, pharmacies
   Action: Patient orders/bookings
   Add pickup_code generation trigger
   ```

8. ✅ **Create `reservation_items` table**
   ```
   Depends on: reservations, medicines, pharmacy_medicines
   Action: Line items for each reservation
   ```

9. ✅ **Create `reservation_status_history` table**
   ```
   Depends on: reservations
   Action: Audit trail for status changes
   Add trigger to auto-log on reservation update
   ```

---

#### **Phase 4: Staff & Admin (Depends on auth.users)**
10. ✅ **Create `pharmacy_staff` table**
    ```
    Depends on: pharmacies, auth.users
    Action: Link employees to pharmacies
    ```

11. ✅ **Create `admin_users` table**
    ```
    Depends on: auth.users
    Action: System administrators
    ```

---

#### **Phase 5: Ratings & Notifications (Depends on Phase 1-3)**
12. ✅ **Create `ratings_reviews` table**
    ```
    Depends on: reservations, profiles, pharmacies, medicines
    Action: User feedback system
    ```

13. ✅ **Create `notifications` table**
    ```
    Depends on: auth.users
    Action: Push notification history
    ```

---

#### **Phase 6: Audit & Compliance (Optional)**
14. ⚠️ **Create `audit_logs` table**
    ```
    Depends on: auth.users (optional)
    Action: Immutable audit trail
    Optional if compliance not required yet
    ```

---

#### **Phase 7: Enable RLS & Security**
15. ✅ **Enable Row Level Security (RLS) on all user-data tables**
    ```
    Tables to enable: profiles, pharmacies, pharmacy_medicines, 
                     reservations, reservation_items, ratings_reviews,
                     pharmacy_staff, admin_users, notifications
    
    Apply RLS policies per role (Patient, Staff, Admin)
    Test policies thoroughly before production
    ```

---

#### **Phase 8: Create Views & Helpers**
16. ✅ **Create public views for common queries**
    ```
    v_user_reservations
    v_pharmacy_inventory
    v_pharmacy_reservations
    v_pharmacy_ratings
    ```

---

#### **Phase 9: Create Triggers & Functions**
17. ✅ **Create application logic triggers**
    ```
    update_timestamp() - Auto-update updated_at
    handle_new_user() - Auto-create profile on signup
    generate_pickup_code() - Auto-generate reservation codes
    log_reservation_status_change() - Audit trail
    ```

---

#### **Phase 10: Add Indexes (Performance Tuning)**
18. ✅ **Create indexes** (Already documented in section 6.4)
    ```
    Search indexes on name fields
    FK indexes for JOINs
    Status/date indexes for filtering
    Composite indexes for common patterns
    ```

---

### 8.2 Detailed SQL Execution Checklist

```
Phase 1: ✅ Execute CREATE TABLE statements for: 
          → pharmacies
          → medicines
          → medicine_categories
          → profiles

Phase 2: ✅ Execute CREATE TABLE statements for:
          → pharmacy_medicines (with FK constraints)
          → medicine_category_mapping

Phase 3: ✅ Execute CREATE TABLE statements for:
          → reservations
          → reservation_items
          → reservation_status_history

Phase 4: ✅ Execute CREATE TABLE statements for:
          → pharmacy_staff
          → admin_users

Phase 5: ✅ Execute CREATE TABLE statements for:
          → ratings_reviews
          → notifications

Phase 6: ✅ Execute CREATE TABLE for:
          → audit_logs (optional)

Phase 7: ✅ Run ALTER TABLE ... ENABLE ROW LEVEL SECURITY
          ✅ Create RLS policies for each table & role
          ✅ Test RLS policies with test users

Phase 8: ✅ Create views
          ✅ Grant SELECT on public views to authenticated role

Phase 9: ✅ Create functions (update_timestamp, etc.)
          ✅ Create triggers

Phase 10: ✅ Create indexes
           ✅ Analyze query performance
```

---

## 9. Open Questions / Ambiguities

### 9.1 Authentication & Role Management

**Question:** How are Pharmacy Staff and Admins created and authenticated?

**Current State:**
- User signup works (UserSignUp.jsx)
- PharmacySignUp.jsx and AdminSignUp.jsx are empty stubs
- No clear auth flow for pharmacy staff or admins

**Implications:**
- Do pharmacy staff use their own auth.users account?
- Are they invited by pharmacy owner with a code?
- Or created directly by admin?

**Recommendation:**
✅ Implement pharmacy staff provisioning:
1. Admin creates pharmacy in PharmacyManagement
2. Admin invites staff with email
3. Staff receives signup link with pre-filled pharmacy_id
4. Staff creates account → triggers pharmacy_staff record creation

---

### 9.2 Prescription Handling

**Question:** How are prescription requirements enforced?

**Current State:**
- `medicines.requires_prescription` exists in data model
- ReservationModal shows warning if prescription required
- No actual prescription document storage or validation

**Implications:**
- Should prescription be verified before fulfilling?
- Where are prescription documents stored (Supabase Storage)?
- Does staff need to mark prescription as verified?

**Recommendation:**
⚠️ Create `prescription_uploads` table if needed:
```sql
CREATE TABLE prescription_uploads (
    id UUID PRIMARY KEY,
    reservation_id UUID REFERENCES reservations,
    document_url TEXT, -- Path in Supabase Storage
    verified_by UUID REFERENCES pharmacy_staff(user_id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 9.3 Reservation Workflow Clarity

**Question:** What are the exact status transitions for reservations?

**Current State:**
- Code uses: pending, confirmed, ready, collected, cancelled
- UI shows: pending, ready, collected
- Pharmacy staff can update status

**Ambiguities:**
- Do users manually transition pending → confirmed or is it automatic?
- Can staff skip from pending directly to ready?
- Who can cancel (user, staff, both)?

**Recommendation:**
✅ Implement state machine validation:
```sql
-- Valid transitions
pending → confirmed (staff confirms availability)
confirmed → ready (staff prepares medicine)
ready → collected (customer picks up)
[any] → cancelled (user or staff can cancel)
```

---

### 9.4 Multi-Pharmacy Platform Scope

**Question:** Are users restricted to one pharmacy, or can they place reservations at multiple pharmacies?

**Current State:**
- `reservations.pharmacy_id` is singular
- Users can reserve from any pharmacy (design supports it)

**Design Decision:**
✅ Current design supports:
- Multiple simultaneous reservations at different pharmacies
- Checkout/orders consolidation could be a future feature
- Each pharmacy manages its own fulfillment

---

### 9.5 Payment Integration

**Question:** How are payments processed?

**Current State:**
- `reservations.payment_status` exists (unpaid, paid, refunded)
- No payment gateway integration visible
- No payment method table

**Implications:**
- Is payment required before reservation or at pickup?
- Which payment methods accepted (card, cash, online)?
- Is this integrated with a payment processor (Stripe, Fawry, etc.)?

**Recommendation:**
⚠️ Create `payment_methods` and `payment_transactions` tables if payment processing needed:
```sql
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles,
    method_type VARCHAR CHECK (method_type IN ('card', 'cash', 'wallet')),
    ...
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY,
    reservation_id UUID REFERENCES reservations,
    amount NUMERIC,
    status VARCHAR,
    ...
);
```

---

### 9.6 Inventory Deduction Logic

**Question:** When is inventory reduced from `pharmacy_medicines.quantity_in_stock`?

**Current State:**
- Reservation created with items but inventory not automatically reduced
- No trigger or background job documented

**Implications:**
- Is inventory held when reservation pending, or only when confirmed/ready?
- What happens if another customer reserves the same medicine?
- Who resolves conflicts if inventory runs out?

**Recommendation:**
✅ Implement inventory reservation logic:
1. On reservation creation → check stock available
2. On status change to 'confirmed' → decrement stock (hard reserve)
3. On status change to 'cancelled' → increment stock back
4. On status change to 'collected' → finalize deduction

---

### 9.7 Notification Triggers

**Question:** What events trigger notifications?

**Current State:**
- `notifications` table exists
- No triggers or background jobs documented

**Use Cases Inferred:**
- Reservation created → confirm to user
- Reservation ready → notify customer
- Low stock → notify pharmacy staff
- New reservation → notify pharmacy
- Reservation cancelled → notify both parties

**Recommendation:**
✅ Implement notification events (could use Supabase Functions or app-level):
```
reservation.created → Send to user & pharmacy
reservation.status = 'ready' → Send to user
pharmacy_medicines.quantity < reorder_level → Send to staff
reservation.cancelled → Send to both parties
```

---

### 9.8 Admin Features Scope

**Question:** What specific admin tasks are managed?

**Current State:**
- Admin pages stubbed (AdminLogin, AdminSignUp not implemented)
- ManageUser, PharmacyManagement pages exist with mock data

**Inferred Admin Tasks:**
1. Approve/suspend pharmacies
2. Manage user accounts
3. View system-wide analytics
4. Handle disputes/refunds
5. Generate reports

**Recommendation:**
✅ Admin should have access to all data with RLS bypass
✅ All admin actions should be logged to `audit_logs`

---

### 9.9 Search & Filtering Performance

**Question:** How to optimize medicine search for large catalogs (1000s of medicines, multiple pharmacies)?

**Current State:**
- `MedicineBrowse.jsx` filters client-side after fetching
- Limits to available items (quantity > 0)

**Potential Issues:**
- Large result sets could be slow
- Sorting/pagination needed as scale grows

**Recommendation:**
✅ Implement server-side search:
```sql
-- Full-text search index
CREATE INDEX idx_medicines_fts ON medicines 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(generic_name, '')));

-- Recommend pagination in API queries
SELECT ... FROM pharmacy_medicines 
WHERE ... 
ORDER BY ...
LIMIT 20 OFFSET 0;
```

---

### 9.10 Data Retention & Soft Deletes

**Question:** Should deleted records be soft-deleted or hard-deleted?

**Current State:**
- `is_active` flags exist on pharmacies and medicines
- No soft delete pattern documented

**Considerations:**
- Audit trail needs historical data
- Foreign keys reference deleted entities
- GDPR may require hard deletion of user data

**Recommendation:**
✅ Use combination approach:
- **Hard delete:** Audit-insensitive data (temp records)
- **Soft delete (is_active):** Pharmacies, medicines, staff (business reversibility)
- **Cascade delete:** Reservations when user deleted per privacy
- **Archive:** Move old audit logs to archive table after retention period

---

## Summary & Next Steps

### Recommended Implementation Priority

1. **Immediate (Week 1):** Phases 1-3 (Core tables, Reservations, Inventory)
2. **Short-term (Week 2):** Phases 4-5 (Staff, Ratings)
3. **Medium-term (Week 3-4):** Phases 7-10 (RLS, Triggers, Performance)
4. **Long-term:** Phase 6 (Audit logs), Optional enhancements (Prescriptions, Payments)

### Critical Success Factors

✅ Implement RLS policies **before** production
✅ Test user isolation thoroughly
✅ Create data validation triggers early
✅ Plan for inventory management conflicts
✅ Document admin operations for audit compliance
✅ Monitor query performance with indexes
✅ Implement backup/recovery strategy

---

## Appendix: Quick Reference

### Table Count by Phase
- **Phase 1:** 4 tables (pharmacies, medicines, medicine_categories, profiles)
- **Phase 2:** 2 tables (pharmacy_medicines, medicine_category_mapping)
- **Phase 3:** 3 tables (reservations, reservation_items, reservation_status_history)
- **Phase 4:** 2 tables (pharmacy_staff, admin_users)
- **Phase 5:** 2 tables (ratings_reviews, notifications)
- **Phase 6:** 1 table (audit_logs)
- **Total: 16 tables** (including 4 views)

### RLS Policy Count
- **profiles:** 3 policies (patient read/write own, admin bypass)
- **pharmacies:** 2 policies (public read, admin full)
- **medicines:** 2 policies (public read, admin full)
- **pharmacy_medicines:** 4 policies (public read, staff read own, staff write own, admin full)
- **reservations:** 4 policies (patient CRUD own, staff manage own pharmacy, admin full)
- **reservation_items:** 3 policies (patient read own, staff read own pharmacy, admin full)
- **pharmacy_staff:** 3 policies (read own, admin full)
- **admin_users:** 2 policies (admin read, super admin full)
- **ratings_reviews:** 3 policies (user CRUD own, admin full)
- **notifications:** 3 policies (user read own, admin full)
- **Total: ~29 RLS policies**

---

**Report Generated:** 2026-07-08
**Database Target:** Supabase (PostgreSQL)
**Project:** PharmaCare - Multi-Pharmacy Inventory & Reservation Platform
