import { Routes } from '@angular/router';
import { AdminShellComponent } from './shell/admin-shell.component';
import { AdminHomeComponent } from './game-management/admin-home.component';
import { GameCreateComponent } from './game-management/game-create.component';
import { AdminGameDetailComponent } from './game-management/admin-game-detail.component';
import { GameEditComponent } from './game-management/game-edit.component';
import { DocumentDetailComponent } from './document-management/document-detail.component';
import { KgSummaryPlaceholderComponent } from './stubs/kg-summary-placeholder.component';
import { SessionBrowserPlaceholderComponent } from './stubs/session-browser-placeholder.component';
import { SettingsPlaceholderComponent } from './stubs/settings-placeholder.component';
import { UsageDashboardPlaceholderComponent } from './stubs/usage-dashboard-placeholder.component';

/**
 * Admin feature routes (curator role enforced by parent route guard).
 *
 * All routes render inside AdminShellComponent which provides the
 * sidebar navigation layout. Stub routes exist for features blocked
 * by upstream epics.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: '', component: AdminHomeComponent },
      { path: 'games/new', component: GameCreateComponent },
      { path: 'games/:gameId', component: AdminGameDetailComponent },
      { path: 'games/:gameId/edit', component: GameEditComponent },
      { path: 'games/:gameId/documents/:documentId', component: DocumentDetailComponent },
      { path: 'knowledge-graph', component: KgSummaryPlaceholderComponent },
      { path: 'sessions', component: SessionBrowserPlaceholderComponent },
      { path: 'settings', component: SettingsPlaceholderComponent },
      { path: 'usage', component: UsageDashboardPlaceholderComponent },
    ],
  },
];
