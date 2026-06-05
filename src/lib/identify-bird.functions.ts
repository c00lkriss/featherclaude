import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM = `You are an expert ornithologist. Identify the bird in this photo. Return ONLY valid JSON with: common_name, scientific_name, genus, species, family_name, order_name, iucn_status, confidence (0-100), identification_notes. Use IOC/Clements taxonomy aligned with Birds of the World. If uncertain set confidence below 50.`;

export type BirdIdentification = {
  common_name: string;
  scientific_name: string;
  genus: string;
  species: string;
  family_name: string;
  order_name: string;
  iucn_status: string;
  confidence: number;
  identification_notes: string;
};

export const identifyBird = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        image_data_url: z
          .string()
          .min(20)
          .max(20 * 1024 * 1024)
          .startsWith("data:image/"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify this bird and return JSON only." },
              { type: "image_url", image_url: { url: data.image_data_url } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      throw new Error("Rate limit exceeded — please slow down and try again.");
    }
    if (res.status === 402) {
      throw new Error("AI credits exhausted. Please top up your workspace.");
    }
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      throw new Error(`AI gateway error (${res.status})`);
    }

    const body = await res.json();
    const raw: string = body.choices?.[0]?.message?.content ?? "";
    let parsed: BirdIdentification;
    try {
      // Strip code fences if present
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", raw);
      throw new Error("AI returned an unparseable response.");
    }

    return {
      common_name: String(parsed.common_name ?? ""),
      scientific_name: String(parsed.scientific_name ?? ""),
      genus: String(parsed.genus ?? ""),
      species: String(parsed.species ?? ""),
      family_name: String(parsed.family_name ?? ""),
      order_name: String(parsed.order_name ?? ""),
      iucn_status: String(parsed.iucn_status ?? ""),
      confidence: Number(parsed.confidence ?? 0),
      identification_notes: String(parsed.identification_notes ?? ""),
    };
  });
