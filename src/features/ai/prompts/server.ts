/**
 * SERVER-ONLY AI PROMPTS MODULE
 * This module must NEVER be imported by browser React components.
 * It is invoked exclusively by src/pages/api/generate.ts.
 */

export interface ServerPromptConfig {
  systemInstruction: string;
  userPrompt: string;
  isJsonOutput?: boolean;
}

export function buildServerPrompt(
  tool: string,
  input: string,
  options?: Record<string, string>
): ServerPromptConfig {
  switch (tool) {
    case 'roast-my-pic':
      return {
        systemInstruction:
          'You are a hilarious, friendly AI comedian. Roast the photo submitted by the user in a savage but funny Hinglish style. Keep it light-hearted, playful, non-hateful and maximum 100 words. Do not generate abusive, sexual, or discriminatory content.',
        userPrompt: input ? `Extra user context: ${input}` : 'Roast this picture in savage Hinglish style!',
      };

    case 'ai-recipe-generator':
      return {
        systemInstruction:
          'You are an expert chef AI. Generate a delicious recipe based on user input. Return ONLY valid JSON with keys: "dishName" (string), "description" (string), "ingredients" (array of strings), "steps" (array of strings), "cookingTime" (string), "difficulty" ("Easy" | "Medium" | "Hard").',
        userPrompt: `Ingredients: ${input}. Cuisine: ${options?.cuisine || 'Any'}. Dietary: ${options?.dietary || 'None'}. Servings: ${options?.servings || '2'}.`,
        isJsonOutput: true,
      };

    case 'text-to-emoji-art':
      return {
        systemInstruction:
          'You are an emoji artist. Convert the input phrase or topic into a creative, visual emoji-only grid or pattern. Use ONLY emojis and linebreaks. Do NOT include words, markdown, or text in your output.',
        userPrompt: `Create emoji art for: "${input}"`,
      };

    case 'dream-interpreter':
      return {
        systemInstruction:
          'You are an insightful dream analyst providing self-reflection perspectives for entertainment. Return ONLY valid JSON with keys: "interpretation" (string), "symbolicThemes" (array of strings), "emotionalThemes" (array of strings), "reflectionQuestions" (array of strings). Note: Do NOT provide medical or psychological diagnosis.',
        userPrompt: `Dream description: "${input}"`,
        isJsonOutput: true,
      };

    case 'simp-o-meter':
      return {
        systemInstruction:
          'You are a relationship analyzer providing humorous conversation feedback. Analyze the pasted chat and return ONLY valid JSON with keys: "simpScore" (number 0 to 100), "reasons" (array of strings), "greenFlags" (array of strings), "redFlags" (array of strings), "summary" (string). Keep it lighthearted.',
        userPrompt: `Conversation text:\n"${input}"`,
        isJsonOutput: true,
      };

    case 'ai-gaali-translator': {
      const mode = options?.mode || 'Corporate';
      return {
        systemInstruction: `You are an AI style translator. Translate the angry sentence or rant provided into the requested style: "${mode}". Preserve the underlying message while transforming the tone into professional corporate jargon, Shakespearean drama, polite etiquette, or formal Hinglish. Do not add unrequested explicit profanity.`,
        userPrompt: `Original rant: "${input}"\nTarget style: ${mode}`,
      };
    }

    case 'explain-like-im-five':
      return {
        systemInstruction:
          'You are an expert educator. Explain complex topics in simple Hinglish so a 5-year-old can understand. Return ONLY valid JSON with keys: "explanation" (simple Hinglish text), "analogy" (fun real-world analogy), "example" (concrete everyday example), "oneLiner" (one sentence summary).',
        userPrompt: `Explain this topic: "${input}"`,
        isJsonOutput: true,
      };

    case 'ai-meme-caption-generator':
      return {
        systemInstruction:
          'You are a viral meme creator. Generate 5 hilarious, trending caption options for the specified meme template or situation. Return ONLY valid JSON with key: "captions" (array of 5 strings).',
        userPrompt: `Meme template / scenario: "${input}". Context: ${options?.context || 'General humor'}`,
        isJsonOutput: true,
      };

    case 'wedding-vows-shayari': {
      const style = options?.style || 'Romantic';
      return {
        systemInstruction: `You are a romantic poet and wedding vows writer. Create heartfelt wedding vows and romantic Shayari based on user names and context in a "${style}" tone. Return ONLY valid JSON with keys: "vows" (string), "shayari" (string).`,
        userPrompt: `Partner 1: "${options?.name1 || 'Partner 1'}", Partner 2: "${options?.name2 || 'Partner 2'}". Context: "${input}"`,
        isJsonOutput: true,
      };
    }

    case 'ai-cover-letter-generator': {
      const tone = options?.tone || 'Professional';
      return {
        systemInstruction: `You are an executive career advisor and expert cover letter writer. Create a compelling, tailored, high-converting cover letter based on user skills, experience, and the target role in a "${tone}" tone. Return ONLY valid JSON with keys: "coverLetter" (string with proper paragraph breaks), "keyHighlights" (array of 3-4 bullet strings), "subjectLine" (string).`,
        userPrompt: `Target Company / Role: "${options?.role || 'Target Position'}". Experience & Background: "${input}". Tone: "${tone}".`,
        isJsonOutput: true,
      };
    }

    case 'ai-code-explainer': {
      const language = options?.language || 'Auto-detect';
      return {
        systemInstruction: `You are a principal software engineer and educator. Analyze the submitted code snippet. Return ONLY valid JSON with keys: "explanation" (clear, step-by-step plain English breakdown), "timeComplexity" (string e.g. "O(N) linear time"), "spaceComplexity" (string e.g. "O(1) constant space"), "improvements" (array of strings with optimization or bug-fix suggestions), "simplifiedCode" (string with clean commented code).`,
        userPrompt: `Language: ${language}. Code Snippet:\n${input}`,
        isJsonOutput: true,
      };
    }

    case 'ai-bio-generator': {
      const platform = options?.platform || 'Twitter / X';
      const tone = options?.tone || 'Clever & Engaging';
      return {
        systemInstruction: `You are a social media branding expert. Create 4 catchy, optimized profile bio variations tailored for "${platform}" in a "${tone}" tone with appropriate emojis and character limit awareness. Return ONLY valid JSON with key: "bios" (array of 4 string bios).`,
        userPrompt: `User Details, Interests & Goals: "${input}". Platform: "${platform}". Tone: "${tone}".`,
        isJsonOutput: true,
      };
    }

    case 'resume-bullet-points':
      return {
        systemInstruction:
          'You are a professional ATS resume strategist. Transform raw job duties into impact-driven ATS-friendly resume bullet points starting with strong action verbs. Use metric placeholders (e.g. "[X%]", "[Y users]") if exact numbers are not supplied by the user—do NOT fabricate exact fake metrics. Return ONLY valid JSON with key: "bullets" (array of strings).',
        userPrompt: `Job Title: "${options?.jobTitle || 'Professional'}", Seniority: "${options?.seniority || 'Mid-Level'}". Description: "${input}"`,
        isJsonOutput: true,
      };

    default:
      throw new Error(`Unsupported AI tool: ${tool}`);
  }
}
