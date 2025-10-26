import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-page-calchours',
  templateUrl: './page-calchours.page.html',
  styleUrls: ['./page-calchours.page.scss'],
  standalone: false,
})
export class PageCalchoursPage implements OnInit, OnDestroy {
  // inputs from navigation/query
  nomeProduto: string | null = null;
  precoProduto: number | null = null;

  // profile
  user: User | null = null;
  uid: string | null = null;
  salario_mensal: number | null = null;
  carga_horaria_semanal: number | null = null;

  // computed numeric values
  valorHora: number | null = null;
  horasNecessarias: number | null = null;
  diasNecessarios: number | null = null;

  // friendly strings
  formattedPreco = '-';
  formattedValorHora = '-';
  friendlyHours = '-';
  friendlyDays = '-';
  percentualSalario = '-';
  sugestaoTexto = '';

  loading = true;
  private authUnsub: (() => void) | null = null;

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private auth: Auth, private firestore: Firestore) {
    const nav = this.router.getCurrentNavigation();
    const stateNav = nav?.extras?.state ?? {};
    const historyState = window.history.state ?? {};
    const qp = this.activatedRoute.snapshot.queryParams ?? {};

    // prefer queryParams (persistem no refresh); fallbacks para state/history
    try {
      this.nomeProduto = decodeURIComponent(qp['nomeProduto'] || stateNav['nomeProduto'] || historyState['nomeProduto'] || '') || null;
    } catch {
      this.nomeProduto = qp['nomeProduto'] || stateNav['nomeProduto'] || historyState['nomeProduto'] || null;
    }

    const precoRaw = qp['precoProduto'] ?? stateNav['precoProduto'] ?? historyState['precoProduto'] ?? null;
    this.precoProduto = (precoRaw != null) ? Number(precoRaw) : null;
  }

  ngOnInit() {
    this.authUnsub = onAuthStateChanged(this.auth, async (u) => {
      this.user = u;
      this.uid = u?.uid ?? null;
      await this.loadProfileAndRecalculate();
      this.loading = false;
    });

    // react to query changes (e.g. if user modifies URL)
    this.activatedRoute.queryParams.subscribe(async (qp) => {
      if (qp['nomeProduto']) {
        try { this.nomeProduto = decodeURIComponent(qp['nomeProduto']); } catch { this.nomeProduto = qp['nomeProduto']; }
      }
      if (qp['precoProduto']) this.precoProduto = Number(qp['precoProduto']);
      await this.loadProfileAndRecalculate();
    });
  }

  ngOnDestroy() {
    if (this.authUnsub) this.authUnsub();
  }

  private async loadProfileAndRecalculate() {
    // fetch latest profile (if logged in)
    if (this.uid) {
      try {
        const ref = doc(this.firestore, `users/${this.uid}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          this.salario_mensal = (data['salario_mensal'] != null) ? Number(data['salario_mensal']) : null;
          this.carga_horaria_semanal = (data['carga_horaria_semanal'] != null) ? Number(data['carga_horaria_semanal']) : null;
        } else {
          this.salario_mensal = null;
          this.carga_horaria_semanal = null;
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        this.salario_mensal = null;
        this.carga_horaria_semanal = null;
      }
    }

    // validate inputs
    if (!this.precoProduto || isNaN(Number(this.precoProduto)) || Number(this.precoProduto) <= 0) {
      this.clearResults('Nenhuma simulação válida recebida. Volte e faça uma nova simulação.');
      return;
    }
    if (!this.salario_mensal || this.salario_mensal <= 0) {
      this.clearResults('Perfil incompleto: cadastre seu salário para simular.');
      return;
    }
    if (!this.carga_horaria_semanal || this.carga_horaria_semanal <= 0) {
      this.clearResults('Perfil incompleto: cadastre sua carga horária semanal para simular.');
      return;
    }

    // perform calculations explicitly
    const salario = Number(this.salario_mensal);
    const carga = Number(this.carga_horaria_semanal);
    const preco = Number(this.precoProduto);

    const horasMes = (carga * 52) / 12;
    const valorHoraCalc = salario / (horasMes || 1);
    const horasCalc = preco / (valorHoraCalc || 1);
    const horasPorDia = carga / 5; // assume 5 dias úteis (TODO: opção se trabalhar sabado??)
    const diasCalc = horasPorDia > 0 ? horasCalc / horasPorDia : horasCalc / 8;

    // armazena os res calculados
    this.valorHora = Number(valorHoraCalc);
    this.horasNecessarias = Number(horasCalc);
    this.diasNecessarios = Number(diasCalc);

    this.formatResults(preco, salario, carga);
  }

  // gpt que falou que era melhor fazer isso
  private formatResults(preco: number, salario: number, carga: number)
  {
    const nfBR = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    this.formattedPreco = nfBR.format(preco);
    this.formattedValorHora = (this.valorHora != null && !isNaN(this.valorHora)) ? nfBR.format(this.valorHora) : '-';

    const totalHours = this.horasNecessarias ?? 0;
    const hoursInt = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hoursInt) * 60);
    if (totalHours > 0)
    {
      const parts = [];
      if (hoursInt > 0) parts.push(`${hoursInt} h`);
      if (minutes > 0) parts.push(`${minutes} min`);
      this.friendlyHours = parts.length ? parts.join(' ') : '0 min';
    } else 
    {
      this.friendlyHours = '-';
    }

    const horasPorDia = carga / 5 || 8;
    const approx = Math.max(1, Math.round(horasPorDia));
    if ((this.horasNecessarias ?? 0) > 0)
    {
      if ((this.horasNecessarias ?? 0) < approx)
      {
        // menos de um dia vai mostrar horas e minutos
        this.friendlyDays = `Menos que 1 dia (${this.friendlyHours})`;
      }else 
      {
        const dias = Math.floor((this.horasNecessarias ?? 0) / approx);
        const restanteHoras = Math.round(((this.horasNecessarias ?? 0) - dias * approx) * 10) / 10;
        const restanteHorasInt = Math.floor(restanteHoras);
        const restanteMin = Math.round((restanteHoras - restanteHorasInt) * 60);
        const restParts = [];
        if (restanteHorasInt > 0) restParts.push(`${restanteHorasInt} h`);
        if (restanteMin > 0) restParts.push(`${restanteMin} min`);
        const restStr = restParts.length ? restParts.join(' ') : '0 min';
        this.friendlyDays = `${dias} dia(s) e ${restStr}`;
      }
    }else
    {
      this.friendlyDays = '-';
    }

    const percent = (preco / salario) * 100;
    const salarios = preco / salario;
    this.percentualSalario = `${this.formatNumber(percent, 1)} % do salário`;
    this.sugestaoTexto = this.shortSuggestion(this.horasNecessarias ?? 0);
  }

  private shortSuggestion(hours: number) {
    if (hours <= 0) return 'Nenhuma simulação recebida.';
    if (hours <= 8) return 'Compra de curto esforço — menos que um dia de trabalho.';
    if (hours <= 40) return 'Compra de esforço médio — algumas horas ou alguns dias.';
    if (hours <= 160) return 'Compra significativa — pode pagar em algumas semanas de trabalho.';
    return 'Compra de alto impacto no orçamento — avalie parcelamento ou poupar primeiro.';
  }

  private clearResults(message: string) {
    this.valorHora = null;
    this.horasNecessarias = null;
    this.diasNecessarios = null;
    this.formattedPreco = '-';
    this.formattedValorHora = '-';
    this.friendlyHours = '-';
    this.friendlyDays = '-';
    this.percentualSalario = '-';
    this.sugestaoTexto = message;
  }

  formatNumber(n: number | null, decimals = 2) {
    if (n == null || isNaN(n)) return '-';
    return Number(n).toFixed(decimals).replace('.', ',');
  }

  salvarCompra()
  {
    // tratamento rápido, mas deveria ser impedido pelo botão do calc já que ele já verifica se há dados
    if (!this.nomeProduto || !this.precoProduto || this.precoProduto <= 0)
    {
      alert('Dados inválidos da simulação. Não foi possível salvar.');
      return;
    }

    // monta objeto de compra com os dados básicos
    const purchase = {
      nome: this.nomeProduto,
      preco: this.precoProduto,
      valorHora: this.valorHora ?? null,
      horasNecessarias: this.horasNecessarias ?? null,
      diasNecessarios: this.diasNecessarios ?? null,
      formattedPreco: this.formattedPreco,
      dateCreated: new Date().toISOString()
    };

    // navega para página de confirmação passando o objeto purchase **via state**
    this.router.navigate(['/confirm-purchase'], { state: { purchase } });
  }

  voltar()
  {
    this.router.navigateByUrl('/tabs/calc');
  }
}
