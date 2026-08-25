package com.tradesync.api;

import com.tradesync.api.dto.CreateReconciliationResponse;
import com.tradesync.api.dto.ApiErrorDetailResponse;
import com.tradesync.csv.CsvTradeParseResult;
import com.tradesync.csv.CsvTradeParser;
import com.tradesync.csv.CsvTradeValidationError;
import com.tradesync.persistence.entity.ReconciliationRunEntity;
import com.tradesync.persistence.service.ReconciliationPersistenceService;
import com.tradesync.reconciliation.ReconciliationEngine;
import com.tradesync.reconciliation.ReconciliationResult;
import com.tradesync.trade.TradeSource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReconciliationWorkflowService {

    private final CsvTradeParser csvTradeParser;
    private final ReconciliationEngine reconciliationEngine;
    private final ReconciliationPersistenceService persistenceService;

    public ReconciliationWorkflowService(
            CsvTradeParser csvTradeParser,
            ReconciliationEngine reconciliationEngine,
            ReconciliationPersistenceService persistenceService
    ) {
        this.csvTradeParser = csvTradeParser;
        this.reconciliationEngine = reconciliationEngine;
        this.persistenceService = persistenceService;
    }

    public CreateReconciliationResponse createReconciliation(
            MultipartFile internalFile,
            MultipartFile externalFile
    ) {
        CsvTradeParseResult internalParse = parse(internalFile, TradeSource.INTERNAL);
        CsvTradeParseResult externalParse = parse(externalFile, TradeSource.EXTERNAL);
        throwIfValidationErrors(internalParse, externalParse);

        List<ReconciliationResult> results = reconciliationEngine.reconcile(
                internalParse.trades(),
                externalParse.trades()
        );
        ReconciliationRunEntity savedRun = persistenceService.saveCompletedRun(
                internalParse.trades(),
                externalParse.trades(),
                results
        );

        return CreateReconciliationResponse.from(savedRun, results);
    }

    private CsvTradeParseResult parse(MultipartFile file, TradeSource source) {
        if (file == null || file.isEmpty()) {
            CsvTradeValidationError error = new CsvTradeValidationError(0, "file", "File is required.");
            return new CsvTradeParseResult(List.of(), List.of(error));
        }

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            return csvTradeParser.parse(reader, source);
        } catch (IOException exception) {
            CsvTradeValidationError error = new CsvTradeValidationError(
                    0,
                    "file",
                    "Unable to read trade CSV file."
            );
            return new CsvTradeParseResult(List.of(), List.of(error));
        }
    }

    private void throwIfValidationErrors(
            CsvTradeParseResult internalParse,
            CsvTradeParseResult externalParse
    ) {
        List<ApiErrorDetailResponse> errors = new ArrayList<>();
        errors.addAll(toResponses(TradeSource.INTERNAL, internalParse.errors()));
        errors.addAll(toResponses(TradeSource.EXTERNAL, externalParse.errors()));

        if (!errors.isEmpty()) {
            throw new CsvValidationException(errors);
        }
    }

    private List<ApiErrorDetailResponse> toResponses(
            TradeSource source,
            List<CsvTradeValidationError> errors
    ) {
        return errors.stream()
                .map(error -> ApiErrorDetailResponse.from(source, error))
                .toList();
    }
}
