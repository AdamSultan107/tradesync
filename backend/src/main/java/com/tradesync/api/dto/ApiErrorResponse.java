package com.tradesync.api.dto;

import java.util.List;

public record ApiErrorResponse(
        String message,
        List<ApiErrorDetailResponse> errors
) {

    public ApiErrorResponse {
        errors = List.copyOf(errors);
    }

    public static ApiErrorResponse of(String message) {
        return new ApiErrorResponse(message, List.of());
    }

    public static ApiErrorResponse of(String message, List<ApiErrorDetailResponse> errors) {
        return new ApiErrorResponse(message, errors);
    }
}
