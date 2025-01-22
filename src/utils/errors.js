export class AppError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export const ErrorCodes = {
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  DATABASE: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION: 'PERMISSION_ERROR',
  RELATIONSHIP: 'RELATIONSHIP_ERROR'
};

export const handleError = (error, context = '') => {
  if (error instanceof AppError) {
    console.error(`[${context}] ${error.code}:`, error.message, error.details);
  } else {
    console.error(`[${context}] Unhandled error:`, error);
  }
  
  // Return user-friendly error message
  return {
    message: error instanceof AppError ? error.message : 'An unexpected error occurred',
    code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR'
  };
};

export const createValidationError = (message, details) => {
  return new AppError(message, ErrorCodes.VALIDATION, details);
};

export const createAuthError = (message, details) => {
  return new AppError(message, ErrorCodes.AUTH, details);
};

export const createDatabaseError = (message, details) => {
  return new AppError(message, ErrorCodes.DATABASE, details);
};

export const createNotFoundError = (message, details) => {
  return new AppError(message, ErrorCodes.NOT_FOUND, details);
}; 