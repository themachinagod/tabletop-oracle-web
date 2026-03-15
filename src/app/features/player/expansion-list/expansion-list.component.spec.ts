import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpansionDetail } from '../../../models/game.model';
import { ExpansionListComponent } from './expansion-list.component';

describe('ExpansionListComponent', () => {
  let component: ExpansionListComponent;
  let fixture: ComponentFixture<ExpansionListComponent>;

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
      description: null,
      year_published: 1998,
      is_active: true,
    },
    {
      id: 'exp-3',
      name: 'Traders & Barbarians',
      description: 'New scenarios and variants',
      year_published: null,
      is_active: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpansionListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpansionListComponent);
    component = fixture.componentInstance;
  });

  it('render_WithExpansions_ShowsAllExpansions', () => {
    component.expansions = mockExpansions;
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.expansion-list__item');
    expect(items.length).toBe(3);
  });

  it('render_WithExpansions_ShowsTitle', () => {
    component.expansions = mockExpansions;
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.expansion-list__title');
    expect(title.textContent).toContain('Expansions (3)');
  });

  it('render_ExpansionWithDescription_ShowsDescription', () => {
    component.expansions = [mockExpansions[0]];
    fixture.detectChanges();

    const description = fixture.nativeElement.querySelector('.expansion-list__description');
    expect(description.textContent).toContain('Explore the seas');
  });

  it('render_ExpansionWithoutDescription_HidesDescription', () => {
    component.expansions = [mockExpansions[1]];
    fixture.detectChanges();

    const description = fixture.nativeElement.querySelector('.expansion-list__description');
    expect(description).toBeNull();
  });

  it('render_ExpansionWithYear_ShowsYear', () => {
    component.expansions = [mockExpansions[0]];
    fixture.detectChanges();

    const year = fixture.nativeElement.querySelector('.expansion-list__year');
    expect(year.textContent).toContain('(1997)');
  });

  it('render_ExpansionWithoutYear_HidesYear', () => {
    component.expansions = [mockExpansions[2]];
    fixture.detectChanges();

    const year = fixture.nativeElement.querySelector('.expansion-list__year');
    expect(year).toBeNull();
  });

  it('render_ExpansionName_ShowsName', () => {
    component.expansions = [mockExpansions[0]];
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('.expansion-list__name');
    expect(name.textContent).toContain('Seafarers');
  });
});
