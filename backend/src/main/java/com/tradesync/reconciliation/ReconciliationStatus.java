package com.tradesync.reconciliation;

public enum ReconciliationStatus {
    MATCHED,
    MISSING_INTERNAL,
    MISSING_EXTERNAL,
    PRICE_MISMATCH,
    QUANTITY_MISMATCH,
    CURRENCY_MISMATCH,
    DUPLICATE
}
