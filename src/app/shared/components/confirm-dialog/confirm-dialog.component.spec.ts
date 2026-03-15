import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();
  });

  function createWith(
    opts: {
      open?: boolean;
      title?: string;
      message?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      destructive?: boolean;
    } = {},
  ): ConfirmDialogComponent {
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    const component = fixture.componentInstance;
    component.title = opts.title ?? 'Archive Session';
    component.message = opts.message ?? 'Are you sure you want to archive this session?';
    component.open = opts.open ?? true;
    if (opts.confirmLabel !== undefined) component.confirmLabel = opts.confirmLabel;
    if (opts.cancelLabel !== undefined) component.cancelLabel = opts.cancelLabel;
    if (opts.destructive !== undefined) component.destructive = opts.destructive;
    fixture.detectChanges();
    return component;
  }

  it('render_WhenOpen_ShowsDialog', () => {
    createWith({ open: true });
    expect(fixture.nativeElement.querySelector('.confirm-dialog')).toBeTruthy();
  });

  it('render_WhenClosed_HidesDialog', () => {
    createWith({ open: false });
    expect(fixture.nativeElement.querySelector('.confirm-dialog')).toBeNull();
  });

  it('render_Always_DisplaysTitle', () => {
    createWith();
    const title = fixture.nativeElement.querySelector('.confirm-dialog__title');
    expect(title.textContent).toContain('Archive Session');
  });

  it('render_Always_DisplaysMessage', () => {
    createWith();
    const message = fixture.nativeElement.querySelector('.confirm-dialog__message');
    expect(message.textContent).toContain('Are you sure');
  });

  it('render_DefaultLabels_ShowsConfirmAndCancel', () => {
    createWith();
    const confirm = fixture.nativeElement.querySelector('.confirm-dialog__confirm');
    const cancel = fixture.nativeElement.querySelector('.confirm-dialog__cancel');
    expect(confirm.textContent.trim()).toBe('Confirm');
    expect(cancel.textContent.trim()).toBe('Cancel');
  });

  it('render_CustomLabels_ShowsCustomText', () => {
    createWith({ confirmLabel: 'Archive', cancelLabel: 'Keep' });
    const confirm = fixture.nativeElement.querySelector('.confirm-dialog__confirm');
    const cancel = fixture.nativeElement.querySelector('.confirm-dialog__cancel');
    expect(confirm.textContent.trim()).toBe('Archive');
    expect(cancel.textContent.trim()).toBe('Keep');
  });

  it('confirm_OnClick_EmitsConfirmedEvent', () => {
    const component = createWith();
    const spy = vi.spyOn(component.confirmed, 'emit');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.confirm-dialog__confirm',
    );
    button.click();
    expect(spy).toHaveBeenCalled();
  });

  it('cancel_OnClick_EmitsCancelledEvent', () => {
    const component = createWith();
    const spy = vi.spyOn(component.cancelled, 'emit');
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('.confirm-dialog__cancel');
    button.click();
    expect(spy).toHaveBeenCalled();
  });

  it('cancel_OverlayClick_EmitsCancelledEvent', () => {
    const component = createWith();
    const spy = vi.spyOn(component.cancelled, 'emit');
    const overlay: HTMLElement = fixture.nativeElement.querySelector('.confirm-dialog__overlay');
    overlay.click();
    expect(spy).toHaveBeenCalled();
  });

  it('render_WhenOpen_HasAlertDialogRole', () => {
    createWith();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
  });

  it('render_WhenOpen_HasAriaModal', () => {
    createWith();
    expect(fixture.nativeElement.querySelector('[aria-modal="true"]')).toBeTruthy();
  });

  it('render_Destructive_AppliesDestructiveClass', () => {
    createWith({ destructive: true });
    expect(
      fixture.nativeElement.querySelector('.confirm-dialog__confirm--destructive'),
    ).toBeTruthy();
  });

  it('render_NotDestructive_NoDestructiveClass', () => {
    createWith({ destructive: false });
    expect(fixture.nativeElement.querySelector('.confirm-dialog__confirm--destructive')).toBeNull();
  });
});
