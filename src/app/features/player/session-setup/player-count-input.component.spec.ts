import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerCountInputComponent } from './player-count-input.component';

describe('PlayerCountInputComponent', () => {
  let component: PlayerCountInputComponent;
  let fixture: ComponentFixture<PlayerCountInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PlayerCountInputComponent],
    });

    fixture = TestBed.createComponent(PlayerCountInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('increment', () => {
    it('increment_NullValue_EmitsMinimum', () => {
      component.value = null;
      const emitSpy = vi.spyOn(component.valueChange, 'emit');

      component.increment();

      expect(emitSpy).toHaveBeenCalledWith(1);
    });

    it('increment_ValidValue_IncrementsByOne', () => {
      component.value = 3;
      const emitSpy = vi.spyOn(component.valueChange, 'emit');

      component.increment();

      expect(emitSpy).toHaveBeenCalledWith(4);
    });

    it('increment_AtMaximum_DoesNotEmit', () => {
      component.value = 20;
      const emitSpy = vi.spyOn(component.valueChange, 'emit');

      component.increment();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('decrement', () => {
    it('decrement_ValidValue_DecrementsByOne', () => {
      component.value = 5;
      const emitSpy = vi.spyOn(component.valueChange, 'emit');

      component.decrement();

      expect(emitSpy).toHaveBeenCalledWith(4);
    });

    it('decrement_AtMinimum_DoesNotEmit', () => {
      component.value = 1;
      const emitSpy = vi.spyOn(component.valueChange, 'emit');

      component.decrement();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('decrement_NullValue_DoesNotEmit', () => {
      component.value = null;
      const emitSpy = vi.spyOn(component.valueChange, 'emit');

      component.decrement();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('onInput', () => {
    it('onInput_ValidNumber_EmitsValue', () => {
      const emitSpy = vi.spyOn(component.valueChange, 'emit');
      const event = { target: { value: '4' } } as unknown as Event;

      component.onInput(event);

      expect(emitSpy).toHaveBeenCalledWith(4);
    });

    it('onInput_EmptyString_EmitsNull', () => {
      const emitSpy = vi.spyOn(component.valueChange, 'emit');
      const event = { target: { value: '' } } as unknown as Event;

      component.onInput(event);

      expect(emitSpy).toHaveBeenCalledWith(null);
    });

    it('onInput_AboveMaximum_ClampsToMaximum', () => {
      const emitSpy = vi.spyOn(component.valueChange, 'emit');
      const event = { target: { value: '25' } } as unknown as Event;

      component.onInput(event);

      expect(emitSpy).toHaveBeenCalledWith(20);
    });

    it('onInput_BelowMinimum_ClampsToMinimum', () => {
      const emitSpy = vi.spyOn(component.valueChange, 'emit');
      const event = { target: { value: '0' } } as unknown as Event;

      component.onInput(event);

      expect(emitSpy).toHaveBeenCalledWith(1);
    });

    it('onInput_NonNumeric_EmitsNull', () => {
      const emitSpy = vi.spyOn(component.valueChange, 'emit');
      const event = { target: { value: 'abc' } } as unknown as Event;

      component.onInput(event);

      expect(emitSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('render', () => {
    it('render_ShowsLabel', () => {
      const element: HTMLElement = fixture.nativeElement;
      const label = element.querySelector('.player-count__label');

      expect(label?.textContent).toContain('Player Count (optional)');
    });

    it('render_NullValue_DecrementDisabled', () => {
      // value is null by default from beforeEach
      const element: HTMLElement = fixture.nativeElement;
      const buttons = element.querySelectorAll<HTMLButtonElement>('.player-count__btn');

      expect(buttons[0].disabled).toBe(true);
    });

    it('render_AtMinimum_DecrementDisabled', () => {
      const fresh = TestBed.createComponent(PlayerCountInputComponent);
      fresh.componentInstance.value = 1;
      fresh.detectChanges();

      const element: HTMLElement = fresh.nativeElement;
      const buttons = element.querySelectorAll<HTMLButtonElement>('.player-count__btn');

      expect(buttons[0].disabled).toBe(true);
    });

    it('render_AtMaximum_IncrementDisabled', () => {
      const fresh = TestBed.createComponent(PlayerCountInputComponent);
      fresh.componentInstance.value = 20;
      fresh.detectChanges();

      const element: HTMLElement = fresh.nativeElement;
      const buttons = element.querySelectorAll<HTMLButtonElement>('.player-count__btn');

      expect(buttons[1].disabled).toBe(true);
    });
  });
});
