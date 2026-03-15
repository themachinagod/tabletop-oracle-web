import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';

describe('AdminSidebarComponent', () => {
  let component: AdminSidebarComponent;
  let fixture: ComponentFixture<AdminSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('create_Default_ComponentExists', () => {
    expect(component).toBeTruthy();
  });

  it('navItems_Default_HasFiveItems', () => {
    expect(component.navItems.length).toBe(5);
  });

  it('navItems_GameLibrary_IsFirstAndEnabled', () => {
    expect(component.navItems[0].label).toBe('Game Library');
    expect(component.navItems[0].route).toBe('/admin');
    expect(component.navItems[0].disabled).toBe(false);
  });

  it('navItems_Enabled_GameLibraryAndSettings', () => {
    const enabledItems = component.navItems.filter((item) => !item.disabled);
    expect(enabledItems.length).toBe(2);
    expect(enabledItems[0].label).toBe('Game Library');
    expect(enabledItems[1].label).toBe('Settings');
  });

  it('navItems_Disabled_IncludesRemainingStubs', () => {
    const disabledLabels = component.navItems
      .filter((item) => item.disabled)
      .map((item) => item.label);
    expect(disabledLabels).toContain('Knowledge Graph');
    expect(disabledLabels).toContain('Sessions');
    expect(disabledLabels).toContain('Usage');
    expect(disabledLabels).not.toContain('Settings');
  });

  it('render_AllItems_RendersCorrectLinkCount', () => {
    const links = fixture.nativeElement.querySelectorAll('.admin-sidebar__link');
    // 5 nav items + 1 "Switch to Play" footer link
    expect(links.length).toBe(6);
  });

  it('render_EnabledItems_RenderedAsAnchorTags', () => {
    const anchors = fixture.nativeElement.querySelectorAll('a.admin-sidebar__link');
    // Game Library + Settings + Switch to Play
    expect(anchors.length).toBe(3);
  });

  it('render_DisabledItems_RenderedAsSpans', () => {
    const spans = fixture.nativeElement.querySelectorAll('span.admin-sidebar__link--disabled');
    expect(spans.length).toBe(3);
  });

  it('render_DisabledItems_ShowSoonBadge', () => {
    const badges = fixture.nativeElement.querySelectorAll('.admin-sidebar__badge');
    expect(badges.length).toBe(3);
    expect(badges[0].textContent.trim()).toBe('Soon');
  });

  it('render_DisabledItems_HaveAriaDisabled', () => {
    const disabled = fixture.nativeElement.querySelectorAll('[aria-disabled="true"]');
    expect(disabled.length).toBe(3);
  });

  it('render_Footer_ContainsSwitchToPlayLink', () => {
    const footer = fixture.nativeElement.querySelector('.admin-sidebar__footer');
    expect(footer).toBeTruthy();

    const footerLink = footer.querySelector('a');
    expect(footerLink).toBeTruthy();
    expect(footerLink.textContent).toContain('Switch to Play');
  });

  it('onNavClick_Always_EmitsNavigatedEvent', () => {
    const spy = vi.spyOn(component.navigated, 'emit');
    component.onNavClick();
    expect(spy).toHaveBeenCalled();
  });

  it('render_Sidebar_HasNavigationRole', () => {
    const sidebar = fixture.nativeElement.querySelector('[role="navigation"]');
    expect(sidebar).toBeTruthy();
    expect(sidebar.getAttribute('aria-label')).toBe('Admin navigation');
  });

  it('open_Default_IsTrue', () => {
    expect(component.open).toBe(true);
  });

  it('open_WhenTrue_AppliesOpenModifier', () => {
    component.open = true;
    fixture.detectChanges();
    const sidebar = fixture.nativeElement.querySelector('.admin-sidebar');
    expect(sidebar.classList.contains('admin-sidebar--open')).toBe(true);
  });

  it('open_WhenFalse_RemovesOpenModifier', () => {
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    const sidebar = fixture.nativeElement.querySelector('.admin-sidebar');
    expect(sidebar.classList.contains('admin-sidebar--open')).toBe(false);
  });
});
