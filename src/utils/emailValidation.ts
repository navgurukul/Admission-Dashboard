const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_LABEL_REGEX = /^[a-z][a-z0-9-]*$/;
const TLD_REGEX = /^[a-z]{2,}$/;
const ALLOWED_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
]);

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
  const domainParts = domain.split(".");

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

  if (
    domainParts.length < 2 ||
    domainParts.some((part) => !part || part.startsWith("-") || part.endsWith("-"))
  ) {
    return {
      isValid: false,
      normalizedEmail,
      error: "Please enter a valid email address",
    };
  }

  const mainDomainParts = domainParts.slice(0, -1);
  const tld = domainParts[domainParts.length - 1];

  if (
    mainDomainParts.some((part) => !DOMAIN_LABEL_REGEX.test(part)) ||
    !TLD_REGEX.test(tld)
  ) {
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

  if (!ALLOWED_EMAIL_PROVIDERS.has(domain)) {
    return {
      isValid: false,
      normalizedEmail,
      error:
        "Please use a supported email provider (gmail.com, yahoo.com, outlook.com, hotmail.com, live.com, icloud.com)",
    };
  }

  return {
    isValid: true,
    normalizedEmail,
  };
};
