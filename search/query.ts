/*
::neup.documentation::core-search-query
::title Framework-independent search query parser

Parses a small, reusable search language into an abstract syntax tree.
The parser has no application, database, or framework dependencies.
::end
*/

export type SearchNode =
  | { type: 'term'; value: string }
  | { type: 'not'; node: { type: 'term'; value: string } }
  | { type: 'and'; nodes: SearchNode[] }
  | { type: 'or'; nodes: SearchNode[] };

type Token =
  | { type: 'TERM'; value: string }
  | { type: 'NOT_TERM'; value: string }
  | { type: 'AND' }
  | { type: 'OR' };

type ParseResult = { ast: SearchNode } | { error: string };

const isWhitespace = (value: string) => value.trim().length === 0;

const tokenize = (input: string): { tokens: Token[] } | { error: string } => {
  const tokens: Token[] = [];
  let index = 0;

  const readWord = () => {
    const start = index;
    while (index < input.length && !isWhitespace(input[index]) && input[index] !== '+' && input[index] !== '|') {
      index += 1;
    }
    return input.slice(start, index);
  };

  while (index < input.length) {
    if (isWhitespace(input[index])) {
      index += 1;
      continue;
    }
    if (input.startsWith('||', index)) {
      tokens.push({ type: 'OR' });
      index += 2;
      continue;
    }
    if (input[index] === '|') return { error: 'Use || for OR.' };
    if (input[index] === '+') {
      tokens.push({ type: 'AND' });
      index += 1;
      continue;
    }
    if (input.startsWith('!:', index)) {
      index += 2;
      while (index < input.length && isWhitespace(input[index])) index += 1;
      const term = readWord();
      if (!term) return { error: 'Missing term after !:.' };
      tokens.push({ type: 'NOT_TERM', value: term });
      continue;
    }

    const word = readWord();
    if (!word) return { error: 'Invalid token in search query.' };
    const lower = word.toLowerCase();
    if (lower === 'and') tokens.push({ type: 'AND' });
    else if (lower === 'or') tokens.push({ type: 'OR' });
    else tokens.push({ type: 'TERM', value: word });
  }

  return tokens.length ? { tokens } : { error: 'Empty search query.' };
};

const toAndNode = (nodes: SearchNode[]) => nodes.length === 1 ? nodes[0] : { type: 'and', nodes } as const;
const toOrNode = (nodes: SearchNode[]) => nodes.length === 1 ? nodes[0] : { type: 'or', nodes } as const;

const parseTokens = (tokens: Token[]): ParseResult => {
  const orGroups: SearchNode[] = [];
  let andGroup: SearchNode[] = [];
  let expectTerm = true;

  const flushAndGroup = () => {
    if (!andGroup.length) return { error: 'Search query is missing a term.' } as const;
    orGroups.push(toAndNode(andGroup));
    andGroup = [];
    return null;
  };

  for (const token of tokens) {
    if (token.type === 'AND') {
      if (expectTerm) return { error: 'AND must follow a term.' };
      expectTerm = true;
      continue;
    }
    if (token.type === 'OR') {
      if (expectTerm) return { error: 'OR must follow a term.' };
      const result = flushAndGroup();
      if (result) return result;
      expectTerm = true;
      continue;
    }
    andGroup.push(token.type === 'TERM'
      ? { type: 'term', value: token.value }
      : { type: 'not', node: { type: 'term', value: token.value } });
    expectTerm = false;
  }

  if (expectTerm) return { error: 'Search query cannot end with an operator.' };
  const result = flushAndGroup();
  if (result) return result;
  return { ast: toOrNode(orGroups) };
};

export const parseSearchQuery = (raw?: string): ParseResult | null => {
  if (!raw?.trim()) return null;
  let input = raw.trim();
  const hasBrace = input.includes('{') || input.includes('}');
  if (hasBrace) {
    if (!input.startsWith('{') || !input.endsWith('}')) {
      return { error: 'Search equation must be wrapped in { } with no extra text.' };
    }
    input = input.slice(1, -1).trim();
    if (!input) return { error: 'Search equation cannot be empty.' };
    if (input.includes('{') || input.includes('}')) return { error: 'Nested search equations are not supported.' };
  }
  const tokenized = tokenize(input);
  return 'error' in tokenized ? tokenized : parseTokens(tokenized.tokens);
};
