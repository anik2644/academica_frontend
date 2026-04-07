import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notificationService: NotificationService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message;
        } else {
          // Server-side error
          if (error.status === 400) {
            errorMessage = error.error?.message || 'Invalid request';
          } else if (error.status === 401) {
            errorMessage = 'Unauthorized. Please log in.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied';
          } else if (error.status === 404) {
            errorMessage = 'Resource not found';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again.';
          } else {
            errorMessage = error.error?.message || `Error: ${error.statusText}`;
          }
        }

        this.notificationService.error(errorMessage);
        return throwError(() => error);
      })
    );
  }
}
