import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FixedExpensesPage } from './fixed-expenses.page';

describe('FixedExpensesPage', () => {
  let component: FixedExpensesPage;
  let fixture: ComponentFixture<FixedExpensesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FixedExpensesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
