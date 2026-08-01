/*
::neup.documentation::core-dictionary
::title Core Dictionary Helpers

Provides dictionary-oriented helpers shared across application features.

::public

Use `getRandomWord()` to fetch one lowercase random word from the external random word API.

::public end

::private

The random word API returns a JSON array payload like `["necessitously"]`; this module validates and normalizes the first item.

::private end

::end
*/

const RANDOM_WORD_API_URL = 'https://random-word-api.herokuapp.com/word';

export async function getRandomWord(): Promise<string> {
  const response = await fetch(RANDOM_WORD_API_URL, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch a random word.');
  }

  const payload: unknown = await response.json();
  const [word] = Array.isArray(payload) ? payload : [];

  if (typeof word !== 'string' || !word.trim()) {
    throw new Error('Random word API returned an invalid response.');
  }

  return word.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}
