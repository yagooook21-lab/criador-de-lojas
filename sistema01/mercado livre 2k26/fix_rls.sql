-- RLS Policies for orders
CREATE POLICY "Enable insert for anon users on orders" ON "public"."orders"
AS PERMISSIVE FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Enable update for anon users on orders" ON "public"."orders"
AS PERMISSIVE FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable select for anon users on orders" ON "public"."orders"
AS PERMISSIVE FOR SELECT
TO anon
USING (true);

-- RLS Policies for customers
CREATE POLICY "Enable insert for anon users on customers" ON "public"."customers"
AS PERMISSIVE FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Enable update for anon users on customers" ON "public"."customers"
AS PERMISSIVE FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable select for anon users on customers" ON "public"."customers"
AS PERMISSIVE FOR SELECT
TO anon
USING (true);
