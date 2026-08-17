import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type TextCapacity = "low" | "medium" | "high";
export type ImageMode = "hero" | "detail";

/** Design tokens a poster renderer reads (mirror of @carstory/shared's type). */
export type TemplateLayout = {
  palette: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
  };
  fonts: { display: string; body: string };
  imageFrame: {
    shape: "full-bleed" | "framed" | "inset";
    position: "top" | "left" | "right" | "background";
  };
  sections: { specTable: boolean; callouts: boolean; narration: boolean };
};

export type Template = {
  id: string;
  name: string;
  style: string;
  text_capacity: TextCapacity;
  callout_count: number;
  image_mode: ImageMode;
  mood: string[];
  is_flexible_fallback: boolean;
  layout: TemplateLayout;
};

export const templateKeys = {
  all: ["templates"] as const,
};

/**
 * The template library. Templates are public style definitions (RLS allows read
 * to everyone), so no auth scoping is needed. Cached aggressively — the library
 * changes only on deploy.
 */
export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.all,
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<Template[]> => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("is_flexible_fallback", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as Template[]) ?? [];
    },
  });
}
