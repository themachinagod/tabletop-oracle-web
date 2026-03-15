import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComplexityBadgeComponent } from './complexity-badge.component';

describe('ComplexityBadgeComponent', () => {
  let component: ComplexityBadgeComponent;
  let fixture: ComponentFixture<ComplexityBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplexityBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComplexityBadgeComponent);
    component = fixture.componentInstance;
  });

  it('render_Light_ShowsLightLabel', () => {
    component.level = 'light';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.complexity-badge');
    expect(badge.textContent.trim()).toBe('Light');
  });

  it('render_Medium_ShowsMediumLabel', () => {
    component.level = 'medium';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.complexity-badge');
    expect(badge.textContent.trim()).toBe('Medium');
  });

  it('render_Heavy_ShowsHeavyLabel', () => {
    component.level = 'heavy';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.complexity-badge');
    expect(badge.textContent.trim()).toBe('Heavy');
  });

  it('render_Light_HasLightClass', () => {
    component.level = 'light';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.complexity-badge--light');
    expect(badge).toBeTruthy();
  });

  it('render_Medium_HasMediumClass', () => {
    component.level = 'medium';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.complexity-badge--medium');
    expect(badge).toBeTruthy();
  });

  it('render_Heavy_HasHeavyClass', () => {
    component.level = 'heavy';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.complexity-badge--heavy');
    expect(badge).toBeTruthy();
  });

  it('displayLabel_Light_ReturnsCapitalised', () => {
    component.level = 'light';
    expect(component.displayLabel).toBe('Light');
  });

  it('displayLabel_Heavy_ReturnsCapitalised', () => {
    component.level = 'heavy';
    expect(component.displayLabel).toBe('Heavy');
  });
});
