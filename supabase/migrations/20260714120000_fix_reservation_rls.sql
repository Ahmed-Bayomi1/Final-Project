-- Ensure authenticated users can manage their own reservations and items
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

CREATE POLICY "Users can view own reservations"
  ON public.reservations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
  ON public.reservations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations"
  ON public.reservations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reservation items"
  ON public.reservation_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id = reservation_items.reservation_id
        AND r.user_id = auth.uid()
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

CREATE POLICY "Users can update own reservation items"
  ON public.reservation_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id = reservation_items.reservation_id
        AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id = reservation_items.reservation_id
        AND r.user_id = auth.uid()
    )
  );
