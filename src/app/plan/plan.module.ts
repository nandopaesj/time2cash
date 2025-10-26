import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanPage } from './plan.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { PlanPageRoutingModule } from './plan-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    PlanPageRoutingModule
  ],
  declarations: [PlanPage]
})
export class PlanPageModule {}
