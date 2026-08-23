package com.tradesync.api.dto;

import java.util.List;

public record CsvValidationErrorListResponse(
        String message,
        List<CsvValidationErrorResponse> errors
) {

    public CsvValidationErrorListResponse {
        errors = List.copyOf(errors);
    }
}
