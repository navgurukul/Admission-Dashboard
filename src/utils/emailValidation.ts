const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmai.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "hotnail.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "yaho.com": "yahoo.com",
  "yhoo.com": "yahoo.com",
};

export interface EmailValidationResult {
  isValid: boolean;
  normalizedEmail: string;
  error?: string;
  suggestion?: string;
}

export const validateEmailAddress = (
  email: string,
): EmailValidationResult => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      isValid: false,
      normalizedEmail,
      error: "Email is required",
    };
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return {
      isValid: false,
      normalizedEmail,
      error: "Please enter a valid email address",
    };
  }

  const [localPart, domain = ""] = normalizedEmail.split("@");

  if (!localPart || !domain || localPart.startsWith(".") || localPart.endsWith(".")) {
    return {
      isValid: false,
      normalizedEmail,
      error: "Please enter a valid email address",
    };
  }

  if (normalizedEmail.includes("..")) {
    return {
      isValid: false,
      normalizedEmail,
      error: "Please enter a valid email address",
    };
  }

  const suggestedDomain = COMMON_DOMAIN_TYPOS[domain];
  if (suggestedDomain) {
    return {
      isValid: false,
      normalizedEmail,
      suggestion: `${localPart}@${suggestedDomain}`,
      error: `Did you mean ${localPart}@${suggestedDomain}?`,
    };
  }

  return {
    isValid: true,
    normalizedEmail,
  };
};
