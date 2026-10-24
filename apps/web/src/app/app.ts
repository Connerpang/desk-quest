import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import type { HealthResponse } from '@deskquest/contracts';
import { catchError, map, of } from 'rxjs';

type ApiStatus = 'checking' | 'online' | 'offline';

@Component({
  imports: [RouterOutlet],
  selector: 'dq-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly http = inject(HttpClient);

  protected readonly apiStatus = toSignal(
    this.http.get<HealthResponse>('/api/v1/health/ready').pipe(
      map((res): ApiStatus => (res.status === 'ok' ? 'online' : 'offline')),
      catchError(() => of<ApiStatus>('offline')),
    ),
    { initialValue: 'checking' as ApiStatus },
  );
}
