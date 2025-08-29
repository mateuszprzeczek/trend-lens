import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snack = inject(MatSnackBar);

  show(message: string, action: string = 'OK', duration = 3500) {
    this.snack.open(message, action, { duration });
  }

  success(message: string) {
    this.snack.open(message, 'OK', { duration: 2500 });
  }

  error(message: string) {
    this.snack.open(message, 'Zamknij', { duration: 5000 });
  }
}
