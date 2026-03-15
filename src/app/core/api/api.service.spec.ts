import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../config/environment';

interface TestItem {
  id: string;
  name: string;
}

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  const testItem: TestItem = { id: '1', name: 'Test' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should unwrap ApiResponse envelope and return data', async () => {
      const promise = firstValueFrom(service.get<TestItem>('/items/1'));

      const req = httpMock.expectOne(`${environment.apiUrl}/items/1`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ data: testItem, meta: { request_id: 'req-1' } });

      const result = await promise;
      expect(result).toEqual(testItem);
    });

    it('should pass HttpParams to the request', async () => {
      const params = new HttpParams().set('filter', 'active');
      const promise = firstValueFrom(service.get<TestItem>('/items/1', params));

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/items/1` && r.params.get('filter') === 'active',
      );
      req.flush({ data: testItem, meta: { request_id: 'req-2' } });

      const result = await promise;
      expect(result).toEqual(testItem);
    });

    it('should prepend baseUrl to the path', async () => {
      const promise = firstValueFrom(service.get<TestItem>('/items/1'));

      const req = httpMock.expectOne(`${environment.apiUrl}/items/1`);
      req.flush({ data: testItem, meta: { request_id: 'req-3' } });

      await promise;
      expect(req.request.url).toBe(`${environment.apiUrl}/items/1`);
    });
  });

  describe('getPaginated', () => {
    it('should unwrap PaginatedResponse and return PaginatedResult', async () => {
      const items: TestItem[] = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ];
      const pagination = {
        page: 1,
        page_size: 10,
        total_items: 2,
        total_pages: 1,
      };

      const promise = firstValueFrom(service.getPaginated<TestItem>('/items'));

      const req = httpMock.expectOne(`${environment.apiUrl}/items`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({
        data: items,
        meta: { request_id: 'req-4', pagination },
      });

      const result = await promise;
      expect(result.data).toEqual(items);
      expect(result.pagination).toEqual(pagination);
    });

    it('should pass HttpParams for pagination and filters', async () => {
      const params = new HttpParams().set('page', '2').set('page_size', '5');
      const promise = firstValueFrom(service.getPaginated<TestItem>('/items', params));

      const req = httpMock.expectOne(
        (r) =>
          r.url === `${environment.apiUrl}/items` &&
          r.params.get('page') === '2' &&
          r.params.get('page_size') === '5',
      );
      req.flush({
        data: [],
        meta: {
          request_id: 'req-5',
          pagination: {
            page: 2,
            page_size: 5,
            total_items: 12,
            total_pages: 3,
          },
        },
      });

      const result = await promise;
      expect(result.data).toEqual([]);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.total_pages).toBe(3);
    });
  });

  describe('post', () => {
    it('should unwrap ApiResponse envelope and return created resource', async () => {
      const body = { name: 'New Item' };
      const promise = firstValueFrom(service.post<TestItem>('/items', body));

      const req = httpMock.expectOne(`${environment.apiUrl}/items`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual(body);
      req.flush({ data: testItem, meta: { request_id: 'req-6' } });

      const result = await promise;
      expect(result).toEqual(testItem);
    });
  });

  describe('patch', () => {
    it('should unwrap ApiResponse envelope and return updated resource', async () => {
      const body = { name: 'Updated' };
      const updated = { ...testItem, name: 'Updated' };
      const promise = firstValueFrom(service.patch<TestItem>('/items/1', body));

      const req = httpMock.expectOne(`${environment.apiUrl}/items/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual(body);
      req.flush({ data: updated, meta: { request_id: 'req-7' } });

      const result = await promise;
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should send DELETE request with withCredentials', async () => {
      const promise = firstValueFrom(service.delete<void>('/items/1'));

      const req = httpMock.expectOne(`${environment.apiUrl}/items/1`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ data: undefined, meta: { request_id: 'req-8' } });

      await promise;
    });

    it('should unwrap the response envelope on delete', async () => {
      const promise = firstValueFrom(service.delete<TestItem>('/items/1'));

      const req = httpMock.expectOne(`${environment.apiUrl}/items/1`);
      req.flush({ data: testItem, meta: { request_id: 'req-9' } });

      const result = await promise;
      expect(result).toEqual(testItem);
    });
  });
});
