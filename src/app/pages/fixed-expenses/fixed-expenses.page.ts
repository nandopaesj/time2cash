import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';

import { Router } from '@angular/router';
import { PurchasesService } from 'src/app/services/purchases';

@Component({
  selector: 'app-fixed-expenses',
  templateUrl: './fixed-expenses.page.html',
  styleUrls: ['./fixed-expenses.page.scss'],
  standalone: false
})

export class FixedExpensesPage implements OnInit, OnDestroy
{
  user: User | null = null;
  uid: string | null = null;
  private authUnsub: (() => void) | null = null;

  loading = false;
  expenses: any[] = [];

  name = '';
  amount: number | null = null;
  note = '';

  constructor(private auth: Auth, private purchasesService: PurchasesService, private router: Router) {}

  ngOnInit()
  {
    this.authUnsub = onAuthStateChanged(this.auth, async (u) => {
      this.user = u;
      if (!u)
      {
        this.router.navigateByUrl('/login');
        return;
      }
      this.uid = u.uid;
      await this.loadExpenses();
    });
  }

  ngOnDestroy()
  {
    if (this.authUnsub) this.authUnsub();
  }

  async loadExpenses() {
    if (!this.uid) return;
    this.loading = true;
    try {
      this.expenses = await this.purchasesService.getFixedExpenses(this.uid);
    } catch (err) {
      console.error(err);
      this.expenses = [];
    } finally {
      this.loading = false;
    }
  }

  async addExpense()
  {
    if (!this.uid) return;
    const nome = (this.name || '').toString().trim();
    const amt = Number(this.amount || 0);
    if (!nome || amt <= 0) { alert('Informe nome e valor válidos.'); return; }
    this.loading = true;
    try {
      await this.purchasesService.addFixedExpense(this.uid, { name: nome, amount: amt, note: this.note });
      this.name = '';
      this.amount = null;
      this.note = '';
      await this.loadExpenses();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar.');
    } finally {
      this.loading = false;
    }
  }

  async deleteExpense(id: string)
  {
    if (!this.uid) return;
    if (!confirm('Excluir gasto fixo?')) return;
    this.loading = true;
    try {
      await this.purchasesService.deleteFixedExpense(this.uid, id);
      await this.loadExpenses();
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
