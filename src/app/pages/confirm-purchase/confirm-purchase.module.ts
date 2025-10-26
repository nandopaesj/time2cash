import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfirmPurchasePageRoutingModule } from './confirm-purchase-routing.module';

import { ConfirmPurchasePage } from './confirm-purchase.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfirmPurchasePageRoutingModule
  ],
  declarations: [ConfirmPurchasePage]
})
export class ConfirmPurchasePageModule {}
