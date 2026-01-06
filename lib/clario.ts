export type ClarioChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const SYSTEM_PROMPT: ClarioChatMessage = {
  role: 'system',
  content:
    "Tu es Clario, thérapeute spécialisé dans la dépendance au porno. Tu réponds en français, avec empathie, en donnant des conseils concrets et sécurisants. Tu ne donnes jamais d'avis médical. Tu encourages la personne à respirer, à se recentrer et à contacter un professionnel en cas de danger immédiat.",
};

export async function sendClarioMessage(
  message: string,
  history: ClarioChatMessage[] = []
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('Clé OpenAI manquante');
  }

  const payload = {
    model: 'gpt-4o-mini',
    messages: [SYSTEM_PROMPT, ...history, { role: 'user' as const, content: message }],
    temperature: 0.7,
    max_tokens: 500,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = 'Réponse invalide de l\'assistant';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.error?.message || errorMessage;
    } catch {
      // Ignore JSON parse errors and use the default message
    }
    throw new Error(errorMessage);
  }

  const data: any = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Réponse vide de l\'assistant');
  }

  return content.trim();
}
