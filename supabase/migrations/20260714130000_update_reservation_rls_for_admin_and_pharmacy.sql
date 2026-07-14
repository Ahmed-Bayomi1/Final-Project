-- Allow admins and pharmacy staff to view/update reservations and reservation items
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reservations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reservation_items TO authenticated;

DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can view own reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Users can create reservation items" ON public.reservation_items;
DROP POLICY IF EXISTS "Users can update own reservation items" ON public.reservation_items;

CREATE POLICY "Users, admins, and pharmacy staff can view reservations"
  ON public.reservations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'pharmacy', 'pharmacy_staff')
    )
    OR EXISTS (
      SELECT 1
      FROM public.pharmacy_staff ps
      WHERE ps.user_id = auth.uid()
        AND ps.pharmacy_id = reservations.pharmacy_id
    )
  );

CREATE POLICY "Users can create reservations"
  ON public.reservations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users, admins, and pharmacy staff can update reservations"
  ON public.reservations
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
    OR EXISTS (
      SELECT 1
      FROM public.pharmacy_staff ps
      WHERE ps.user_id = auth.uid()
        AND ps.pharmacy_id = reservations.pharmacy_id
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
    OR EXISTS (
      SELECT 1
      FROM public.pharmacy_staff ps
      WHERE ps.user_id = auth.uid()
        AND ps.pharmacy_id = reservations.pharmacy_id
    )
  );

CREATE POLICY "Users, admins, and pharmacy staff can view reservation items"
  ON public.reservation_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id = reservation_items.reservation_id
        AND (
          r.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'admin'
          )
          OR EXISTS (
            SELECT 1
            FROM public.pharmacy_staff ps
            WHERE ps.user_id = auth.uid()
              AND ps.pharmacy_id = r.pharmacy_id
          )
        )
    )
  );

CREATE POLICY "Users can create reservation items"
  ON public.reservation_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id = reservation_items.reservation_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users, admins, and pharmacy staff can update reservation items"
  ON public.reservation_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id = reservation_items.reservation_id
        AND (
          r.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'admin'
          )
          OR EXISTS (
            SELECT 1
            FROM public.pharmacy_staff ps
            WHERE ps.user_id = auth.uid()
              AND ps.pharmacy_id = r.pharmacy_id
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id = reservation_items.reservation_id
        AND (
          r.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'admin'
          )
          OR EXISTS (
            SELECT 1
            FROM public.pharmacy_staff ps
            WHERE ps.user_id = auth.uid()
              AND ps.pharmacy_id = r.pharmacy_id
          )
        )
    )
  );
