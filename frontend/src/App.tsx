import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { AppShell, type ViewKey } from './components/AppShell';
import {
  createReconciliation,
  getRecentReconciliationRuns,
  getReconciliationExceptions,
  getReconciliationResults,
  getReconciliationRun,
  resolveException,
  type ApiError,
  type ReconciliationResult,
  type ReconciliationRun,
  type ResolutionStatus,
} from './lib/api';
import { formatStatus, formatTradeId, toDisplayError } from './lib/format';
import { ExceptionsView } from './views/ExceptionsView';
import { ResultsView } from './views/ResultsView';
import { UploadView } from './views/UploadView';

type LoadState = 'idle' | 'submitting' | 'refreshing' | 'loadingRun';
type ResolutionAction = Extract<ResolutionStatus, 'RESOLVED' | 'IGNORED'>;

const DEFAULT_RESOLUTION_NOTE = 'Reviewed against source records.';

function App() {
  const [activeView, setActiveView] = useState<ViewKey>('upload');
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [externalFile, setExternalFile] = useState<File | null>(null);
  const [recentRuns, setRecentRuns] = useState<ReconciliationRun[]>([]);
  const [run, setRun] = useState<ReconciliationRun | null>(null);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [exceptions, setExceptions] = useState<ReconciliationResult[]>([]);
  const [selectedExceptionId, setSelectedExceptionId] = useState<number | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionAction>('RESOLVED');
  const [resolutionNote, setResolutionNote] = useState(DEFAULT_RESOLUTION_NOTE);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [resolvingResultId, setResolvingResultId] = useState<number | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const isBusy = loadState !== 'idle';
  const selectedException = useMemo(
    () =>
      exceptions.find((result) => result.resultId === selectedExceptionId) ??
      exceptions[0] ??
      null,
    [exceptions, selectedExceptionId],
  );

  useEffect(() => {
    void loadRecentRuns();
  }, []);

  async function loadRecentRuns() {
    setHistoryLoading(true);

    try {
      setRecentRuns(await getRecentReconciliationRuns());
      setHistoryError(null);
    } catch (error) {
      setHistoryError(toDisplayError(error).message);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadRunData(
    runId: number,
    preferredExceptionId: number | null = selectedExceptionId,
  ) {
    const [nextRun, nextResults, nextExceptions] = await Promise.all([
      getReconciliationRun(runId),
      getReconciliationResults(runId),
      getReconciliationExceptions(runId),
    ]);

    setRun(nextRun);
    setResults(nextResults);
    setExceptions(nextExceptions);
    syncSelectedException(nextExceptions, preferredExceptionId);
  }

  function syncSelectedException(
    nextExceptions: ReconciliationResult[],
    preferredExceptionId: number | null,
  ) {
    const nextSelected =
      nextExceptions.find((result) => result.resultId === preferredExceptionId) ??
      nextExceptions.find(
        (result) => result.resultId !== undefined && !result.latestResolution,
      ) ??
      nextExceptions.find((result) => result.resultId !== undefined) ??
      nextExceptions[0] ??
      null;

    setSelectedExceptionId(nextSelected?.resultId ?? null);
    setResolutionStatus(nextSelected?.latestResolution?.resolutionStatus ?? 'RESOLVED');
    setResolutionNote(nextSelected?.latestResolution?.note ?? DEFAULT_RESOLUTION_NOTE);
  }

  function handleViewChange(view: ViewKey) {
    setActiveView(view);
    setApiError(null);
    setNotice(null);
  }

  function handleSelectException(resultId: number | null) {
    const result = exceptions.find((exception) => exception.resultId === resultId);

    setSelectedExceptionId(resultId);
    setResolutionStatus(result?.latestResolution?.resolutionStatus ?? 'RESOLVED');
    setResolutionNote(result?.latestResolution?.note ?? DEFAULT_RESOLUTION_NOTE);
    setApiError(null);
    setNotice(null);
  }

  function handleReviewException(resultId: number) {
    handleSelectException(resultId);
    setActiveView('exceptions');
  }

  function handleInternalFile(file: File | null) {
    setInternalFile(file);
    setApiError(null);
    setNotice(null);
  }

  function handleExternalFile(file: File | null) {
    setExternalFile(file);
    setApiError(null);
    setNotice(null);
  }

  async function handleLoadRun(runId: number) {
    if (isBusy) {
      return;
    }

    if (run?.runId === runId) {
      setActiveView('results');
      return;
    }

    setLoadState('loadingRun');
    setApiError(null);
    setNotice(null);

    try {
      await loadRunData(runId, null);
      setNotice(`Run ${runId} loaded.`);
      setActiveView('results');
    } catch (error) {
      setApiError(toDisplayError(error));
    } finally {
      setLoadState('idle');
    }
  }

  async function handleCreateReconciliation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!internalFile || !externalFile || isBusy) {
      return;
    }

    setLoadState('submitting');
    setApiError(null);
    setNotice(null);

    try {
      const createdRun = await createReconciliation(internalFile, externalFile);
      await loadRunData(createdRun.runId, null);
      await loadRecentRuns();
      setNotice(`Run ${createdRun.runId} completed.`);
      setActiveView('results');
    } catch (error) {
      setApiError(toDisplayError(error));
      setActiveView('upload');
    } finally {
      setLoadState('idle');
    }
  }

  async function handleRefresh() {
    if (!run || isBusy) {
      return;
    }

    setLoadState('refreshing');
    setApiError(null);
    setNotice(null);

    try {
      await loadRunData(run.runId);
      await loadRecentRuns();
      setNotice(`Run ${run.runId} refreshed.`);
    } catch (error) {
      setApiError(toDisplayError(error));
    } finally {
      setLoadState('idle');
    }
  }

  async function handleResolveException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedException?.resultId || resolvingResultId !== null) {
      return;
    }

    if (resolutionNote.trim().length === 0) {
      setApiError({
        message: 'Resolution note is required.',
        errors: [{ field: 'note', message: 'must not be blank' }],
      });
      return;
    }

    setResolvingResultId(selectedException.resultId);
    setApiError(null);
    setNotice(null);

    try {
      await resolveException(
        selectedException.resultId,
        resolutionStatus,
        resolutionNote.trim(),
      );
      setNotice(`${formatTradeId(selectedException)} marked ${formatStatus(resolutionStatus)}.`);

      if (run) {
        await loadRunData(run.runId, null);
      }
    } catch (error) {
      setApiError(toDisplayError(error));
    } finally {
      setResolvingResultId(null);
    }
  }

  const currentView =
    activeView === 'results' ? (
      <ResultsView
        run={run}
        results={results}
        error={apiError}
        notice={notice}
        onOpenExceptions={() => handleViewChange('exceptions')}
        onReviewException={handleReviewException}
      />
    ) : activeView === 'exceptions' ? (
      <ExceptionsView
        run={run}
        exceptions={exceptions}
        selectedException={selectedException}
        selectedExceptionId={selectedExceptionId}
        resolutionStatus={resolutionStatus}
        resolutionNote={resolutionNote}
        resolvingResultId={resolvingResultId}
        error={apiError}
        notice={notice}
        onSelectException={handleSelectException}
        onResolutionStatus={setResolutionStatus}
        onResolutionNote={setResolutionNote}
        onResolve={handleResolveException}
      />
    ) : (
      <UploadView
        internalFile={internalFile}
        externalFile={externalFile}
        isSubmitting={loadState === 'submitting'}
        error={apiError}
        notice={notice}
        onInternalFile={handleInternalFile}
        onExternalFile={handleExternalFile}
        onSubmit={handleCreateReconciliation}
      />
    );

  return (
    <AppShell
      activeView={activeView}
      run={run}
      recentRuns={recentRuns}
      isBusy={isBusy}
      isRefreshing={loadState === 'refreshing'}
      isHistoryLoading={historyLoading || loadState === 'loadingRun'}
      historyError={historyError}
      onViewChange={handleViewChange}
      onSelectRun={handleLoadRun}
      onRefresh={handleRefresh}
    >
      {currentView}
    </AppShell>
  );
}

export default App;
