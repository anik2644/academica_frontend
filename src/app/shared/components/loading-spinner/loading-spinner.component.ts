import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
      style="animation: fade-in-up 0.2s ease-out both"
    >
      <div class="flex flex-col items-center rounded-3xl bg-white/95 px-10 py-8 shadow-2xl shadow-slate-900/20 backdrop-blur-sm"
           style="animation: fade-in-up 0.35s ease-out both">
        <!-- Animated spinner with rings -->
        <div class="relative flex h-16 w-16 items-center justify-center">
          <!-- Outer ring -->
          <div class="absolute inset-0 rounded-full border-[3px] border-primary-100"></div>
          <!-- Spinning arc -->
          <div class="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary-600"
               style="animation: spin-slow 0.9s linear infinite"></div>
          <!-- Inner dot -->
          <div class="h-2.5 w-2.5 rounded-full bg-primary-500"
               style="animation: pulse-soft 1.5s ease-in-out infinite"></div>
        </div>
        <p class="mt-5 text-sm font-medium text-slate-700">{{ message }}</p>
        <!-- Subtle progress dots -->
        <div class="mt-3 flex gap-1.5">
          <div *ngFor="let dot of [0,1,2]"
               class="h-1.5 w-1.5 rounded-full bg-primary-400"
               [style.animation]="'pulse-soft 1.4s ease-in-out infinite'"
               [style.animation-delay]="dot * 200 + 'ms'">
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  @Input() isLoading = false;
  @Input() message = 'Loading...';
}
