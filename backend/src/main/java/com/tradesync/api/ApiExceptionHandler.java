package com.tradesync.api;

import com.tradesync.api.dto.ApiErrorDetailResponse;
import com.tradesync.api.dto.ApiErrorResponse;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(CsvValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleCsvValidationException(CsvValidationException exception) {
        return ResponseEntity.badRequest().body(ApiErrorResponse.of(exception.getMessage(), exception.errors()));
    }

    @ExceptionHandler({
            ReconciliationNotFoundException.class,
            ReconciliationResultNotFoundException.class
    })
    public ResponseEntity<ApiErrorResponse> handleNotFound(RuntimeException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiErrorResponse.of(exception.getMessage()));
    }

    @ExceptionHandler(ExceptionResolutionRejectedException.class)
    public ResponseEntity<ApiErrorResponse> handleExceptionResolutionRejected(
            ExceptionResolutionRejectedException exception
    ) {
        return ResponseEntity.badRequest().body(ApiErrorResponse.of(exception.getMessage()));
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        List<ApiErrorDetailResponse> errors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> ApiErrorDetailResponse.of(error.getField(), error.getDefaultMessage()))
                .toList();
        return errorResponse(
                exception,
                headers,
                HttpStatus.BAD_REQUEST,
                request,
                ApiErrorResponse.of("Request validation failed.", errors)
        );
    }

    @Override
    protected ResponseEntity<Object> handleMissingServletRequestPart(
            MissingServletRequestPartException exception,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        ApiErrorDetailResponse error = ApiErrorDetailResponse.of(
                exception.getRequestPartName(),
                "File part is required."
        );
        return errorResponse(
                exception,
                headers,
                HttpStatus.BAD_REQUEST,
                request,
                ApiErrorResponse.of("Request validation failed.", List.of(error))
        );
    }

    @Override
    protected ResponseEntity<Object> handleMissingServletRequestParameter(
            MissingServletRequestParameterException exception,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        ApiErrorDetailResponse error = ApiErrorDetailResponse.of(
                exception.getParameterName(),
                "Request parameter is required."
        );
        return errorResponse(
                exception,
                headers,
                HttpStatus.BAD_REQUEST,
                request,
                ApiErrorResponse.of("Request validation failed.", List.of(error))
        );
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException exception,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        ApiErrorDetailResponse error = ApiErrorDetailResponse.of("body", "Request body must be valid JSON.");
        return errorResponse(
                exception,
                headers,
                HttpStatus.BAD_REQUEST,
                request,
                ApiErrorResponse.of("Malformed JSON request.", List.of(error))
        );
    }

    @Override
    protected ResponseEntity<Object> handleHttpRequestMethodNotSupported(
            HttpRequestMethodNotSupportedException exception,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        ApiErrorDetailResponse error = ApiErrorDetailResponse.of(
                "method",
                "HTTP method is not supported for this endpoint."
        );
        return errorResponse(
                exception,
                headers,
                HttpStatus.METHOD_NOT_ALLOWED,
                request,
                ApiErrorResponse.of("HTTP method is not supported.", List.of(error))
        );
    }

    @Override
    protected ResponseEntity<Object> handleHttpMediaTypeNotSupported(
            HttpMediaTypeNotSupportedException exception,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        ApiErrorDetailResponse error = ApiErrorDetailResponse.of(
                "contentType",
                "Content type is not supported for this endpoint."
        );
        return errorResponse(
                exception,
                headers,
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                request,
                ApiErrorResponse.of("Content type is not supported.", List.of(error))
        );
    }

    @Override
    protected ResponseEntity<Object> handleTypeMismatch(
            TypeMismatchException exception,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        ApiErrorDetailResponse error = ApiErrorDetailResponse.of(
                exception.getPropertyName(),
                "Value has the wrong type."
        );
        return errorResponse(
                exception,
                headers,
                HttpStatus.BAD_REQUEST,
                request,
                ApiErrorResponse.of("Request validation failed.", List.of(error))
        );
    }

    private ResponseEntity<Object> errorResponse(
            Exception exception,
            HttpHeaders headers,
            HttpStatus status,
            WebRequest request,
            ApiErrorResponse response
    ) {
        return handleExceptionInternal(exception, response, headers, status, request);
    }
}
