import { Component, OnDestroy, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { PurchasesService } from '../services/purchases';
import { AlertController, ViewWillEnter } from '@ionic/angular';

@Component({
  selector: 'app-plan',
  templateUrl: './plan.page.html',
  styleUrls: ['./plan.page.scss'],
  standalone: false,
})

export class PlanPage implements OnInit, OnDestroy, ViewWillEnter
{
  user: User | null = null;
  uid: string | null = null;
  private authUnsub: (() => void) | null = null;

  accountCreatedAt: Date = new Date();
  years: number[] = [];

  selectedYear!: number;
  selectedMonth!: number; // 0..11 (TODO: SERIA NECESSÁRIO CORRIGIR O RANGE DE 1 PRA 12?)

  monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  loading = true;

  purchasesThisMonth: any[] = [];

  parcelsThisMonth: any[] = [];

  monthlyCommitted = 0;
  monthlyTotal = 0;

  maxAvailableYM: number = 0;

  fixedTotal = 0;
  salary: number | null = null;
  percentOfSalary: number | null = null;

  constructor(
  private auth: Auth,
  private firestore: Firestore,
  private purchasesService: PurchasesService,
  private alertCtrl: AlertController
  ) {}

  // por causa do tabs, a página não recarregava ao entrar
  async ionViewWillEnter()
  {
    if (!this.uid) return;
    this.loading = true;
    await this.loadPurchasesFor(this.selectedMonth, this.selectedYear);
    this.loading = false;
  }

  ngOnInit()
  {
    this.authUnsub = onAuthStateChanged(this.auth, async (u) => {
      this.user = u;
      if (!u)
      {
        this.loading = false;
        return;
      }
      this.uid = u.uid;

      const metaCreation = (u as any)?.metadata?.creationTime;
      if (metaCreation)
      {
        this.accountCreatedAt = new Date(metaCreation);
      }else
      {
        try
        {
          const ref = doc(this.firestore, `users/${this.uid}`);
          const snap = await getDoc(ref);
          if (snap.exists())
          {
            const data = snap.data() as any;

            if (data?.createdAt)
            {
              const val = data.createdAt;
              this.accountCreatedAt = (val?.toDate) ? val.toDate() : new Date(val);
            }
          }
        }catch (err)
        {
          console.warn('Não foi possível ler createdAt do Firestore:', err);
        }
      }

      this.buildYears();
      const now = new Date();
      this.selectedYear = now.getFullYear();
      this.selectedMonth = now.getMonth();

      const creationYear = this.accountCreatedAt.getFullYear();
      const creationMonth = this.accountCreatedAt.getMonth();
      if (this.selectedYear === creationYear && this.selectedMonth < creationMonth)
      {
        this.selectedMonth = creationMonth;
      }

      this.maxAvailableYM = this.toYYYYMM(now.getFullYear(), now.getMonth());

      await this.determineMaxAvailableYM(this.uid);

      this.buildYears();

      await this.loadPurchasesFor(this.selectedMonth, this.selectedYear);

      this.loading = false;
    });
  }

  ngOnDestroy()
  {
    if (this.authUnsub) this.authUnsub();
  }

  private buildYears()
  {
    const startYear = this.accountCreatedAt.getFullYear();
    const maxYear = Math.floor(this.maxAvailableYM / 100);
    const currentYear = Math.max(new Date().getFullYear(), maxYear);
    this.years = [];
    for (let y = startYear; y <= currentYear; y++) this.years.push(y);
  }

  monthsForYear(year: number): number[] {
    const creationYear = this.accountCreatedAt.getFullYear();
    const creationMonth = this.accountCreatedAt.getMonth();

    const maxYear = Math.floor(this.maxAvailableYM / 100);
    const maxMonth1 = this.maxAvailableYM % 100;

    let start = 0;
    let end = 11;

    if (year === creationYear) start = creationMonth;
    if (year === maxYear) end = maxMonth1 - 1; // CONVERTER DE 12 PRA 11 PRA FICAR NO RANGE, FALEI Q ERA MELHOR VER ISSO

    // se maxYear < year significa que não há meses para esse ano ****(mas buildYears evita (OU DEVERIA NÉ) isso)****
    const months: number[] = [];
    for (let m = start; m <= end; m++) months.push(m);
    return months;
  }

  async selectYear(year: number)
  {
    this.selectedYear = year;
    const months = this.monthsForYear(year);
    if (!months.includes(this.selectedMonth)) this.selectedMonth = months[0];
    await this.loadPurchasesFor(this.selectedMonth, this.selectedYear);
  }

  async selectMonth(monthIndex: number)
  {
    this.selectedMonth = monthIndex;
    await this.loadPurchasesFor(this.selectedMonth, this.selectedYear);
  }

  // carrega as compras específicas pro mes selecionado, pra evitar muitos requests firebase
  async loadPurchasesFor(monthIndex: number, year: number)
  {
    this.loading = true;
    this.purchasesThisMonth = [];
    this.parcelsThisMonth = [];
    this.monthlyCommitted = 0;
    this.monthlyTotal = 0;

    const user = this.auth.currentUser;
    if (!user)
    {
      this.loading = false;
      return;
    }

    try {
      const data = await this.purchasesService.getPurchasesForMonth(user.uid, monthIndex, year);

      // desenvolve os dados recebidos (gpt malou nessa)
      this.purchasesThisMonth = data.map((d: any) => ({
        id: d.id,
        name: d.name || d.nome || d.title || 'Compra',
        price: Number(d.price ?? d.preco ?? 0),
        installments: Number(d.installments ?? d.parcelas ?? 1),
        installmentValue: Number(d.installmentValue ?? d.parcelaValor ?? (d.price ?? d.preco ?? 0) / Math.max(1, (d.installments ?? d.parcelas ?? 1))),
        startCommittedMonth: Number(d.startCommittedMonth ?? d.startYM ?? 0),
        endCommittedMonth: Number(d.endCommittedMonth ?? d.endYM ?? 0),
        confirmedAt: d.confirmedAt ? (d.confirmedAt.toDate ? d.confirmedAt.toDate() : d.confirmedAt) : null
      }));

      // converte purchases e separa as parcelas que caem no mês selecionado
      const selectedYM = this.toYYYYMM(year, monthIndex);
      const parcelas: any[] = [];
      for (const p of this.purchasesThisMonth) {
        const diff = this.monthsDiff(p.startCommittedMonth, selectedYM); // 0-based index
        if (diff >= 0 && diff < p.installments) {
          parcelas.push({
            purchaseId: p.id,
            name: p.name,
            installmentIndex: diff + 1,
            installmentValue: Number(p.installmentValue),
            totalInstallments: p.installments,
            confirmedAt: p.confirmedAt,
            originalPrice: p.price
          });
        }
      }

      this.parcelsThisMonth = parcelas;

      // somas
      this.monthlyCommitted = parcelas.reduce((acc, it) => acc + Number(it.installmentValue || 0), 0);
      this.monthlyTotal = this.purchasesThisMonth.reduce((acc, it) => acc + Number(it.originalPrice || it.price || 0), 0);

    } catch (err) {
      console.error('Erro ao carregar compras:', err);
    } finally {
      this.loading = false;
    }
  }

  // pede confirmação e, se confirmada, deleta a purchase inteira pelo id (remove todas as parcelas)
  async confirmAndDeletePurchase(purchaseId: string, purchaseName: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar exclusão',
      message: `Excluir definitivamente "${purchaseName}" e todas as suas parcelas? Esta ação não pode ser desfeita.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            await this.deletePurchaseAndRefresh(purchaseId);
          }
        }
      ],
      backdropDismiss: false
    });

    await alert.present();
  }

  // executa a exclusão via service e atualiza view/limites
  private async deletePurchaseAndRefresh(purchaseId: string)
  {
    if (!this.uid) return;
    this.loading = true;
    try
    {
      await this.purchasesService.deletePurchase(this.uid, purchaseId);
      // após exclusão, recalcula maxAvailableYM (caso esse item fosse o que definia o fim)
      // re-roda determineMaxAvailableYM e depois recarrega o mês atual
      // reset maxAvailableYM para mês atual antes de recalcular
      const now = new Date();
      this.maxAvailableYM = this.toYYYYMM(now.getFullYear(), now.getMonth());
      await this.determineMaxAvailableYM(this.uid);
      this.buildYears();
      await this.loadPurchasesFor(this.selectedMonth, this.selectedYear);
    }catch (err)
    {
      console.error('Erro ao excluir purchase:', err);
    }finally
    {
      this.loading = false;
    }
  }

  computeMonthlySummary()
  {
    // PEDAÇO DE CÓDIGO FICOU INÚTIL PQ JOGUEI PRO LOAD CALCULAR ISSO
    this.monthlyCommitted = this.parcelsThisMonth.reduce((acc, p) => acc + Number(p.installmentValue || 0), 0);
    this.monthlyTotal = this.parcelsThisMonth.reduce((acc, p) => acc + Number(p.installmentValue || 0), 0);
  }

  // redundancia?
  isMonthSelected(m: number) { return this.selectedMonth === m; }
  isYearSelected(y: number) { return this.selectedYear === y; }

  monthYearTitle()
  {
    return `${this.monthNames[this.selectedMonth]} ${this.selectedYear}`;
  }

  // helpers (TUDO DO CHATGPT PQ EU NÃO CONSEGUIA FAZER ISSO FUNCIONAR)
  private toYYYYMM(year: number, month0to11: number): number {
    return year * 100 + (month0to11 + 1);
  }

  private monthsDiff(startYM: number, targetYM: number): number {
    const startYear = Math.floor(startYM / 100);
    const startMonth1 = startYM % 100; // 1..12
    const targetYear = Math.floor(targetYM / 100);
    const targetMonth1 = targetYM % 100;
    return (targetYear - startYear) * 12 + (targetMonth1 - startMonth1);
  }

  // daqui pra baixo só Deus sabe como tá rodando isso aqui
  private async determineMaxAvailableYM(uid: string | null)
  {
    if (!uid) return;
    try {
      // tentativa 1: método para listar todas as compras (deveria ser mais eficiente mas tava dando erro as vezes????)
      if ((this.purchasesService as any).getAllPurchases)
      {
        const all: any[] = await (this.purchasesService as any).getAllPurchases(uid);
        if (Array.isArray(all) && all.length)
        {
          let max = this.maxAvailableYM;
          for (const p of all) {
            const end = Number(p.endCommittedMonth ?? p.endYM ?? 0);
            if (end && end > max) max = end;
            // não tem endCommittedMonth mas tem start + installments, calcule o mês então
            // aqui foi o gpt pq eu não fazia ideia de como codar isso
            if ((!end || end === 0) && p.startCommittedMonth && p.installments)
            {
              const startYM = Number(p.startCommittedMonth);
              const startYear = Math.floor(startYM / 100);
              const startMonth0 = (startYM % 100) - 1;
              const endDate = new Date(startYear, startMonth0 + (Number(p.installments) - 1));
              const endYM = this.toYYYYMM(endDate.getFullYear(), endDate.getMonth());
              if (endYM > max) max = endYM;
            }
          }
          this.maxAvailableYM = Math.max(this.maxAvailableYM, max);
          return;
        }
      }

      // aumentei os meses (evita não enxergar parcelas longas)
      const MAX_MONTHS_AHEAD = 120; // 10 anos - calculo por numero de meses
      const now = new Date();
      const startMonthIndex = now.getMonth();
      const startYear = now.getFullYear();


      // TODO: verificar alguma maneira de fazer isso de uma forma mais otimizada, tá travando e dando 
      // muito log no firebase se for alguma coisa parcelada por muito tempo
      for (let i = 1; i <= MAX_MONTHS_AHEAD; i++)
      {
        const offsetMonths = startMonthIndex + i;
        const y = startYear + Math.floor(offsetMonths / 12);
        const m = offsetMonths % 12;
        try
        {
          const pageData = await this.purchasesService.getPurchasesForMonth(uid, m, y);
          if (Array.isArray(pageData) && pageData.length)
          {
            const candidateYM = this.toYYYYMM(y, m);
            if (candidateYM > this.maxAvailableYM) this.maxAvailableYM = candidateYM;
          }
        } catch (err)
        {
          // fodase se der algum erro aqui pq vai ser um mês aleatorio que vai recarregar se clicar
        }
      }
    } catch (err) {
      console.warn('determineMaxAvailableYM falhou', err);
    }
  }
}