import { NextResponse } from "next/server";
import { fireworks } from "@ai-sdk/fireworks";
import { generateObject } from "ai";
import { z } from "zod";

const Recipe = z.object({
	title: z.string().min(1),
	time_minutes: z.number().int().nonnegative(),
	uses: z.array(z.string()),
	missing: z.array(z.string()).optional(),
	steps: z.array(z.string()).optional(),
});

const Output = z.object({
	recipes: z.array(Recipe).min(1).max(6),
	shopping_list: z.array(z.string()).optional(),
});

export async function POST(req) {
	try {
		const { ingredients = "", preferences = "" } = await req.json();

		const prompt = `
You are Dobby Chef AI. Given the user's ingredients and preferences,
suggest 3–6 simple recipes. Steps should be short and clear.

Return ONLY valid JSON that matches this shape:
{
  "recipes": [
    { "title": string, "time_minutes"?: number, "uses"?: string[], "missing"?: string[], "steps"?: string[] }
  ],
  "shopping_list"?: string[]
}

Do not include extra keys or prose. Output JSON only. Do not use full stop anywhere
Ingredients: ${ingredients}
Preferences: ${preferences}
`;

		const result = await generateObject({
			model: fireworks(
				"accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new"
			),
			schema: Output,
			prompt,

			// IMPORTANT: Fireworks model doesn't support JSON-schema responseFormat.
			// Force classic text generation + Zod parsing (no structured outputs).
			structuredOutputs: false,
		});

		// console.log(result);

		return NextResponse.json(result.object);
	} catch (err) {
		return NextResponse.json(
			{ error: err?.message || "Server error" },
			{ status: 500 }
		);
	}
}
