<script lang="ts">
  import Modal from '../primitives/Modal.svelte';
  import { exportLedgerBackup, getLedgerStats } from '../../stores/planner';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let stats = $derived(getLedgerStats());
</script>

<Modal {isOpen} {onClose} title="Meal History Storage & Backup">
  <div class="storage-modal-body">
    <!-- Storage Usage Meter Card -->
    <div class="storage-meter-card">
      <div class="meter-header">
        <span class="meter-title">Browser LocalStorage Usage</span>
        <span class="meter-percentage">{stats.percent}% Used</span>
      </div>

      <div class="progress-bar-track">
        <div
          class="progress-bar-fill"
          style="width: {Math.min(100, Math.max(2, stats.percent))}%;"
          class:is-warning={stats.percent >= 70}
          class:is-danger={stats.percent >= 90}
        ></div>
      </div>

      <div class="meter-stats-row">
        <span>{stats.storageKb} KB used</span>
        <span>5,000 KB capacity (~40,000 meals)</span>
      </div>
    </div>

    <!-- History Stats Grid -->
    <div class="stats-summary-grid">
      <div class="stat-box">
        <span class="stat-val">{stats.totalMeals}</span>
        <span class="stat-lbl">Total Meals Logged</span>
      </div>
      <div class="stat-box">
        <span class="stat-val">{stats.totalDays}</span>
        <span class="stat-lbl">Active Calendar Days</span>
      </div>
    </div>

    <!-- Informational Note -->
    <div class="storage-info-note">
      <p>
        Your meal plan history is saved locally in your browser. With over 30 years of capacity, your history will stay safe and accessible.
      </p>
    </div>

    <!-- Backup Action Bar -->
    <div class="storage-modal-actions">
      <button
        type="button"
        class="btn btn-brand download-backup-btn"
        onclick={() => {
          exportLedgerBackup();
        }}
      >
        📥 Download History Backup (.JSON)
      </button>
    </div>
  </div>
</Modal>

<style>
  .storage-modal-body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1rem 1.5rem 1.5rem 1.5rem;
  }

  .storage-meter-card {
    background: var(--recipe-title-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1rem;
  }

  .meter-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .meter-title {
    font-size: 0.9rem;
    font-weight: 700;
  }

  .meter-percentage {
    color: var(--noonblue);
    font-size: 0.85rem;
    font-weight: 700;
  }

  .progress-bar-track {
    background: var(--font-controls-bg);
    border-radius: 6px;
    height: 10px;
    overflow: hidden;
    width: 100%;
  }

  .progress-bar-fill {
    background: var(--noonblue);
    border-radius: 6px;
    height: 100%;
    transition: width 0.3s ease;
  }

  .progress-bar-fill.is-warning {
    background: var(--warning-color);
  }

  .progress-bar-fill.is-danger {
    background: var(--danger-color);
  }

  .meter-stats-row {
    color: var(--text-muted);
    display: flex;
    font-size: 0.75rem;
    justify-content: space-between;
  }

  .stats-summary-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-box {
    align-items: center;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.85rem;
    text-align: center;
  }

  .stat-val {
    color: var(--noonblue);
    font-size: 1.5rem;
    font-weight: 800;
  }

  .stat-lbl {
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .storage-info-note {
    color: var(--text-muted);
    font-size: 0.825rem;
    line-height: 1.4;
  }

  .storage-modal-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }

  .download-backup-btn {
    width: 100%;
  }
</style>
