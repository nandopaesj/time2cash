import { TestBed } from '@angular/core/testing';

import { Purchases } from './purchases';

describe('Purchases', () => {
  let service: Purchases;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Purchases);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
