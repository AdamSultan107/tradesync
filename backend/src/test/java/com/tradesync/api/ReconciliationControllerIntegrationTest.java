package com.tradesync.api;

import com.tradesync.persistence.repository.ExceptionResolutionRepository;
import com.tradesync.persistence.repository.ReconciliationResultRepository;
import com.tradesync.persistence.repository.ReconciliationRunRepository;
import com.tradesync.persistence.repository.TradeRepository;
import com.tradesync.reconciliation.ReconciliationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReconciliationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExceptionResolutionRepository resolutionRepository;

    @Autowired
    private ReconciliationResultRepository resultRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private ReconciliationRunRepository runRepository;

    @BeforeEach
    void clearDatabase() {
        resolutionRepository.deleteAll();
        resultRepository.deleteAll();
        tradeRepository.deleteAll();
        runRepository.deleteAll();
    }

    @Test
    void createsReconciliationFromCsvUploads() throws Exception {
        MockMultipartFile internalFile = csv("internalFile", """
                trade_id,symbol,quantity,price,currency,trade_date
                T001,AAPL,100,225.40,USD,2026-08-18
                T002,MSFT,50,510.25,USD,2026-08-18
                """);
        MockMultipartFile externalFile = csv("externalFile", """
                trade_id,symbol,quantity,price,currency,trade_date
                T001,AAPL,100,225.40,USD,2026-08-18
                T002,MSFT,50,511.00,USD,2026-08-18
                """);

        mockMvc.perform(multipart("/api/reconciliations")
                        .file(internalFile)
                        .file(externalFile))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.startsWith("/api/reconciliations/")))
                .andExpect(jsonPath("$.runId").isNumber())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.internalTradeCount").value(2))
                .andExpect(jsonPath("$.externalTradeCount").value(2))
                .andExpect(jsonPath("$.matchedCount").value(1))
                .andExpect(jsonPath("$.exceptionCount").value(1))
                .andExpect(jsonPath("$.results[0].tradeId").value("T001"))
                .andExpect(jsonPath("$.results[0].status").value("MATCHED"))
                .andExpect(jsonPath("$.results[1].tradeId").value("T002"))
                .andExpect(jsonPath("$.results[1].status").value("PRICE_MISMATCH"));

        assertThat(runRepository.count()).isEqualTo(1);
        assertThat(tradeRepository.count()).isEqualTo(4);
        assertThat(resultRepository.count()).isEqualTo(2);
    }

    @Test
    void getsReconciliationRunSummary() throws Exception {
        Long runId = createPriceMismatchRun();

        mockMvc.perform(get("/api/reconciliations/{runId}", runId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.runId").value(runId))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.internalTradeCount").value(2))
                .andExpect(jsonPath("$.externalTradeCount").value(2))
                .andExpect(jsonPath("$.matchedCount").value(1))
                .andExpect(jsonPath("$.exceptionCount").value(1));
    }

    @Test
    void getsReconciliationResultsWithRelatedTrades() throws Exception {
        Long runId = createPriceMismatchRun();

        mockMvc.perform(get("/api/reconciliations/{runId}/results", runId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(2)))
                .andExpect(jsonPath("$[0].resultId").isNumber())
                .andExpect(jsonPath("$[0].tradeId").value("T001"))
                .andExpect(jsonPath("$[0].status").value("MATCHED"))
                .andExpect(jsonPath("$[0].internalTrades[0].source").value("INTERNAL"))
                .andExpect(jsonPath("$[0].externalTrades[0].source").value("EXTERNAL"))
                .andExpect(jsonPath("$[1].resultId").isNumber())
                .andExpect(jsonPath("$[1].tradeId").value("T002"))
                .andExpect(jsonPath("$[1].status").value("PRICE_MISMATCH"))
                .andExpect(jsonPath("$[1].internalTrades[0].tradeId").value("T002"))
                .andExpect(jsonPath("$[1].externalTrades[0].tradeId").value("T002"));
    }

    @Test
    void getsExceptionResultsOnly() throws Exception {
        Long runId = createPriceMismatchRun();

        mockMvc.perform(get("/api/reconciliations/{runId}/exceptions", runId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$[0].tradeId").value("T002"))
                .andExpect(jsonPath("$[0].status").value("PRICE_MISMATCH"))
                .andExpect(jsonPath("$[0].internalTrades[0].tradeId").value("T002"))
                .andExpect(jsonPath("$[0].externalTrades[0].tradeId").value("T002"));
    }

    @Test
    void includesDuplicateTradeRowsForReview() throws Exception {
        Long runId = createDuplicateRun();

        mockMvc.perform(get("/api/reconciliations/{runId}/results", runId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$[0].tradeId").value("T001"))
                .andExpect(jsonPath("$[0].status").value("DUPLICATE"))
                .andExpect(jsonPath("$[0].internalTrades", org.hamcrest.Matchers.hasSize(2)))
                .andExpect(jsonPath("$[0].externalTrades", org.hamcrest.Matchers.hasSize(1)));
    }

    @Test
    void returnsNotFoundForUnknownReconciliationRun() throws Exception {
        mockMvc.perform(get("/api/reconciliations/{runId}", 999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Reconciliation run not found: 999"));
    }

    @Test
    void resolvesExceptionResult() throws Exception {
        Long runId = createPriceMismatchRun();
        Long resultId = resultId(runId, ReconciliationStatus.PRICE_MISMATCH);

        mockMvc.perform(patch("/api/exceptions/{resultId}/resolve", resultId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resolutionStatus": "RESOLVED",
                                  "note": "Confirmed external price is correct."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resolutionId").isNumber())
                .andExpect(jsonPath("$.resultId").value(resultId))
                .andExpect(jsonPath("$.resolutionStatus").value("RESOLVED"))
                .andExpect(jsonPath("$.note").value("Confirmed external price is correct."))
                .andExpect(jsonPath("$.resolvedAt").exists());

        assertThat(resolutionRepository.count()).isEqualTo(1);
    }

    @Test
    void rejectsMatchedResultResolution() throws Exception {
        Long runId = createPriceMismatchRun();
        Long resultId = resultId(runId, ReconciliationStatus.MATCHED);

        mockMvc.perform(patch("/api/exceptions/{resultId}/resolve", resultId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resolutionStatus": "RESOLVED",
                                  "note": "No action needed."
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Matched reconciliation results cannot be resolved."));

        assertThat(resolutionRepository.count()).isZero();
    }

    @Test
    void rejectsOpenResolutionStatus() throws Exception {
        Long runId = createPriceMismatchRun();
        Long resultId = resultId(runId, ReconciliationStatus.PRICE_MISMATCH);

        mockMvc.perform(patch("/api/exceptions/{resultId}/resolve", resultId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resolutionStatus": "OPEN",
                                  "note": "Still under review."
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Resolution status must be RESOLVED or IGNORED."));

        assertThat(resolutionRepository.count()).isZero();
    }

    @Test
    void returnsNotFoundForUnknownReconciliationResult() throws Exception {
        mockMvc.perform(patch("/api/exceptions/{resultId}/resolve", 999L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resolutionStatus": "RESOLVED",
                                  "note": "Reviewed."
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Reconciliation result not found: 999"));
    }

    @Test
    void returnsBadRequestAndDoesNotPersistWhenCsvIsInvalid() throws Exception {
        MockMultipartFile internalFile = csv("internalFile", """
                trade_id,symbol,quantity,price,currency,trade_date
                T001,AAPL,-100,225.40,USD,2026-08-18
                """);
        MockMultipartFile externalFile = csv("externalFile", """
                trade_id,symbol,quantity,price,currency,trade_date
                T001,AAPL,100,225.40,USD,2026-08-18
                """);

        mockMvc.perform(multipart("/api/reconciliations")
                        .file(internalFile)
                        .file(externalFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("CSV validation failed."))
                .andExpect(jsonPath("$.errors[0].source").value("INTERNAL"))
                .andExpect(jsonPath("$.errors[0].lineNumber").value(2))
                .andExpect(jsonPath("$.errors[0].field").value("quantity"))
                .andExpect(jsonPath("$.errors[0].message").value("Value must be positive."));

        assertThat(runRepository.count()).isZero();
        assertThat(tradeRepository.count()).isZero();
        assertThat(resultRepository.count()).isZero();
    }

    private Long createPriceMismatchRun() throws Exception {
        MockMultipartFile internalFile = csv("internalFile", """
                trade_id,symbol,quantity,price,currency,trade_date
                T001,AAPL,100,225.40,USD,2026-08-18
                T002,MSFT,50,510.25,USD,2026-08-18
                """);
        MockMultipartFile externalFile = csv("externalFile", """
                trade_id,symbol,quantity,price,currency,trade_date
                T001,AAPL,100,225.40,USD,2026-08-18
                T002,MSFT,50,511.00,USD,2026-08-18
                """);

        mockMvc.perform(multipart("/api/reconciliations")
                        .file(internalFile)
                        .file(externalFile))
                .andExpect(status().isCreated());

        return runRepository.findAll().get(0).getId();
    }

    private Long createDuplicateRun() throws Exception {
        MockMultipartFile internalFile = csv("internalFile", """
                trade_id,symbol,quantity,price,currency,trade_date
                T001,AAPL,100,225.40,USD,2026-08-18
                T001,AAPL,100,225.40,USD,2026-08-18
                """);
        MockMultipartFile externalFile = csv("externalFile", """
                trade_id,symbol,quantity,price,currency,trade_date
                T001,AAPL,100,225.40,USD,2026-08-18
                """);

        mockMvc.perform(multipart("/api/reconciliations")
                        .file(internalFile)
                        .file(externalFile))
                .andExpect(status().isCreated());

        return runRepository.findAll().get(0).getId();
    }

    private Long resultId(Long runId, ReconciliationStatus status) {
        return resultRepository.findByRunIdAndStatusOrderById(runId, status).get(0).getId();
    }

    private MockMultipartFile csv(String partName, String content) {
        return new MockMultipartFile(
                partName,
                partName + ".csv",
                "text/csv",
                content.getBytes(StandardCharsets.UTF_8)
        );
    }
}
