package com.tradesync.api;

public class ReconciliationNotFoundException extends RuntimeException {

    public ReconciliationNotFoundException(Long runId) {
        super("Reconciliation run not found: " + runId);
    }
}
