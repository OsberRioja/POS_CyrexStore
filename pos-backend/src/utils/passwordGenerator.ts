/**
 * Genera una contraseña temporal segura
 * @param length Longitud de la contraseña (por defecto 12)
 * @returns Contraseña temporal
 */

export function generateTemporaryPassword(length: number = 12): string {
  const charset = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%&*'
  };

  // Asegurar que la contraseña tenga al menos un carácter de cada tipo
  let password = '';
  password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
  password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
  password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
  password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

  // Combinar todos los caracteres posibles
  const allChars = charset.lowercase + charset.uppercase + charset.numbers + charset.symbols;

  // Completar el resto de la contraseña
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mezclar la contraseña para que no siempre comience con los mismos tipos
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Valida la fortaleza de una contraseña
 * @param password Contraseña a validar
 * @returns Objeto con validez y mensajes de error
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/(?=.*[!@#$%&*])/.test(password)) {
    errors.push('La contraseña debe contener al menos un símbolo (!@#$%&*)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}