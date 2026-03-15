import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './core/auth/login/login.component';

/**
 * Top-level application routes.
 *
 * /login is public. All other routes are protected by AuthGuard.
 * /admin/* additionally requires the curator role.
 */
export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/player/play-home/play-home.component').then(
            (m) => m.PlayHomeComponent,
          ),
      },
      {
        path: 'games',
        loadComponent: () =>
          import('./features/player/game-browser/game-browser.component').then(
            (m) => m.GameBrowserComponent,
          ),
      },
      {
        path: 'games/:gameId',
        loadComponent: () =>
          import('./features/player/game-detail/game-detail.component').then(
            (m) => m.GameDetailComponent,
          ),
      },
      {
        path: 'admin',
        canActivate: [authGuard],
        data: { role: 'curator' },
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
