package com.tradesync.api;

import com.tradesync.api.dto.ErrorResponse;
import com.tradesync.api.dto.ExceptionResolutionRequest;
import com.tradesync.api.dto.ExceptionResolutionResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exceptions")
public class ExceptionController {

    private final ExceptionResolutionService resolutionService;

    public ExceptionController(ExceptionResolutionService resolutionService) {
        this.resolutionService = resolutionService;
    }

    @PatchMapping(
            path = "/{resultId}/resolve",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ExceptionResolutionResponse resolveException(
            @PathVariable Long resultId,
            @Valid @RequestBody ExceptionResolutionRequest request
    ) {
        return resolutionService.resolveException(resultId, request);
    }

    @ExceptionHandler(ReconciliationResultNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleReconciliationResultNotFoundException(
            ReconciliationResultNotFoundException exception
    ) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(ExceptionResolutionRejectedException.class)
    public ResponseEntity<ErrorResponse> handleExceptionResolutionRejectedException(
            ExceptionResolutionRejectedException exception
    ) {
        return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
    }
}
