import { Component } from '@angular/core';

/**
 * Placeholder home page component.
 *
 * Renders the authenticated user's landing page.
 * Will be replaced with actual content in later epics.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="home-container">
      <h1>Welcome to Tabletop Oracle</h1>
      <p>You are signed in.</p>
    </div>
  `,
  styles: [
    `
      .home-container {
        padding: 2rem;
        text-align: center;
      }
    `,
  ],
})
export class HomeComponent {}
