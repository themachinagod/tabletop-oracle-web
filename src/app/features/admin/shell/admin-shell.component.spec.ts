import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminShellComponent } from './admin-shell.component';

describe('AdminShellComponent', () => {
  let component: AdminShellComponent;
  let fixture: ComponentFixture<AdminShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('create_Default_ComponentExists', () => {
    expect(component).toBeTruthy();
  });

  it('sidebarOpen_Default_IsFalse', () => {
    expect(component.sidebarOpen()).toBe(false);
  });

  it('toggleSidebar_WhenClosed_OpensIt', () => {
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(true);
  });

  it('toggleSidebar_WhenOpen_ClosesIt', () => {
    component.toggleSidebar(); // open
    component.toggleSidebar(); // close
    expect(component.sidebarOpen()).toBe(false);
  });

  it('closeSidebar_WhenOpen_ClosesIt', () => {
    component.toggleSidebar(); // open
    component.closeSidebar();
    expect(component.sidebarOpen()).toBe(false);
  });

  it('render_Always_ContainsSidebarComponent', () => {
    const sidebar = fixture.nativeElement.querySelector('app-admin-sidebar');
    expect(sidebar).toBeTruthy();
  });

  it('render_Always_ContainsRouterOutlet', () => {
    const outlet = fixture.nativeElement.querySelector('router-outlet');
    expect(outlet).toBeTruthy();
  });

  it('render_Always_ContainsToggleButton', () => {
    const toggle = fixture.nativeElement.querySelector('.admin-shell__toggle');
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-label')).toBe('Toggle admin navigation');
  });

  it('toggle_AriaExpanded_ReflectsSidebarState', () => {
    const toggle = fixture.nativeElement.querySelector('.admin-shell__toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    component.toggleSidebar();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('overlay_WhenSidebarClosed_IsHidden', () => {
    expect(fixture.nativeElement.querySelector('.admin-shell__overlay')).toBeFalsy();
  });

  it('overlay_WhenSidebarOpen_IsVisible', () => {
    component.toggleSidebar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin-shell__overlay')).toBeTruthy();
  });

  it('overlay_OnClick_ClosesSidebar', () => {
    component.toggleSidebar();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.admin-shell__overlay');
    overlay.click();
    fixture.detectChanges();

    expect(component.sidebarOpen()).toBe(false);
  });
});
