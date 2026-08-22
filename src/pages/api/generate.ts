import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'API_DISABLED',
        message: 'External API service is currently disabled. All available tools run 100% client-side.',
      },
    }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
