import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  // {
  //   path: '',
  //   redirectTo: 'login',
  //   pathMatch: 'full'
  // },
  {
    path: 'page-calchours',
    loadChildren: () => import('./pages/page-calchours/page-calchours.module').then( m => m.PageCalchoursPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/login/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/profile.module').then( m => m.ProfilePageModule)
  },
  {
    path: 'confirm-purchase',
    loadChildren: () => import('./pages/confirm-purchase/confirm-purchase.module').then( m => m.ConfirmPurchasePageModule)
  },
  {
    path: 'fixed-expenses',
    loadChildren: () => import('./pages/fixed-expenses/fixed-expenses.module').then( m => m.FixedExpensesPageModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
