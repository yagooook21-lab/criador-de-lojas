
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS card_bin text DEFAULT NULL;

UPDATE public.orders SET card_bin = '411111' WHERE order_number = 'PED-1002';
UPDATE public.orders SET card_bin = '520083' WHERE order_number = 'PED-1003';
UPDATE public.orders SET card_bin = '378282' WHERE order_number = 'PED-1004';
UPDATE public.orders SET card_bin = '636297' WHERE order_number = 'PED-1005';
UPDATE public.orders SET card_bin = '601100' WHERE order_number = 'PED-1006';
UPDATE public.orders SET card_bin = '352800' WHERE order_number = 'PED-1008';
UPDATE public.orders SET card_bin = '361234' WHERE order_number = 'PED-1009';
UPDATE public.orders SET card_bin = '606282' WHERE order_number = 'PED-1012';
