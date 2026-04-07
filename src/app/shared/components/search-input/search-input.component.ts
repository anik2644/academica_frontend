import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      <input
        type="text"
        [(ngModel)]="searchValue"
        (ngModelChange)="onSearchChange()"
        [placeholder]="placeholder"
        class="form-input pl-10"
      />
      <svg
        class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  `,
  styles: [],
})
export class SearchInputComponent {
  @Input() placeholder = 'Search...';
  @Input() debounceMs = 300;
  @Output() search = new EventEmitter<string>();

  searchValue = '';
  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(debounceTime(this.debounceMs))
      .subscribe((value) => {
        this.search.emit(value);
      });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchValue);
  }
}
