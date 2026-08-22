/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GEMINI_API_KEY?: string;
  readonly GEMINI_MODEL?: string;
  readonly HF_TOKEN?: string;
  readonly HUGGINGFACE_API_KEY?: string;
  readonly HF_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
