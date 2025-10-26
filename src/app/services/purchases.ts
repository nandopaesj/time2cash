import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  deleteDoc
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })

export class PurchasesService
{
  constructor(private firestore: Firestore) {}

  // essa parte de datas veio tudo do gpt
  private toYYYYMM(year: number, month0to11: number): number
  {
    return year * 100 + (month0to11 + 1);
  }

  private addMonthsToYYYYMM(yyyymm: number, add: number): number
  {
    const year = Math.floor(yyyymm / 100);
    const month1 = yyyymm % 100; // 1..12
    const totalMonths = (year * 12 + (month1 - 1)) + add;
    const newYear = Math.floor(totalMonths / 12);
    const newMonth0 = totalMonths % 12;
    return this.toYYYYMM(newYear, newMonth0);
  }

  async addPurchase(uid: string, purchase: any)
  {
    const now = new Date();
    const startMonth = (purchase.startMonth != null) ? Number(purchase.startMonth) : now.getMonth();
    const startYear = (purchase.startYear != null) ? Number(purchase.startYear) : now.getFullYear();
    const installments = Number(purchase.parcelas ?? purchase.installments ?? 1);
    const installmentValue = Number(purchase.parcelaValor ?? purchase.installmentValue ?? (purchase.price ?? 0) / Math.max(1, installments));

    const startYM = this.toYYYYMM(startYear, startMonth);
    const endYM = this.addMonthsToYYYYMM(startYM, installments - 1);

    const colRef = collection(this.firestore, `users/${uid}/purchases`);
    const docData = {
      name: purchase.name ?? purchase.nome ?? 'Compra',
      price: Number(purchase.price ?? purchase.preco ?? 0),
      parcelas: installments,
      parcelaValor: Number(installmentValue.toFixed(2)),
      startMonth,
      startYear,
      commitedMonth: startYM,
      startCommittedMonth: startYM,
      endCommittedMonth: endYM,
      totalWithInterest: purchase.totalWithInterest ?? purchase.price ?? purchase.preco ?? 0,
      notes: purchase.notes ?? null,
      confirmedAt: serverTimestamp(),
      createdBy: uid,
      status: 'confirmed'
    };

    const docRef = await addDoc(colRef, docData);
    return docRef.id;
  }

  // checar todas as compras salvas para cada mes de cada ano
  async getPurchasesForMonth(uid: string, month: number, year: number)
  {
    const selectedYM = this.toYYYYMM(year, month);
    const colRef = collection(this.firestore, `users/${uid}/purchases`);

    const q = query(
      colRef,
      where('commitedMonth', '<=', selectedYM),
      orderBy('commitedMonth', 'desc')
    );

    const snap = await getDocs(q);
    const list: any[] = [];

    snap.forEach(d => {
      const data = d.data() as any;

      // essas duas linhas veio do gpt pq eu não conseguia traduzir os bglh de data mas tá indo
      const startYM = Number(data.commitedMonth ?? this.toYYYYMM(data.year ?? 0, (data.month ?? 1) - 1));
      const installments = Number(data.parcelas ?? data.installments ?? 1);

      let endYM = Number(data.endCommittedMonth ?? data.endYM ?? 0);
      if (!endYM || endYM === 0)
      {
        const startYear = Math.floor(startYM / 100);
        const startMonth0 = (startYM % 100) - 1;
        const endDate = new Date(startYear, startMonth0 + (installments - 1));
        endYM = this.toYYYYMM(endDate.getFullYear(), endDate.getMonth());
      }

      // inclui a parcela nos meses do meio
      if (startYM <= selectedYM && endYM >= selectedYM)
        {
        list.push({
          id: d.id,
          raw: data,
          name: data.name ?? data.nome ?? 'Compra',
          price: Number(data.price ?? data.preco ?? 0),
          installments: installments,
          installmentValue: Number(data.parcelaValor ?? data.installmentValue ?? 0),
          startCommittedMonth: startYM,
          endCommittedMonth: endYM,
          confirmedAt: data.confirmedAt ?? data.confirmed_at ?? null,
          commitedMonth: startYM,
          month: data.month ?? null,
          year: data.year ?? null
        });
      }
    });

    return list;
  }

  // fiquei 3 horas só nisso
  async getAllPurchases(uid: string)
  {
    const colRef = collection(this.firestore, `users/${uid}/purchases`);
    const q = query(colRef, orderBy('commitedMonth', 'desc'));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach(d => {
      const data = d.data() as any;
      const startYM = Number(data.commitedMonth ?? this.toYYYYMM(data.year ?? 0, (data.month ?? 1) - 1));
      const installments = Number(data.parcelas ?? data.installments ?? 1);
      let endYM = Number(data.endCommittedMonth ?? data.endYM ?? 0);
      if (!endYM || endYM === 0) {
        const startYear = Math.floor(startYM / 100);
        const startMonth0 = (startYM % 100) - 1;
        const endDate = new Date(startYear, startMonth0 + (installments - 1));
        endYM = this.toYYYYMM(endDate.getFullYear(), endDate.getMonth());
      }

      list.push({
        id: d.id,
        raw: data,
        name: data.name ?? data.nome ?? 'Compra',
        price: Number(data.price ?? data.preco ?? 0),
        installments: installments,
        installmentValue: Number(data.parcelaValor ?? data.installmentValue ?? 0),
        startCommittedMonth: startYM,
        endCommittedMonth: endYM,
        confirmedAt: data.confirmedAt ?? data.confirmed_at ?? null,
        commitedMonth: startYM
      });
    });
    return list;
  }

  async deletePurchase(uid: string, purchaseId: string)
  {
    const docRef = doc(this.firestore, `users/${uid}/purchases/${purchaseId}`);
    await deleteDoc(docRef);
    return true;
  }

  ///// PARTE DE GASTOS FIXOS

  // adiciona gasto fixo
  async addFixedExpense(uid: string, expense: any)
  {
    const colRef = collection(this.firestore, `users/${uid}/fixedExpenses`);
    const docData = {
      name: expense.name ?? expense.nome ?? 'Fixo',
      amount: Number(expense.amount ?? expense.valor ?? 0),
      note: expense.note ?? null,
      createdAt: serverTimestamp(),
      createdBy: uid
    };
    const docRef = await addDoc(colRef, docData);
    return docRef.id;
  }

  // retorna lista de gastos fixos
  async getFixedExpenses(uid: string)
  {
    const colRef = collection(this.firestore, `users/${uid}/fixedExpenses`);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list;
  }

  // soma total mensal dos gastos fixos
  async getFixedTotal(uid: string)
  {
    const items = await this.getFixedExpenses(uid);
    return items.reduce((acc, it) => acc + Number(it.amount || 0), 0);
  }

  // deleta gasto fixo
  async deleteFixedExpense(uid: string, expenseId: string)
  {
    const docRef = doc(this.firestore, `users/${uid}/fixedExpenses/${expenseId}`);
    await deleteDoc(docRef);
    return true;
  }
}