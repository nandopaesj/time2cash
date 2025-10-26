import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmPurchasePage } from './confirm-purchase.page';

describe('ConfirmPurchasePage', () => {
  let component: ConfirmPurchasePage;
  let fixture: ComponentFixture<ConfirmPurchasePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmPurchasePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
