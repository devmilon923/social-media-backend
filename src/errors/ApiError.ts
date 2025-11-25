class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorDetails?: { path?: string | null; value?: any };

  constructor(
    statusCode: number,
    message: string,
    errorDetails?: { path?: string | null; value?: any },
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorDetails = errorDetails || { path: null, value: null };

    // Remove stack trace completely
    Object.defineProperty(this, "stack", { value: undefined });
  }
}

export default ApiError;
