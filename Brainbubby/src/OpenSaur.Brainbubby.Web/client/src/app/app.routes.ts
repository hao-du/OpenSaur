import { Routes } from '@angular/router';
import { authGuard } from '../features/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/projects/components/project-list/project-list.component').then(
        (m) => m.ProjectListComponent
      )
  },
  {
    path: 'templates',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/templates/components/template-list/template-list.component').then(
        (m) => m.TemplateListComponent
      )
  }
];

