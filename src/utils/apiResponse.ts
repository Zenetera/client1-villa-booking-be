interface FieldError {
  field: string;
  message: string;
}

export function successResponse<T>(data: T) {
  return { data };
}

export function errorResponse(
  message: string,
  field?: string
): { errors: FieldError[] } {
  return {
    errors: [{ field: field || "general", message }],
  };
}

export function fieldErrors(errors: FieldError[]): { errors: FieldError[] } {
  return { errors };
}
