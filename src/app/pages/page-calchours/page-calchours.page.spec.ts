import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageCalchoursPage } from './page-calchours.page';

describe('PageCalchoursPage', () => {
  let component: PageCalchoursPage;
  let fixture: ComponentFixture<PageCalchoursPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PageCalchoursPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
