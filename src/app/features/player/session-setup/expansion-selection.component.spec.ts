import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpansionDetail } from '../../../models/game.model';
import { ExpansionSelectionComponent } from './expansion-selection.component';

describe('ExpansionSelectionComponent', () => {
  let component: ExpansionSelectionComponent;
  let fixture: ComponentFixture<ExpansionSelectionComponent>;

  const mockExpansions: ExpansionDetail[] = [
    {
      id: 'exp-1',
      name: 'Seafarers',
      description: 'Explore the seas',
      year_published: 1997,
      is_active: true,
    },
    {
      id: 'exp-2',
      name: 'Cities & Knights',
      description: 'Advanced gameplay',
      year_published: 1998,
      is_active: true,
    },
    {
      id: 'exp-3',
      name: 'Traders & Barbarians',
      description: null,
      year_published: 2007,
      is_active: true,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExpansionSelectionComponent],
    });

    fixture = TestBed.createComponent(ExpansionSelectionComponent);
    component = fixture.componentInstance;
    component.expansions = mockExpansions;
    fixture.detectChanges();
  });

  it('toggleExpansion_NotSelected_AddsToSelection', () => {
    component.selectedIds = [];
    const emitSpy = vi.spyOn(component.selectionChange, 'emit');

    component.toggleExpansion('exp-1');

    expect(emitSpy).toHaveBeenCalledWith(['exp-1']);
  });

  it('toggleExpansion_AlreadySelected_RemovesFromSelection', () => {
    component.selectedIds = ['exp-1', 'exp-2'];
    const emitSpy = vi.spyOn(component.selectionChange, 'emit');

    component.toggleExpansion('exp-1');

    expect(emitSpy).toHaveBeenCalledWith(['exp-2']);
  });

  it('toggleExpansion_MultipleSelections_PreservesOthers', () => {
    component.selectedIds = ['exp-1'];
    const emitSpy = vi.spyOn(component.selectionChange, 'emit');

    component.toggleExpansion('exp-2');

    expect(emitSpy).toHaveBeenCalledWith(['exp-1', 'exp-2']);
  });

  it('toggleExpansion_EmptyInitial_CreatesNewArray', () => {
    component.selectedIds = [];
    const emitSpy = vi.spyOn(component.selectionChange, 'emit');

    component.toggleExpansion('exp-3');

    expect(emitSpy).toHaveBeenCalledWith(['exp-3']);
  });

  it('render_WithExpansions_ShowsBaseGameIndicator', () => {
    const element: HTMLElement = fixture.nativeElement;
    const baseLabel = element.querySelector('.expansion-selection__base-label');

    expect(baseLabel?.textContent).toContain('Base Game (always included)');
  });

  it('render_WithExpansions_ShowsAllExpansionNames', () => {
    const element: HTMLElement = fixture.nativeElement;
    const names = element.querySelectorAll('.expansion-selection__name');

    expect(names.length).toBe(3);
    expect(names[0].textContent).toContain('Seafarers');
    expect(names[1].textContent).toContain('Cities & Knights');
    expect(names[2].textContent).toContain('Traders & Barbarians');
  });

  it('render_ExpansionWithDescription_ShowsDescription', () => {
    const element: HTMLElement = fixture.nativeElement;
    const descriptions = element.querySelectorAll('.expansion-selection__description');

    expect(descriptions.length).toBe(2);
    expect(descriptions[0].textContent).toContain('Explore the seas');
  });

  it('render_ExpansionWithoutDescription_OmitsDescription', () => {
    const element: HTMLElement = fixture.nativeElement;
    const items = element.querySelectorAll('.expansion-selection__item');
    const lastItemDescriptions = items[2].querySelectorAll('.expansion-selection__description');

    expect(lastItemDescriptions.length).toBe(0);
  });

  it('render_SelectedExpansion_CheckboxIsChecked', () => {
    const fresh = TestBed.createComponent(ExpansionSelectionComponent);
    fresh.componentInstance.expansions = mockExpansions;
    fresh.componentInstance.selectedIds = ['exp-1'];
    fresh.detectChanges();

    const element: HTMLElement = fresh.nativeElement;
    const checkboxes = element.querySelectorAll<HTMLInputElement>('.expansion-selection__checkbox');

    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
  });
});
