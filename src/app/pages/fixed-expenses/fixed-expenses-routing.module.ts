import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FixedExpensesPage } from './fixed-expenses.page';

const routes: Routes = [
  {
    path: '',
    component: FixedExpensesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FixedExpensesPageRoutingModule {}
