function normalizeVariableName(variableName: string): string {
  return variableName.trim().toUpperCase();
}

export function getEnvVariable(variableName: string, couldBePublic = false): string | undefined {
  const normalizedVariableName = normalizeVariableName(variableName);

  if (!normalizedVariableName) {
    return undefined;
  }

  if (couldBePublic) {
    const publicValue = process.env[`NEXT_PUBLIC_${normalizedVariableName}`]?.trim();
    if (publicValue) {
      return publicValue;
    }
  }

  const privateValue = process.env[normalizedVariableName]?.trim();
  return privateValue || undefined;
}

export default getEnvVariable;
