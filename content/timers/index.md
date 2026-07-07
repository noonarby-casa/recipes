+++
title = "Timer Test Suite"
slug = "timers"
layout = "timers"
type = "timers"
+++

<div class="timers-grid">
  <!-- Card 1: Standard countdowns -->
  <div class="timers-card">
    <h2>1. Standard Countdowns</h2>
    <p>Verify that single-value timers run smoothly, update the time correctly, turn red at 0:00, and play the final alarm.</p>
    <div class="timers-list">
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">5 Seconds</span>
          <span class="timers-item-desc">Triggers final alarm at 0:00</span>
        </div>
        {{< timer "5 seconds" >}}
      </div>
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">15 Seconds</span>
          <span class="timers-item-desc">Tests standard pause and resume</span>
        </div>
        {{< timer "15 seconds" >}}
      </div>
    </div>
  </div>

  <!-- Card 2: Range & Intervals -->
  <div class="timers-card">
    <h2>2. Range & Intervals</h2>
    <p>Verify that range timers trigger the warning chime at the lower bound (orange) and the final alarm at the upper bound (red).</p>
    <div class="timers-list">
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">3 to 6 Seconds</span>
          <span class="timers-item-desc">Warning at 3s, Alarm at 6s</span>
        </div>
        {{< timer "3-6 seconds" >}}
      </div>
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">5 to 10 Seconds</span>
          <span class="timers-item-desc">Warning at 5s, Alarm at 10s</span>
        </div>
        {{< timer "5-10 seconds" >}}
      </div>
    </div>
  </div>

  <!-- Card 3: Syntax & Units -->
  <div class="timers-card">
    <h2>3. Alternate Units & Formats</h2>
    <p>Verify that the duration parser correctly handles decimals and alternative shorthand syntax variations.</p>
    <div class="timers-list">
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">Decimal Single (2.5s)</span>
          <span class="timers-item-desc">Decimal parsing</span>
        </div>
        {{< timer "2.5 seconds" >}}
      </div>
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">Decimal Range (1.5-3.5s)</span>
          <span class="timers-item-desc">Range parsing</span>
        </div>
        {{< timer "1.5-3.5 seconds" >}}
      </div>
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">Alternative Suffixes</span>
          <span class="timers-item-desc">Short hands</span>
        </div>
        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
          {{< timer "10s" >}}
          {{< timer "10 sec" >}}
          {{< timer "10 secs" >}}
        </div>
      </div>
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">Minutes (0.1m)</span>
          <span class="timers-item-desc">0.1 min (6 seconds)</span>
        </div>
        {{< timer "0.1 minutes" >}}
      </div>
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">Hours (0.002h)</span>
          <span class="timers-item-desc">0.002 hr (7.2 seconds)</span>
        </div>
        {{< timer "0.002 hours" >}}
      </div>
    </div>
  </div>

  <!-- Card 4: Screen Wake Lock -->
  <div class="timers-card">
    <h2>4. Wake Lock Reference Count</h2>
    <p>Start all three timers. The wake lock should stay active even if you pause 1 or 2, and release only when all 3 are paused/reset.</p>
    <div class="timers-list">
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">Timer A (10s)</span>
        </div>
        {{< timer "10 seconds" >}}
      </div>
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">Timer B (10s)</span>
        </div>
        {{< timer "10 seconds" >}}
      </div>
      <div class="timers-item">
        <div class="timers-item-left">
          <span class="timers-item-label">Timer C (10s)</span>
        </div>
        {{< timer "10 seconds" >}}
      </div>
    </div>
  </div>
</div>
