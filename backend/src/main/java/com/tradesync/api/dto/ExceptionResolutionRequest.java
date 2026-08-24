package com.tradesync.api.dto;

import com.tradesync.persistence.entity.ResolutionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExceptionResolutionRequest(
        @NotNull
        ResolutionStatus resolutionStatus,

        @NotBlank
        @Size(max = 1000)
        String note
) {
}
