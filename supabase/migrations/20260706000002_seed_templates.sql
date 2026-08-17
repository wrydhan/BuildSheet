-- CarStory — seed the initial template library (build spec §5 + §9 step 5).
-- Templates are style definitions (not user data): readable by everyone,
-- written only by the service role. Seeding here (rather than seed.sql) so the
-- library ships with the schema to every environment, not just local resets.
--
-- Fixed UUIDs + upsert make this idempotent and safe to re-run: redeploying
-- updates a template's design/metadata in place without creating duplicates or
-- orphaning posters that reference it.

insert into public.templates
  (id, name, style, text_capacity, callout_count, image_mode, mood, is_flexible_fallback, layout)
values
  (
    '11111111-1111-1111-1111-111111111101',
    'Magazine Cover', 'magazine_cover', 'medium', 4, 'hero',
    array['editorial', 'bold', 'feature'], false,
    '{
      "palette": {"bg":"#0b0b0c","surface":"#151517","text":"#ffffff","muted":"#a0a0a5","accent":"#e5484d"},
      "fonts": {"display":"Archivo Black, Impact, sans-serif","body":"Inter, system-ui, sans-serif"},
      "imageFrame": {"shape":"full-bleed","position":"background"},
      "sections": {"specTable": true, "callouts": true, "narration": true}
    }'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    '90s JDM', '90s_jdm', 'medium', 5, 'hero',
    array['retro', 'street', 'bold'], false,
    '{
      "palette": {"bg":"#0a0e1a","surface":"#111a2e","text":"#f2f5ff","muted":"#8aa0c8","accent":"#ff2d55"},
      "fonts": {"display":"Bebas Neue, Oswald, sans-serif","body":"Inter, system-ui, sans-serif"},
      "imageFrame": {"shape":"framed","position":"top"},
      "sections": {"specTable": true, "callouts": true, "narration": true}
    }'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'Modern Minimal', 'modern_minimal', 'low', 3, 'hero',
    array['clean', 'calm', 'minimal'], false,
    '{
      "palette": {"bg":"#fafafa","surface":"#ffffff","text":"#101012","muted":"#6a6a70","accent":"#111827"},
      "fonts": {"display":"Inter, system-ui, sans-serif","body":"Inter, system-ui, sans-serif"},
      "imageFrame": {"shape":"inset","position":"top"},
      "sections": {"specTable": true, "callouts": false, "narration": true}
    }'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'Infographic Deep Dive', 'infographic_deep_dive', 'high', 8, 'detail',
    array['technical', 'data', 'detailed'], false,
    '{
      "palette": {"bg":"#0e1012","surface":"#181b1f","text":"#eef1f4","muted":"#8b939c","accent":"#22d3ee"},
      "fonts": {"display":"Space Grotesk, sans-serif","body":"Inter, system-ui, sans-serif"},
      "imageFrame": {"shape":"framed","position":"right"},
      "sections": {"specTable": true, "callouts": true, "narration": true}
    }'::jsonb
  ),
  -- The flexible fallback: high capacity, many slots, a detail image mode that
  -- degrades gracefully whether there is a full photo, a crop, or none.
  (
    '11111111-1111-1111-1111-1111111111ff',
    'Flexible Feature', 'flexible', 'high', 6, 'detail',
    array['versatile', 'neutral'], true,
    '{
      "palette": {"bg":"#0b0b0c","surface":"#17181a","text":"#f4f4f6","muted":"#9a9aa0","accent":"#e5a23d"},
      "fonts": {"display":"Inter, system-ui, sans-serif","body":"Inter, system-ui, sans-serif"},
      "imageFrame": {"shape":"framed","position":"top"},
      "sections": {"specTable": true, "callouts": true, "narration": true}
    }'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  style = excluded.style,
  text_capacity = excluded.text_capacity,
  callout_count = excluded.callout_count,
  image_mode = excluded.image_mode,
  mood = excluded.mood,
  is_flexible_fallback = excluded.is_flexible_fallback,
  layout = excluded.layout;
