import { Component, Input } from '@angular/core';

/**
 * Small chip displaying a tag name.
 *
 * Renders a compact, styled chip suitable for inline display
 * within cards and detail views.
 */
@Component({
  selector: 'app-tag-chip',
  standalone: true,
  template: ` <span class="tag-chip">{{ tag }}</span> `,
  styleUrl: './tag-chip.component.scss',
})
export class TagChipComponent {
  /** Tag name to display. */
  @Input({ required: true }) tag!: string;
}
