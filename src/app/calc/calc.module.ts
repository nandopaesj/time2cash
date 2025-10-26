import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalcPage } from './calc.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { CalcPageRoutingModule } from './calc-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    CalcPageRoutingModule
  ],
  declarations: [CalcPage]
})
export class CalcPageModule {}
