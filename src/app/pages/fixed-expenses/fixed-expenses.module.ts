import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FixedExpensesPageRoutingModule } from './fixed-expenses-routing.module';

import { FixedExpensesPage } from './fixed-expenses.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FixedExpensesPageRoutingModule
  ],
  declarations: [FixedExpensesPage]
})
export class FixedExpensesPageModule {}
