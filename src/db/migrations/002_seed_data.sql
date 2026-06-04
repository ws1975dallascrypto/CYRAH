-- Pickup / delivery types
INSERT INTO pickup_delivery_types (code, label, description, price_surcharge) VALUES
  ('same_day',  'Same Day',  'Pickup and delivery within the same day',       5.00),
  ('express',   'Express',   'Turnaround within 3–4 hours',                  10.00),
  ('scheduled', 'Scheduled', 'Choose your own pickup and delivery time slot',  0.00),
  ('standard',  'Standard',  'Regular 2–3 day turnaround',                    0.00)
ON CONFLICT (code) DO NOTHING;

-- Sample laundry services
INSERT INTO services (name, description, base_price) VALUES
  ('Wash & Fold',   'Clothes washed, dried and neatly folded',        12.00),
  ('Dry Cleaning',  'Professional dry cleaning for delicate items',   20.00),
  ('Ironing',       'Pressing and ironing of garments',                8.00),
  ('Duvet Cleaning','Full duvet and pillow cleaning service',         25.00)
ON CONFLICT DO NOTHING;
