package com.tradesync.api;

import com.tradesync.api.dto.ApiErrorDetailResponse;

import java.util.List;

public class CsvValidationException extends RuntimeException {

    private final List<ApiErrorDetailResponse> errors;

    public CsvValidationException(List<ApiErrorDetailResponse> errors) {
        super("CSV validation failed.");
        this.errors = List.copyOf(errors);
    }

    public List<ApiErrorDetailResponse> errors() {
        return errors;
    }
}
