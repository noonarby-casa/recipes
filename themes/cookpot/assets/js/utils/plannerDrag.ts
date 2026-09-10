import type { PlannedItem } from '../types';

/**
 * Determines whether a DOM element or any of its ancestors is an interactive control.
 * Dragging should NOT be initiated when clicking/touching interactive controls.
 */
export function isControlTarget(el: HTMLElement | null): boolean {
  if (!el) {
    return false;
  }
  return !!el.closest(
    'button, input, select, textarea, a, .recipe-control-btn, .servings-picker-row, .portion-picker-row, .planner-action-btns, .planner-edit-controls-stacked, .day-header-add-btn, [role="button"]',
  );
}

/**
 * Finds the target day column for coordinates (x, y) using direct hit-test,
 * elementsFromPoint, and a generous proximity fallback so narrow gaps or edges
 * easily register as drop targets.
 */
export function findTargetDayColumn(
  x: number,
  y: number,
  proximityPx = 40,
): { dayCol: HTMLElement | null; targetCard: HTMLElement | null } {
  const dropEl = document.elementFromPoint(x, y) as HTMLElement | null;
  if (dropEl) {
    const directCol = dropEl.closest('.day-column') as HTMLElement | null;
    if (directCol) {
      const targetCard = dropEl.closest('.drag-wrapper') as HTMLElement | null;
      return { dayCol: directCol, targetCard };
    }
  }

  if (
    typeof document !== 'undefined' &&
    typeof document.elementsFromPoint === 'function'
  ) {
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
      const col = el.closest('.day-column') as HTMLElement | null;
      if (col) {
        const targetCard = el.closest('.drag-wrapper') as HTMLElement | null;
        return { dayCol: col, targetCard };
      }
    }
  }

  if (typeof document !== 'undefined') {
    let closestCol: HTMLElement | null = null;
    let closestDistance = Infinity;

    const allCols = document.querySelectorAll<HTMLElement>('.day-column');
    allCols.forEach((col) => {
      const rect = col.getBoundingClientRect();
      const dx = Math.max(rect.left - x, 0, x - rect.right);
      const dy = Math.max(rect.top - y, 0, y - rect.bottom);
      const dist = Math.hypot(dx, dy);

      if (dist <= proximityPx && dist < closestDistance) {
        closestDistance = dist;
        closestCol = col;
      }
    });

    if (closestCol) {
      return { dayCol: closestCol, targetCard: null };
    }
  }

  return { dayCol: null, targetCard: null };
}

/**
 * Reorders/moves a planned recipe item to a target day and position.
 */
export function movePlannedItem(
  plan: PlannedItem[],
  draggedInstanceId: string,
  targetDay: string,
  targetItemInstanceId?: string,
): PlannedItem[] {
  const allItems = [...plan];
  const draggedIdx = allItems.findIndex(
    (p) => p.instanceId === draggedInstanceId,
  );
  if (draggedIdx === -1) {
    return plan;
  }

  const draggedItem = allItems[draggedIdx];
  const updatedItem: PlannedItem = {
    ...draggedItem,
    date: targetDay,
    day: targetDay,
  };

  allItems.splice(draggedIdx, 1);

  if (targetItemInstanceId && targetItemInstanceId !== draggedInstanceId) {
    const targetIdx = allItems.findIndex(
      (p) => p.instanceId === targetItemInstanceId,
    );
    if (targetIdx !== -1) {
      allItems.splice(targetIdx, 0, updatedItem);
      return allItems;
    }
  }

  // Find position after the last item belonging to targetDay
  let lastIndexInTargetDay = -1;
  for (let i = allItems.length - 1; i >= 0; i--) {
    if ((allItems[i].date || allItems[i].day) === targetDay) {
      lastIndexInTargetDay = i;
      break;
    }
  }

  if (lastIndexInTargetDay !== -1) {
    allItems.splice(lastIndexInTargetDay + 1, 0, updatedItem);
  } else {
    allItems.push(updatedItem);
  }

  return allItems;
}

export interface TouchDragOptions {
  item: PlannedItem;
  editMode: boolean;
  onMove: (draggedId: string, targetDay: string, targetCardId?: string) => void;
  onRemove: (draggedId: string) => void;
}

let activeAvatar: HTMLElement | null = null;
let activeDragCleanup: (() => void) | null = null;

function removeAvatar() {
  if (activeAvatar && activeAvatar.parentNode) {
    activeAvatar.parentNode.removeChild(activeAvatar);
  }
  activeAvatar = null;
}

/**
 * Initiates a pointer/touch drag operation across mobile, tablet, and desktop.
 */
export function handlePointerDragStart(
  e: PointerEvent | TouchEvent,
  options: TouchDragOptions,
): void {
  if (!options.editMode) {
    return;
  }

  if (activeDragCleanup) {
    activeDragCleanup();
    activeDragCleanup = null;
  }

  const targetEl = e.target as HTMLElement | null;
  if (isControlTarget(targetEl)) {
    return;
  }

  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

  const startX = clientX;
  const startY = clientY;
  const draggedItem = options.item;

  let isDragging = false;
  let currentTargetDay: string | null = null;
  let currentTargetCardId: string | undefined = undefined;
  let isOverTrash = false;
  let autoScrollRaf: number | null = null;
  let currentScrollContainer: HTMLElement | null = null;
  let autoScrollSpeedY = 0;

  const cardWrapper = targetEl?.closest('.drag-wrapper') as HTMLElement | null;

  function clearHighlights() {
    document.querySelectorAll('.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });
  }

  function runAutoScroll() {
    if (!isDragging || autoScrollSpeedY === 0) {
      autoScrollRaf = null;
      return;
    }
    const container =
      currentScrollContainer || document.getElementById('col-planner');
    if (container) {
      container.scrollTop += autoScrollSpeedY;
    } else {
      window.scrollBy(0, autoScrollSpeedY);
    }
    autoScrollRaf = requestAnimationFrame(runAutoScroll);
  }

  function updateAutoScroll(moveY: number) {
    const container = document.getElementById('col-planner');
    if (container) {
      currentScrollContainer = container;
      const rect = container.getBoundingClientRect();
      const edgeThreshold = 70;
      if (moveY < rect.top + edgeThreshold && moveY >= rect.top - 20) {
        const factor = 1 - Math.max(0, (moveY - rect.top) / edgeThreshold);
        autoScrollSpeedY = -Math.max(3, Math.round(factor * 14));
      } else if (
        moveY > rect.bottom - edgeThreshold &&
        moveY <= rect.bottom + 20
      ) {
        const factor = 1 - Math.max(0, (rect.bottom - moveY) / edgeThreshold);
        autoScrollSpeedY = Math.max(3, Math.round(factor * 14));
      } else {
        autoScrollSpeedY = 0;
      }
    } else {
      const edgeThreshold = 70;
      const vh = window.innerHeight;
      if (moveY < edgeThreshold) {
        autoScrollSpeedY = -Math.round((1 - moveY / edgeThreshold) * 14);
      } else if (moveY > vh - edgeThreshold) {
        autoScrollSpeedY = Math.round((1 - (vh - moveY) / edgeThreshold) * 14);
      } else {
        autoScrollSpeedY = 0;
      }
    }

    if (autoScrollSpeedY !== 0 && autoScrollRaf === null) {
      autoScrollRaf = requestAnimationFrame(runAutoScroll);
    }
  }

  function onMove(moveEv: PointerEvent | TouchEvent) {
    const moveX =
      'touches' in moveEv ? moveEv.touches[0].clientX : moveEv.clientX;
    const moveY =
      'touches' in moveEv ? moveEv.touches[0].clientY : moveEv.clientY;

    if (!isDragging) {
      const dist = Math.hypot(moveX - startX, moveY - startY);
      if (dist < 6) {
        return;
      }

      isDragging = true;

      if (cardWrapper) {
        cardWrapper.classList.add('is-dragging');
      }

      const trashZone = document.getElementById('planner-trash-zone');
      if (trashZone) {
        trashZone.style.display = 'flex';
      }

      // Create drag avatar
      activeAvatar = document.createElement('div');
      activeAvatar.className = 'planner-drag-avatar';
      const img = cardWrapper?.querySelector(
        '.recipe-card-img',
      ) as HTMLImageElement | null;
      const title =
        cardWrapper?.querySelector('.recipe-card-title')?.textContent?.trim() ||
        'Recipe';

      if (img && img.src) {
        const avatarImg = document.createElement('img');
        avatarImg.src = img.src;
        avatarImg.alt = title;
        avatarImg.className = 'drag-avatar-img';
        activeAvatar.appendChild(avatarImg);
      }

      const label = document.createElement('span');
      label.className = 'drag-avatar-title';
      label.textContent = title;
      activeAvatar.appendChild(label);

      document.body.appendChild(activeAvatar);
    }

    if (isDragging) {
      if (moveEv.cancelable) {
        moveEv.preventDefault();
      }

      if (activeAvatar) {
        activeAvatar.style.left = `${moveX}px`;
        activeAvatar.style.top = `${moveY}px`;
      }

      updateAutoScroll(moveY);
      clearHighlights();

      const dropEl = document.elementFromPoint(
        moveX,
        moveY,
      ) as HTMLElement | null;
      const trashEl = dropEl?.closest('#planner-trash-zone');

      if (trashEl) {
        isOverTrash = true;
        currentTargetDay = null;
        currentTargetCardId = undefined;
        trashEl.classList.add('drag-over');
        return;
      }
      isOverTrash = false;

      const { dayCol, targetCard } = findTargetDayColumn(moveX, moveY);
      if (dayCol) {
        currentTargetDay = dayCol.dataset.day || null;
        currentTargetCardId = targetCard?.dataset.instanceId;

        dayCol.classList.add('drag-over');
        if (targetCard && targetCard !== cardWrapper) {
          targetCard.classList.add('drag-over');
        }
      } else {
        currentTargetDay = null;
        currentTargetCardId = undefined;
      }
    }
  }

  function onEnd() {
    activeDragCleanup = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onEnd);
    window.removeEventListener('pointercancel', onEnd);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onEnd);
    window.removeEventListener('touchcancel', onEnd);

    if (autoScrollRaf !== null) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
    autoScrollSpeedY = 0;

    if (cardWrapper) {
      cardWrapper.classList.remove('is-dragging');
    }

    clearHighlights();
    removeAvatar();

    const trashZone = document.getElementById('planner-trash-zone');
    if (trashZone) {
      trashZone.style.display = 'none';
    }

    if (isDragging) {
      if (isOverTrash) {
        options.onRemove(draggedItem.instanceId);
      } else if (currentTargetDay) {
        options.onMove(
          draggedItem.instanceId,
          currentTargetDay,
          currentTargetCardId,
        );
      }
    }
  }

  activeDragCleanup = onEnd;

  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onEnd);
  window.addEventListener('pointercancel', onEnd);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);
  window.addEventListener('touchcancel', onEnd);
}
