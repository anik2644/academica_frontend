import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
      <ol class="flex space-x-2">
        <li>
          <a routerLink="/" class="text-primary-600 hover:text-primary-700">
            Dashboard
          </a>
        </li>
        <li *ngFor="let breadcrumb of breadcrumbs; let last = last">
          <span class="text-gray-500">/</span>
          <a
            [routerLink]="breadcrumb.url"
            [class.text-gray-500]="last"
            [class.text-primary-600]="!last"
            [class.hover:text-primary-700]="!last"
            class="ml-2"
          >
            {{ breadcrumb.label }}
          </a>
        </li>
      </ol>
    </nav>
  `,
  styles: [],
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs = this.getBreadcrumbs(this.activatedRoute.root);
      });
  }

  private getBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    const ROUTE_DATA_BREADCRUMB = 'breadcrumb';

    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map((segment) => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data[ROUTE_DATA_BREADCRUMB];
      if (label) {
        breadcrumbs.push({ label, url });
      }

      return this.getBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
