import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';
import { PaginationMeta } from '../../../models/api.model';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();
  });

  function createWith(pagination: PaginationMeta): PaginationComponent {
    fixture = TestBed.createComponent(PaginationComponent);
    const component = fixture.componentInstance;
    component.pagination = pagination;
    fixture.detectChanges();
    return component;
  }

  it('render_WithPagination_ShowsCurrentPage', () => {
    createWith({ page: 2, page_size: 25, total_items: 75, total_pages: 3 });
    const info = fixture.nativeElement.querySelector('.pagination__info');
    expect(info.textContent).toContain('Page 2 of 3');
  });

  it('render_MiddlePage_BothButtonsEnabled', () => {
    createWith({ page: 2, page_size: 25, total_items: 75, total_pages: 3 });
    const buttons = fixture.nativeElement.querySelectorAll('.pagination__button');
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
  });

  it('render_FirstPage_PrevButtonDisabled', () => {
    createWith({ page: 1, page_size: 25, total_items: 75, total_pages: 3 });
    const prevButton = fixture.nativeElement.querySelectorAll('.pagination__button')[0];
    expect(prevButton.disabled).toBe(true);
  });

  it('render_LastPage_NextButtonDisabled', () => {
    createWith({ page: 3, page_size: 25, total_items: 75, total_pages: 3 });
    const nextButton = fixture.nativeElement.querySelectorAll('.pagination__button')[1];
    expect(nextButton.disabled).toBe(true);
  });

  it('goToPage_PrevButton_EmitsPageMinusOne', () => {
    const component = createWith({ page: 2, page_size: 25, total_items: 75, total_pages: 3 });
    const spy = vi.spyOn(component.pageChange, 'emit');
    const prevButton: HTMLButtonElement =
      fixture.nativeElement.querySelectorAll('.pagination__button')[0];
    prevButton.click();
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('goToPage_NextButton_EmitsPagePlusOne', () => {
    const component = createWith({ page: 2, page_size: 25, total_items: 75, total_pages: 3 });
    const spy = vi.spyOn(component.pageChange, 'emit');
    const nextButton: HTMLButtonElement =
      fixture.nativeElement.querySelectorAll('.pagination__button')[1];
    nextButton.click();
    expect(spy).toHaveBeenCalledWith(3);
  });

  it('goToPage_BelowRange_DoesNotEmit', () => {
    const component = createWith({ page: 2, page_size: 25, total_items: 75, total_pages: 3 });
    const spy = vi.spyOn(component.pageChange, 'emit');
    component.goToPage(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('goToPage_AboveRange_DoesNotEmit', () => {
    const component = createWith({ page: 2, page_size: 25, total_items: 75, total_pages: 3 });
    const spy = vi.spyOn(component.pageChange, 'emit');
    component.goToPage(4);
    expect(spy).not.toHaveBeenCalled();
  });

  it('render_Always_HasNavigationRole', () => {
    createWith({ page: 1, page_size: 25, total_items: 50, total_pages: 2 });
    expect(fixture.nativeElement.querySelector('[role="navigation"]')).toBeTruthy();
  });

  it('render_Buttons_HaveAriaLabels', () => {
    createWith({ page: 1, page_size: 25, total_items: 50, total_pages: 2 });
    const buttons = fixture.nativeElement.querySelectorAll('.pagination__button');
    expect(buttons[0].getAttribute('aria-label')).toBe('Previous page');
    expect(buttons[1].getAttribute('aria-label')).toBe('Next page');
  });

  it('render_SinglePage_BothButtonsDisabled', () => {
    createWith({ page: 1, page_size: 25, total_items: 5, total_pages: 1 });
    const buttons = fixture.nativeElement.querySelectorAll('.pagination__button');
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });
});
