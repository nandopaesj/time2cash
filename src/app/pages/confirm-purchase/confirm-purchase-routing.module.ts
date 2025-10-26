import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfirmPurchasePage } from './confirm-purchase.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmPurchasePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfirmPurchasePageRoutingModule {}
