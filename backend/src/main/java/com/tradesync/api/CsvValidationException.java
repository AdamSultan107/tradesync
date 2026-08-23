package com.tradesync.api;

import com.tradesync.api.dto.CsvValidationErrorResponse;

import java.util.List;

public class CsvValidationException extends RuntimeException {

    private final List<CsvValidationErrorResponse> errors;

    public CsvValidationException(List<CsvValidationErrorResponse> errors) {
        super("CSV validation failed.");
        this.errors = List.copyOf(errors);
    }

    public List<CsvValidationErrorResponse> errors() {
        return errors;
    }
}
