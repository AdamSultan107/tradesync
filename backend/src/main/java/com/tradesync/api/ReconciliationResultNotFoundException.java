package com.tradesync.api;

public class ReconciliationResultNotFoundException extends RuntimeException {

    public ReconciliationResultNotFoundException(Long resultId) {
        super("Reconciliation result not found: " + resultId);
    }
}
