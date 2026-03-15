import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../config/environment';
import { ApiResponse, PaginatedResponse, PaginatedResult } from '../../models/api.model';

/**
 * Base HTTP client service with F001 envelope unwrapping.
 *
 * All API responses follow the F001 envelope format (`{ data, meta }`).
 * This service unwraps the envelope automatically so feature services
 * receive typed domain objects directly. `withCredentials: true` is set
 * on every request to ensure the session cookie is sent (also enforced
 * by AuthInterceptor as a safety net).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  /**
   * Send a GET request and unwrap a single-resource envelope.
   *
   * @param path - API path relative to base URL (e.g., '/games/123').
   * @param params - Optional HTTP query parameters.
   * @returns Observable of the unwrapped resource.
   */
  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, {
        params,
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Send a GET request and unwrap a paginated collection envelope.
   *
   * Returns both the data array and pagination metadata, stripping
   * the outer envelope and flattening the pagination into a
   * `PaginatedResult`.
   *
   * @param path - API path relative to base URL (e.g., '/games').
   * @param params - Optional HTTP query parameters (page, page_size, filters).
   * @returns Observable of the unwrapped paginated result.
   */
  getPaginated<T>(path: string, params?: HttpParams): Observable<PaginatedResult<T>> {
    return this.http
      .get<PaginatedResponse<T>>(`${this.baseUrl}${path}`, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((response) => ({
          data: response.data,
          pagination: response.meta.pagination,
        })),
      );
  }

  /**
   * Send a POST request and unwrap the response envelope.
   *
   * @param path - API path relative to base URL.
   * @param body - Request body payload.
   * @returns Observable of the unwrapped created resource.
   */
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Send a PATCH request and unwrap the response envelope.
   *
   * @param path - API path relative to base URL.
   * @param body - Partial update payload.
   * @returns Observable of the unwrapped updated resource.
   */
  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Send a PUT request and unwrap the response envelope.
   *
   * @param path - API path relative to base URL.
   * @param body - Request body payload.
   * @returns Observable of the unwrapped updated resource.
   */
  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Send a DELETE request and unwrap the response envelope.
   *
   * @param path - API path relative to base URL.
   * @returns Observable of the unwrapped response (typically void).
   */
  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Send a POST request with multipart/form-data and unwrap the response envelope.
   *
   * Used for file uploads. The caller builds the FormData object.
   * Content-Type is NOT set explicitly — the browser adds the
   * multipart boundary automatically.
   *
   * @param path - API path relative to base URL.
   * @param formData - FormData payload containing file and metadata.
   * @returns Observable of the unwrapped created resource.
   */
  postMultipart<T>(path: string, formData: FormData): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, formData, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }
}
