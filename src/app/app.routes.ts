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
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
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
