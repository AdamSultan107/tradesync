package com.tradesync.api;

import com.tradesync.api.dto.CreateReconciliationResponse;
import com.tradesync.api.dto.CsvValidationErrorListResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;

@RestController
@RequestMapping("/api/reconciliations")
public class ReconciliationController {

    private final ReconciliationWorkflowService workflowService;

    public ReconciliationController(ReconciliationWorkflowService workflowService) {
        this.workflowService = workflowService;
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

    @ExceptionHandler(CsvValidationException.class)
    public ResponseEntity<CsvValidationErrorListResponse> handleCsvValidationException(
            CsvValidationException exception
    ) {
        return ResponseEntity.badRequest().body(
                new CsvValidationErrorListResponse(exception.getMessage(), exception.errors())
        );
    }
}
