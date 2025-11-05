import { Routes } from '@angular/router';

export const carsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/car-list/car-list.component').then(c => c.CarListComponent),
    title: 'Cars - CarCommun'
  },
  {
    path: 'add',
    loadComponent: () => import('./components/car-form/car-form.component').then(c => c.CarFormComponent),
    title: 'Add Car - CarCommun'
  },
  {
    path: ':id',
    loadComponent: () => import('./components/car-details/car-details.component').then(c => c.CarDetailsComponent),
    title: 'Car Details - CarCommun'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/car-form/car-form.component').then(c => c.CarFormComponent),
    title: 'Edit Car - CarCommun'
  }
];