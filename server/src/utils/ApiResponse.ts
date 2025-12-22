export class ApiResponse<T> {
  public success: boolean;
  public message: string;
  public data: T | null;

  constructor(success: boolean, message: string, data: T | null = null) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data);
  }

  static error<T>(message: string, data: T | null = null): ApiResponse<T> {
    return new ApiResponse<T>(false, message, data);
  }
}
