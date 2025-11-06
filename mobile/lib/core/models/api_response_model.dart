class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? statusCode;

  const ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.statusCode,
  });

  factory ApiResponse.success(T data) {
    return ApiResponse<T>(
      success: true,
      data: data,
    );
  }

  factory ApiResponse.error(String message) {
    return ApiResponse<T>(
      success: false,
      message: message,
    );
  }

  factory ApiResponse.failure(T? data, String message) {
    return ApiResponse<T>(
      success: false,
      data: data,
      message: message,
    );
  }

  bool get isSuccess => success;
  bool get isError => !success;
  bool get hasData => data != null;
}