# Supabase Signup Check Constraint Fix

## Problem Summary

You were getting this error during signup:
```
500 Internal Server Error: "new row for relation \"profiles\" violates check constraint \"profiles_role_check\""
```

**Root Causes:**
1. **Invalid role value** - `LandingPage.jsx` was sending `role: 'pharmacy'` but the database only accepts: `'user'`, `'pharmacy_staff'`, or `'admin'`
2. **Incomplete trigger function** - The Postgres trigger creating profiles wasn't extracting all required fields from user metadata
3. **Schema mismatch** - Signup was sending `phone` and `dob` but database columns are `phone_number` and `date_of_birth`

---

## Changes Made

### 1. Fixed `LandingPage.jsx` (Auth Modal)
✅ Changed `role: 'pharmacy'` → `role: 'pharmacy_staff'` (matches DB constraint)
✅ Changed field names: `phone` → `phone_number`, `dob` → `date_of_birth`
✅ Added role mapping to ensure only valid values are sent

**Before:**
```javascript
role: isPharmacy ? 'pharmacy' : 'user',  // ❌ 'pharmacy' is invalid!
phone,  // ❌ wrong field name
dob,    // ❌ wrong field name
```

**After:**
```javascript
const roleMapping = {
    'user': 'user',
    'pharmacy': 'pharmacy_staff',  // ✅ matches constraint
    'admin': 'admin'
};
role: mappedRole,  // ✅ validated
phone_number: phone,    // ✅ correct field name
date_of_birth: dob,     // ✅ correct field name
```

### 2. Fixed `UserSignUp.jsx`
✅ Changed field names to match schema: `phone` → `phone_number`, `dob` → `date_of_birth`

**Before:**
```javascript
phone,  // ❌ wrong field name
dob,    // ❌ wrong field name
```

**After:**
```javascript
phone_number: phone,    // ✅ correct field name
date_of_birth: dob,     // ✅ correct field name
```

### 3. Updated Postgres Trigger Function
✅ Now extracts ALL required fields from `user_metadata`
✅ Validates `role` value before inserting (prevents constraint violation)
✅ Includes error handling to prevent signup failures
✅ Provides safe defaults if fields are missing

---

## How to Apply the Supabase Trigger Update

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase Dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Copy & Run the Trigger SQL
1. Open the file: `SUPABASE_TRIGGER_UPDATE.sql` in your project
2. Copy the entire SQL code
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)

**Expected output:**
```
Success. No rows returned.
```

### Step 3: Verify the Trigger Works
Run this query to test:

```sql
-- Check that the trigger function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check that the trigger is attached
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- View the constraint definition
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' AND constraint_type = 'CHECK';
```

---

## Testing the Fix

### Test 1: User Signup (LandingPage.jsx)
1. Go to your landing page
2. Click "User Portal"
3. Sign up with test credentials:
   - Full Name: "Test User"
   - National ID: "12345678901"
   - Phone: "+20 123 456 7890"
   - DOB: "1995-01-15"
   - Address: "123 Main St, Cairo"
   - Email: "testuser@example.com"
   - Password: "Test123!@#"
4. Expected: Signup succeeds, redirects to login

### Test 2: Pharmacy Signup (LandingPage.jsx)
1. Go to your landing page
2. Click "Pharmacy Dashboard"
3. Sign up with test credentials (note: role should be 'pharmacy_staff')
4. Expected: Signup succeeds with `pharmacy_staff` role in database

### Test 3: Admin Signup (LandingPage.jsx)
1. Go to your landing page
2. Click "Admin Panel"
3. Sign up with test credentials
4. Expected: Signup succeeds with `admin` role in database

### Test 4: Verify Profile Creation
After signing up, run this in Supabase SQL Editor:

```sql
SELECT id, full_name, national_id, phone_number, date_of_birth, role, email 
FROM public.profiles 
WHERE email = 'testuser@example.com'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected output:**
```
id                   | full_name    | national_id    | phone_number       | date_of_birth | role | email
─────────────────────┼──────────────┼────────────────┼────────────────────┼───────────────┼──────┼──────────────────
[UUID]              | Test User    | 12345678901    | +20 123 456 7890   | 1995-01-15    | user | testuser@example.com
```

---

## Role Constraint Reference

Your database `profiles` table enforces this check constraint:

```sql
CHECK (role IN ('user', 'pharmacy_staff', 'admin'))
```

**Valid values:**
- `'user'` - Patient/customer role
- `'pharmacy_staff'` - Pharmacy employee (was incorrectly 'pharmacy' before)
- `'admin'` - System administrator

**Invalid values (will cause 500 error):**
- `'pharmacy'` ❌ (changed to 'pharmacy_staff')
- `'patient'` ❌
- `'customer'` ❌
- Any empty string or NULL ❌

---

## Debugging Checklist

If you still get errors, check:

1. **Verify field names match in all signup forms:**
   ```javascript
   data: {
       full_name,          // ✅ correct
       national_id,        // ✅ correct
       phone_number,       // ✅ correct (NOT 'phone')
       date_of_birth,      // ✅ correct (NOT 'dob')
       address,
       role,               // ✅ must be in ['user', 'pharmacy_staff', 'admin']
   }
   ```

2. **Check browser console for errors:**
   - Press F12 → Console tab
   - Look for any JavaScript errors during signup
   - Check Network tab → see the full error response

3. **Check Supabase logs:**
   - Supabase Dashboard → Logs
   - Filter for recent errors
   - Look for "profiles_role_check" violations

4. **Test trigger manually:**
   ```sql
   -- Simulate what the trigger does
   INSERT INTO public.profiles (id, full_name, national_id, phone_number, date_of_birth, address, role, email)
   VALUES (
       gen_random_uuid(),
       'Test Name',
       '12345',
       '01012345678',
       '1990-01-01'::DATE,
       '123 Main St',
       'user',  -- Valid value
       'test@example.com'
   );
   -- Should succeed ✅
   ```

5. **Check Row Level Security (RLS):**
   - Verify RLS is enabled on `profiles` table
   - Ensure signup user can insert into `profiles`
   - Run: `SELECT * FROM information_schema.table_constraints WHERE table_name='profiles'`

---

## Required Files Updated

1. ✅ `src/Pages/LandingPage.jsx` - Fixed role mapping and field names
2. ✅ `src/Pages/UserSignUp.jsx` - Fixed field names
3. ✅ `SUPABASE_TRIGGER_UPDATE.sql` - New/updated trigger function (must be applied in Supabase)

---

## Next Steps

1. **Apply the trigger update** (see "How to Apply" section above)
2. **Test all signup flows** (see "Testing the Fix" section)
3. **Monitor for errors** during signup via browser console and Supabase logs
4. **Verify profiles are created** with correct data after signup

Once all tests pass, your signup flow will work correctly without constraint violations!
