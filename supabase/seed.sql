-- Données d'exemple Fatou Caisse

insert into public.products
  (id, name, category, sale_price, purchase_price, stock_quantity, low_stock_threshold)
values
  ('11111111-1111-4111-8111-111111111111', 'Attiéké', 'produit_africain', 65, 42, 12, 5),
  ('22222222-2222-4222-8222-222222222222', 'Jus de bissap', 'boisson', 35, 18, 8, 6),
  ('33333333-3333-4333-8333-333333333333', 'Ndolé poulet', 'plat', 180, 115, 4, 3),
  ('44444444-4444-4444-8444-444444444444', 'Plantain mûr', 'produit_africain', 55, 32, 2, 4)
on conflict (id) do nothing;

insert into public.sales
  (id, sale_type, total_amount, total_cost, sold_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'product', 70, 36, current_date),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'free', 250, 0, current_date - interval '1 day')
on conflict (id) do nothing;

insert into public.sale_items
  (id, sale_id, product_id, item_name, category, quantity, unit_price, purchase_unit_price, total_amount)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'Jus de bissap', 'boisson', 2, 35, 18, 70),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', null, 'Service restaurant', 'plat', 1, 250, null, 250)
on conflict (id) do nothing;

insert into public.expenses
  (id, category, amount, note, expense_date)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'transport', 120, 'Livraison produits', current_date),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'achat_marchandise', 650, 'Réassort boissons', current_date - interval '1 day')
on conflict (id) do nothing;

insert into public.money_transfers
  (id, customer_name, phone, network, amount_fcfa, amount_tl, commission, status, note, transfer_date)
values
  ('99999999-9999-4999-8999-999999999999', 'Grace M.', '+90 555 000 00 00', 'orange_money', 50000, 2750, 90, 'termine', 'Famille Douala', current_date)
on conflict (id) do nothing;

insert into public.settings
  (id, key, value)
values
  ('77777777-7777-4777-8777-777777777777', 'shop', '{"name":"Fatou Shop","currency":"TRY"}'::jsonb)
on conflict (id) do nothing;
