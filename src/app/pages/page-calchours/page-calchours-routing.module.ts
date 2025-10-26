import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PageCalchoursPage } from './page-calchours.page';

const routes: Routes = [
  {
    path: '',
    component: PageCalchoursPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PageCalchoursPageRoutingModule {}
