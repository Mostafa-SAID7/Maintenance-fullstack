import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () => import('./components/login/login.module').then(m => m.LoginModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./components/register/register.module').then(m => m.RegisterModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./components/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'cars',
    loadChildren: () => import('./components/car-list/car-list.module').then(m => m.CarListModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'cars/new',
    loadChildren: () => import('./components/car-form/car-form.module').then(m => m.CarFormModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'cars/:id/edit',
    loadChildren: () => import('./components/car-form/car-form.module').then(m => m.CarFormModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'maintenance',
    loadChildren: () => import('./components/maintenance-list/maintenance-list.module').then(m => m.MaintenanceListModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'chat',
    loadChildren: () => import('./components/chat/chat.module').then(m => m.ChatModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'predictions',
    loadChildren: () => import('./components/prediction/prediction.module').then(m => m.PredictionModule),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }