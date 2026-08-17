-- CarStory — restyle the template library to the acid-brutalist / techwear look.
-- Each style becomes one solid panel color; text/frames are near-black ink
-- (or warm paper on the dark brick panel). The renderer (poster-view.tsx) uses
-- these palette colors + loaded Archivo/SpaceMono fonts; `fonts` here is legacy
-- and unused by the native renderer, kept only for schema shape.

update public.templates set layout = '{
  "palette": {"bg":"#e7a15a","surface":"#e7a15a","text":"#0e0e10","muted":"#0e0e10","accent":"#bf463b"},
  "fonts": {"display":"Archivo","body":"Archivo"},
  "imageFrame": {"shape":"framed","position":"top"},
  "sections": {"specTable": true, "callouts": true, "narration": true}
}'::jsonb where id = '11111111-1111-1111-1111-111111111101';

update public.templates set layout = '{
  "palette": {"bg":"#bf463b","surface":"#bf463b","text":"#f2efe6","muted":"#f2efe6","accent":"#e7a15a"},
  "fonts": {"display":"Archivo","body":"Archivo"},
  "imageFrame": {"shape":"framed","position":"top"},
  "sections": {"specTable": true, "callouts": true, "narration": true}
}'::jsonb where id = '11111111-1111-1111-1111-111111111102';

update public.templates set layout = '{
  "palette": {"bg":"#b7b2a8","surface":"#b7b2a8","text":"#0e0e10","muted":"#0e0e10","accent":"#bf463b"},
  "fonts": {"display":"Archivo","body":"Archivo"},
  "imageFrame": {"shape":"framed","position":"top"},
  "sections": {"specTable": true, "callouts": true, "narration": true}
}'::jsonb where id = '11111111-1111-1111-1111-111111111103';

update public.templates set layout = '{
  "palette": {"bg":"#8fa27c","surface":"#8fa27c","text":"#0e0e10","muted":"#0e0e10","accent":"#bf463b"},
  "fonts": {"display":"Archivo","body":"Archivo"},
  "imageFrame": {"shape":"framed","position":"top"},
  "sections": {"specTable": true, "callouts": true, "narration": true}
}'::jsonb where id = '11111111-1111-1111-1111-111111111104';

update public.templates set layout = '{
  "palette": {"bg":"#cdb38a","surface":"#cdb38a","text":"#0e0e10","muted":"#0e0e10","accent":"#bf463b"},
  "fonts": {"display":"Archivo","body":"Archivo"},
  "imageFrame": {"shape":"framed","position":"top"},
  "sections": {"specTable": true, "callouts": true, "narration": true}
}'::jsonb where id = '11111111-1111-1111-1111-1111111111ff';
