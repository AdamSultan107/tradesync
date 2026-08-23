package com.tradesync.api;

import com.tradesync.api.dto.CreateReconciliationResponse;
import com.tradesync.api.dto.CsvValidationErrorListResponse;
import com.tradesync.api.dto.ErrorResponse;
import com.tradesync.api.dto.ReconciliationRunResponse;
import com.tradesync.api.dto.StoredReconciliationResultResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/reconciliations")
public class ReconciliationController {

    private final ReconciliationWorkflowService workflowService;
    private final ReconciliationQueryService queryService;

    public ReconciliationController(
            ReconciliationWorkflowService workflowService,
            ReconciliationQueryService queryService
    ) {
        this.workflowService = workflowService;
        this.queryService = queryService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CreateReconciliationResponse> createReconciliation(
            @RequestParam("internalFile") MultipartFile internalFile,
            @RequestParam("externalFile") MultipartFile externalFile
    ) {
        CreateReconciliationResponse response = workflowService.createReconciliation(internalFile, externalFile);
        URI location = URI.create("/api/reconciliations/" + response.runId());

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping(path = "/{runId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ReconciliationRunResponse getReconciliation(@PathVariable Long runId) {
        return queryService.getRun(runId);
    }

    @GetMapping(path = "/{runId}/results", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<StoredReconciliationResultResponse> getResults(@PathVariable Long runId) {
        return queryService.getResults(runId);
    }

    @GetMapping(path = "/{runId}/exceptions", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<StoredReconciliationResultResponse> getExceptions(@PathVariable Long runId) {
        return queryService.getExceptions(runId);
    }

    @ExceptionHandler(CsvValidationException.class)
    public ResponseEntity<CsvValidationErrorListResponse> handleCsvValidationException(
            CsvValidationException exception
    ) {
        return ResponseEntity.badRequest().body(
                new CsvValidationErrorListResponse(exception.getMessage(), exception.errors())
        );
    }

    @ExceptionHandler(ReconciliationNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleReconciliationNotFoundException(
            ReconciliationNotFoundException exception
    ) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(exception.getMessage()));
    }
}
