import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { DocumentProcessingService } from '../../../core/services/document-processing.service';
import { ProcessingEvent } from '../../../models/processing-event.model';
import { DocumentProcessingStatusComponent } from './document-processing-status.component';

describe('DocumentProcessingStatusComponent', () => {
  let component: DocumentProcessingStatusComponent;
  let fixture: ComponentFixture<DocumentProcessingStatusComponent>;
  let processingSubject: Subject<ProcessingEvent>;
  let mockProcessingService: { watchProcessing: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    processingSubject = new Subject<ProcessingEvent>();
    mockProcessingService = {
      watchProcessing: vi.fn().mockReturnValue(processingSubject.asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentProcessingStatusComponent],
      providers: [{ provide: DocumentProcessingService, useValue: mockProcessingService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentProcessingStatusComponent);
    component = fixture.componentInstance;
  });

  function initWith(status: 'uploaded' | 'parsing' | 'processed' | 'error'): void {
    component.documentId = 'doc-123';
    component.status = status;
    fixture.detectChanges();
  }

  it('should create', () => {
    initWith('uploaded');
    expect(component).toBeTruthy();
  });

  describe('SSE subscription', () => {
    it('should subscribe when status is uploaded', () => {
      initWith('uploaded');
      expect(mockProcessingService.watchProcessing).toHaveBeenCalledWith('doc-123');
    });

    it('should subscribe when status is parsing', () => {
      initWith('parsing');
      expect(mockProcessingService.watchProcessing).toHaveBeenCalledWith('doc-123');
    });

    it('should not subscribe when status is processed', () => {
      initWith('processed');
      expect(mockProcessingService.watchProcessing).not.toHaveBeenCalled();
    });

    it('should not subscribe when status is error', () => {
      initWith('error');
      expect(mockProcessingService.watchProcessing).not.toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    it('should set current stage on started event', () => {
      initWith('uploaded');
      processingSubject.next({
        type: 'started',
        documentId: 'doc-123',
        filename: 'rules.pdf',
      });

      expect(component.currentStage()).toBe('Starting');
      expect(component.progress()).toBe(0);
    });

    it('should update stage label on stage event', () => {
      initWith('parsing');
      processingSubject.next({
        type: 'stage',
        stage: 'extracting',
        progress: 0.4,
      });

      expect(component.currentStage()).toBe('Extracting Text');
      expect(component.progress()).toBe(0.4);
    });

    it('should use raw stage name when no label mapping exists', () => {
      initWith('parsing');
      processingSubject.next({
        type: 'stage',
        stage: 'future_stage',
        progress: 0.5,
      });

      expect(component.currentStage()).toBe('future_stage');
    });

    it('should clear stage and set progress to 1 on completed event', () => {
      initWith('parsing');
      const emitSpy = vi.spyOn(component.processingChanged, 'emit');

      processingSubject.next({
        type: 'completed',
        documentId: 'doc-123',
        chunkCount: 42,
      });

      expect(component.currentStage()).toBeNull();
      expect(component.progress()).toBe(1);
      expect(component.isStreaming()).toBe(false);
      expect(emitSpy).toHaveBeenCalledWith({
        type: 'completed',
        documentId: 'doc-123',
        chunkCount: 42,
      });
    });

    it('should set error message on error event', () => {
      initWith('parsing');
      const emitSpy = vi.spyOn(component.processingChanged, 'emit');

      processingSubject.next({
        type: 'error',
        documentId: 'doc-123',
        code: 'PARSE_ERROR',
        message: 'Could not extract text',
      });

      expect(component.streamErrorMessage()).toBe('Could not extract text');
      expect(component.isStreaming()).toBe(false);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should ignore unknown events', () => {
      initWith('parsing');
      processingSubject.next({ type: 'unknown' });

      expect(component.isStreaming()).toBe(true);
      expect(component.currentStage()).toBeNull();
    });
  });

  describe('connection error handling', () => {
    it('should show connection error when SSE stream errors', () => {
      initWith('uploaded');
      processingSubject.error(new Error('connection lost'));

      expect(component.connectionError()).toBeTruthy();
      expect(component.isStreaming()).toBe(false);
    });
  });

  describe('static display', () => {
    it('should show error message for error status documents', () => {
      component.documentId = 'doc-123';
      component.status = 'error';
      component.errorMessage = 'Parse failure';
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Parse failure');
    });

    it('should show processed info for processed documents', () => {
      component.documentId = 'doc-123';
      component.status = 'processed';
      component.chunkCount = 42;
      component.processedAt = '2026-03-14T10:00:00Z';
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Processed');
      expect(el.textContent).toContain('42 chunks');
    });
  });
});
