import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-calc',
  templateUrl: './calc.page.html',
  styleUrls: ['./calc.page.scss'],
  standalone: false,
})
export class CalcPage implements OnInit, OnDestroy {
  user: User | null = null;
  private authUnsub: (() => void) | null = null;
  loading = false;
  nomeProduto = '';
  precoProduto: number | null = null;

  uid: string | null = null;

  menuAberto = false;

  constructor(private router: Router, private auth: Auth, private firestore: Firestore) {}

  ngOnInit()
  {
    this.authUnsub = onAuthStateChanged(this.auth, (u) => {
      this.user = u;
      if (!u) {
        this.router.navigateByUrl('/login');
        return;
      }
      this.uid = u.uid;
    });
  }

  ngOnDestroy()
  {
    if (this.authUnsub) this.authUnsub();
  }

  validateInputs(): string | null
  {
    const nome = (this.nomeProduto || '').toString().trim();
    if (!nome || nome.length < 2) return 'Informe um nome válido para o produto.';
    if (this.precoProduto == null) return 'Informe o preço do produto.';
    const preco = Number(this.precoProduto);
    if (isNaN(preco) || preco <= 0) return 'Informe um preço maior que zero.';
    return null;
  }

  async simularCompra()
  {
    const err = this.validateInputs();
    if (err) { alert(err); return; }
    this.loading = true;
    const nome = encodeURIComponent(this.nomeProduto.trim());
    const preco = Number(this.precoProduto);

    // usa query, utilizar pelo link? (funcionando até agr então deixa ai)
    this.router.navigate(['/page-calchours'],
    {
      queryParams:
      {
        nomeProduto: nome,
        precoProduto: preco
      },
      state:
      {
        timestamp: Date.now()
      }
    });

    this.loading = false;
  }

  voltar()
  {
    this.router.navigateByUrl('/');
  }

  toggleMenu()
  {
    this.menuAberto = !this.menuAberto;
  }

  goToFixedExpenses()
  {
    this.menuAberto = false;
    this.router.navigateByUrl('/fixed-expenses');
  }
}
