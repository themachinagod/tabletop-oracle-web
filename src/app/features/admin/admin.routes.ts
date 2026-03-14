import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

/** Admin feature routes (protected by auth guard). */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      // Admin feature routes will be added during implementation
    ],
  },
];
