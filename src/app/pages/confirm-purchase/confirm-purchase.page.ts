import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { PurchasesService } from 'src/app/services/purchases';

interface Purchase
{
  nome: string;
  preco: number;
  valorHora?: number | null;
  horasNecessarias?: number | null;
  diasNecessarios?: number | null;
  formattedPreco?: string;
  dateCreated?: string;
}

@Component({
  selector: 'app-confirm-purchase',
  templateUrl: './confirm-purchase.page.html',
  styleUrls: ['./confirm-purchase.page.scss'],
  standalone: false,
})

export class ConfirmPurchasePage implements OnInit
{
  purchase: Purchase;

  parcelas: number = 1;
  jurosPercent: number = 0;
  parcelaValor: number = 0;
  totalComJuros: number = 0;

  constructor(private router: Router, private purchasesService: PurchasesService, private auth: Auth)
  {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? window.history.state ?? {};
    this.purchase = state?.purchase ?? null;
  }

  ngOnInit()
  {
    if (!this.purchase)
    {
      alert('Nenhuma compra recebida. Voltando.');
      this.router.navigateByUrl('/tabs/calc');
      return;
    }

    this.updateParcelas();
  }

  updateParcelas()
  {
    const preco = Number(this.purchase?.preco ?? 0);
    const juros = Number(this.jurosPercent ?? 0);
    this.totalComJuros = preco * (1 + juros / 100);
    this.parcelaValor = this.parcelas > 0 ? this.totalComJuros / this.parcelas : this.totalComJuros;
  }

  async confirmar()
  {
    const user = this.auth.currentUser;
    if (!user)
    {
      alert('Usuário não autenticado. Faça login.');
      return;
    }

    const uid = user.uid;
    console.log('Salvando compra para uid:', uid);

    const plannedPurchase =
    {
      name: this.purchase.nome,
      price: Number(this.purchase.preco),
      totalWithInterest: Number(this.totalComJuros || this.purchase.preco),
      parcelas: Number(this.parcelas),
      parcelaValor: Number(this.parcelaValor),
      month: new Date(this.purchase.dateCreated || Date.now()).getMonth(),
      year: new Date(this.purchase.dateCreated || Date.now()).getFullYear(),
      committedMonth: (new Date().getFullYear() * 100) + (new Date().getMonth() + 1),
      // notes: this.purchase.notes ?? null,
      status: 'confirmed'
    };

    try
    {
      const id = await this.purchasesService.addPurchase(uid, plannedPurchase);
      console.log('Compra salva com id:', id);
      alert('Compra salva com sucesso!');
      this.router.navigate(['/tabs/plan'], { state: { plannedPurchaseId: id } });
    }catch (err: any)
    {
      console.error('Erro ao salvar compra:', err);
      alert('Erro ao salvar compra: ' + (err.message || err));
    }
  }

  cancelar()
  {
    this.router.navigateByUrl('/page-calchours');
  }
}
