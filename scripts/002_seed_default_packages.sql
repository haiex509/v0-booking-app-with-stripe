-- Insert default production packages
INSERT INTO production_packages (id, name, price, features, popular, is_active)
VALUES
  (
    'indie-pkg-001',
    'Indie',
    399,
    '["1 hr studio rental", "20 cinematic edits", "1 look/1 backdrop", "Online gallery"]'::jsonb,
    false,
    true
  ),
  (
    'feature-pkg-002',
    'Feature',
    799,
    '["3 hr production", "60 final stills", "2 looks + set changes", "Color-graded gallery", "MUA & stylist included"]'::jsonb,
    true,
    true
  ),
  (
    'blockbuster-pkg-003',
    'Blockbuster',
    1499,
    '["Full-day shoot", "120+ hero images", "Unlimited sets", "Behind-the-scenes 4K video", "Same-day teaser"]'::jsonb,
    false,
    true
  )
ON CONFLICT (id) DO NOTHING;
