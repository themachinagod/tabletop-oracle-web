import { Routes } from '@angular/router';

/** Top-level application routes with lazy-loaded feature modules. */
export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./features/player/player.routes').then((m) => m.PLAYER_ROUTES),
  },
];
