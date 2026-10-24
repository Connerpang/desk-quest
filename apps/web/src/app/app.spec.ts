import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  function render() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the product name', () => {
    const el = render().nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('DeskQuest');
  });

  it('shows the API as online when ready', async () => {
    const fixture = render();
    http.expectOne('/api/v1/health/ready').flush({ status: 'ok' });
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.api-status__value')?.textContent).toContain(
      'online',
    );
  });

  it('shows the API as offline when not ready', async () => {
    const fixture = render();
    http
      .expectOne('/api/v1/health/ready')
      .flush(
        { status: 'error', checks: { database: 'down' } },
        { status: 503, statusText: 'Service Unavailable' },
      );
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.api-status__value')?.textContent).toContain(
      'offline',
    );
  });
});
