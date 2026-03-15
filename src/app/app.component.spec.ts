import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';

describe('AppComponent', () => {
  let mockAuthService: {
    user$: BehaviorSubject<null>;
    isAuthenticated$: BehaviorSubject<boolean>;
  };

  beforeEach(async () => {
    mockAuthService = {
      user$: new BehaviorSubject<null>(null),
      isAuthenticated$: new BehaviorSubject<boolean>(false),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have the correct title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toBe('tabletop-oracle-web');
  });

  it('should not show navigation when unauthenticated', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('app-navigation');
    expect(nav).toBeNull();
  });

  it('should show navigation when authenticated', () => {
    mockAuthService.isAuthenticated$.next(true);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('app-navigation');
    expect(nav).not.toBeNull();
  });

  it('should always render main content area', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const main = fixture.nativeElement.querySelector('.app-content');
    expect(main).not.toBeNull();
  });
});
