package com.tradesync.api;

import com.tradesync.persistence.repository.ExceptionResolutionRepository;
import com.tradesync.persistence.repository.ReconciliationResultRepository;
import com.tradesync.persistence.repository.ReconciliationRunRepository;
import com.tradesync.persistence.repository.TradeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
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

    private MockMultipartFile csv(String partName, String content) {
        return new MockMultipartFile(
                partName,
                partName + ".csv",
                "text/csv",
                content.getBytes(StandardCharsets.UTF_8)
        );
    }
}
