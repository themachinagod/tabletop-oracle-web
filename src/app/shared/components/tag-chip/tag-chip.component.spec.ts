import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagChipComponent } from './tag-chip.component';

describe('TagChipComponent', () => {
  let fixture: ComponentFixture<TagChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagChipComponent],
    }).compileComponents();
  });

  function createWith(tag: string): TagChipComponent {
    fixture = TestBed.createComponent(TagChipComponent);
    const component = fixture.componentInstance;
    component.tag = tag;
    fixture.detectChanges();
    return component;
  }

  it('render_WithTag_DisplaysTagName', () => {
    createWith('strategy');
    const chip = fixture.nativeElement.querySelector('.tag-chip');
    expect(chip.textContent.trim()).toBe('strategy');
  });

  it('render_WithDifferentTag_DisplaysCorrectName', () => {
    createWith('cooperative');
    const chip = fixture.nativeElement.querySelector('.tag-chip');
    expect(chip.textContent.trim()).toBe('cooperative');
  });

  it('render_Always_HasTagChipClass', () => {
    createWith('strategy');
    const chip = fixture.nativeElement.querySelector('.tag-chip');
    expect(chip).toBeTruthy();
  });
});
