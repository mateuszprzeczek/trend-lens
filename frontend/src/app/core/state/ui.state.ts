import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UIStateService {
  private _loadingCount = signal<number>(0);
  readonly isLoadingGlobal = computed<boolean>(() => this._loadingCount() > 0);

  startLoading(): void {
    this._loadingCount.update((c) => c + 1);
  }

  stopLoading(): void {
    this._loadingCount.update((c) => (c > 0 ? c - 1 : 0));
  }
}
