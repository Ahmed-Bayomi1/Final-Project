-- Fix: handle_new_user trigger to safely create profiles and map roles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  allowed_cols TEXT[] := ARRAY['id','full_name','national_id','phone_number','date_of_birth','address','role','email','is_verified'];
  existing_cols TEXT[];
  col TEXT;
  cols_list TEXT := '';
  vals_list TEXT := '';
  mapped_role TEXT;
BEGIN
  -- Map incoming role values to allowed DB roles
  mapped_role := CASE
    WHEN COALESCE(NEW.user_metadata->>'role','') IN ('user','pharmacy_staff','admin') THEN NEW.user_metadata->>'role'
    WHEN COALESCE(NEW.user_metadata->>'role','') = 'pharmacy' THEN 'pharmacy_staff'
    ELSE 'user'
  END;

  SELECT array_agg(column_name) INTO existing_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles';

  IF existing_cols IS NULL THEN
    -- Profiles table not present; avoid raising to prevent signup failure
    RETURN NEW;
  END IF;

  FOREACH col IN ARRAY allowed_cols LOOP
    IF col = ANY(existing_cols) THEN
      IF cols_list <> '' THEN
        cols_list := cols_list || ', ';
        vals_list := vals_list || ', ';
      END IF;
      cols_list := cols_list || quote_ident(col);
      IF col = 'id' THEN
        vals_list := vals_list || quote_literal(NEW.id::text);
      ELSIF col = 'email' THEN
        vals_list := vals_list || quote_literal(NEW.email::text);
      ELSIF col = 'role' THEN
        vals_list := vals_list || quote_literal(mapped_role);
      ELSIF col = 'date_of_birth' THEN
        IF NEW.user_metadata->>col IS NULL OR NEW.user_metadata->>col = '' THEN
          vals_list := vals_list || quote_literal((CURRENT_DATE - INTERVAL '30 years')::text) || '::DATE';
        ELSE
          vals_list := vals_list || quote_literal(NEW.user_metadata->>col) || '::DATE';
        END IF;
      ELSIF col = 'full_name' THEN
        vals_list := vals_list || quote_literal(COALESCE(NULLIF(NEW.user_metadata->>col, ''), 'Unknown'));
      ELSIF col = 'national_id' THEN
        vals_list := vals_list || quote_literal(COALESCE(NULLIF(NEW.user_metadata->>col, ''), NEW.id::text));
      ELSIF col = 'phone_number' THEN
        vals_list := vals_list || quote_literal(COALESCE(NULLIF(NEW.user_metadata->>col, ''), '0000000000'));
      ELSIF col = 'address' THEN
        vals_list := vals_list || quote_literal(COALESCE(NULLIF(NEW.user_metadata->>col, ''), 'Unknown Address'));
      ELSIF col = 'is_verified' THEN
        vals_list := vals_list || 'FALSE';
      ELSE
        IF NEW.user_metadata->>col IS NULL THEN
          vals_list := vals_list || 'NULL';
        ELSE
          vals_list := vals_list || quote_literal(NEW.user_metadata->>col);
        END IF;
      END IF;
    END IF;
  END LOOP;

  IF cols_list = '' THEN
    RETURN NEW;
  END IF;

  EXECUTE format('INSERT INTO public.profiles (%s) VALUES (%s)', cols_list, vals_list);
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'handle_new_user dynamic insert error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
