import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiQueryParams, ApiQueryPrimitive } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = API_CONFIG.apiBaseUrl;

  constructor(private http: HttpClient) {}

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  get<T>(endpoint: string, params?: ApiQueryParams): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.http.get<T>(this.buildUrl(endpoint), { params: httpParams });
  }

  post<T, B = unknown>(endpoint: string, body: B): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body);
  }

  put<T, B = unknown>(endpoint: string, body: B): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), body);
  }

  patch<T, B = unknown>(endpoint: string, body?: B): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint), body ?? {});
  }

  delete<T>(endpoint: string, params?: ApiQueryParams): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint), {
      params: this.buildParams(params),
    });
  }

  private buildParams(params?: ApiQueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      const values = Array.isArray(value)
        ? value
        : ([value] as ApiQueryPrimitive[]);

      if (values.length > 1) {
        values.forEach((item) => {
          httpParams = httpParams.append(key, this.serializeParam(item));
        });
        return;
      }

      httpParams = httpParams.set(key, this.serializeParam(values[0]));
    });

    return httpParams;
  }

  private serializeParam(value: ApiQueryPrimitive): string {
    return String(value);
  }
}
