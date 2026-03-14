import { Routes } from '@angular/router';

/** Admin feature routes (curator role enforced by parent route guard). */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    children: [
      // Admin feature routes will be added during implementation
    ],
  },
];
