insert into services (id, name, price_inr, duration_minutes, category, description, is_active) values
('haircut', 'Haircut (Bal Cutting)', 50, 15, 'Haircut', 'Basic precision haircut', true),
('shaving', 'Shaving (Seving)', 30, 10, 'Beard', 'Clean razor shave', true),
('massage', 'Massage', 100, 20, 'Massage', 'Head & neck massage', true),
('bleach', 'Bleach', 150, 20, 'Facial', 'Skin brightening bleach', true),
('facial', 'Facial', 300, 45, 'Facial', 'Standard facial treatment', true),
('d-tan', 'D-Tan (Diten)', 250, 30, 'Facial', 'De-tanning treatment', true),
('hair-straightening', 'Hair Straightening', 1050, 90, 'Haircut', 'Permanent hair straightening', true),
('scrub', 'Scrub', 100, 20, 'Facial', 'Exfoliating face scrub', true),
('shaving-foam', 'Shaving Foam', 50, 10, 'Beard', 'Foam-assisted shave', true),
('hair-spa', 'Hair Spa', 300, 45, 'Spa', 'Deep conditioning spa', true),
('hair-color', 'Hair Color', 150, 30, 'Color', 'Basic hair coloring', true),
('massage-shahnaz', 'Massage Shahnaz', 350, 30, 'Massage', 'Premium Shahnaz massage', true),
('facial-shahnaz', 'Facial Shahnaz', 1200, 60, 'Facial', 'Premium Shahnaz facial', true),
('beard-setting', 'Beard Setting (Daadi)', 50, 10, 'Beard', 'Beard shape & styling', true),
('loreal-color', 'Loreal Color', 550, 45, 'Color', 'Professional Loreal coloring', true),
('steam-wash', 'Steam Wash', 300, 20, 'Spa', 'Steam-assisted hair wash', true)
on conflict (id) do update set
  name = excluded.name,
  price_inr = excluded.price_inr,
  duration_minutes = excluded.duration_minutes,
  category = excluded.category,
  description = excluded.description,
  is_active = excluded.is_active;
