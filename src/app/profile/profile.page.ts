import { Component, OnDestroy, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { AuthService } from 'src/app/services/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})

export class ProfilePage implements OnInit, OnDestroy
{
  loading = true;
  user: User | null = null;
  uid: string | null = null;
  
  profile: any = {
    displayName: '',
    email: '',
    salario_mensal: null,
    carga_horaria_semanal: null,
  };

  private authUnsub: (() => void) | null = null;

  constructor(
    private auth: Auth,
    private authService: AuthService,
    private firestore: Firestore
  ) {}

  ngOnInit()
  {
    // Observa estado de autenticação
    this.authUnsub = onAuthStateChanged(this.auth, async (u) => {
      this.user = u;
      if (u)
        {
        this.uid = u.uid;
        // preenche email e displayName de auth caso não existam no profile (desnecessário pq o cadastro
        // previne um usuario limpo)
        this.profile.email = u.email || '';
        this.profile.displayName = u.displayName || '';
        await this.loadProfile();
      }else
      {
        this.uid = null;
        this.profile = { displayName: '', email: '', salario_mensal: null };
        this.loading = false;
      }
    });
  }

  ngOnDestroy()
  {
    if (this.authUnsub) this.authUnsub();
  }

  async loadProfile()
  {
    if (!this.uid) return;
    this.loading = true;
    try
    {
      const ref = doc(this.firestore, `users/${this.uid}`);
      const snap = await getDoc(ref);
      if (snap.exists())
      {
        const data = snap.data();
        // garante que os campos existam localmente
        this.profile.displayName = data['displayName'] ?? this.profile.displayName;
        this.profile.email = data['email'] ?? this.profile.email;
        this.profile.salario_mensal = data['salario_mensal'] ?? this.profile.salario_mensal;
        this.profile.carga_horaria_semanal = data['carga_horaria_semanal'] ?? this.profile.carga_horaria_semanal;
      }else
      {
        // cria doc inicial com dados basicos (merge)
        await setDoc(ref, {
          uid: this.uid,
          email: this.profile.email,
          displayName: this.profile.displayName,
          carga_horaria_semanal: this.profile.carga_horaria_semanal,
          salario_mensal: this.profile.salario_mensal,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
    }catch (err)
    {
      console.error('Erro ao carregar perfil:', err);
    }finally
    {
      this.loading = false;
    }
  }

  async salvarPerfil()
  {
    if (!this.uid)
    {
      alert('Usuário não autenticado.');
      return;
    }

    // validações simples
    const nome = (this.profile.displayName || '').toString().trim();
    const carga_horaria = this.profile.carga_horaria_semanal ? Number(this.profile.carga_horaria_semanal) : null;
    const salario = this.profile.salario_mensal ? Number(this.profile.salario_mensal) : null;
    if (salario !== null && (isNaN(salario) || salario < 0))
    {
      alert('Informe um salário válido (número positivo).');
      return;
    }
    try
    {
      const ref = doc(this.firestore, `users/${this.uid}`);
      await updateDoc(ref, {
        displayName: nome,
        salario_mensal: salario,
        carga_horaria_semanal: carga_horaria,
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        // se não existir doc, cria com merge
        await setDoc(ref, {
          displayName: nome,
          salario_mensal: salario,
          carga_horaria_semanal: carga_horaria,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });
      alert('Perfil atualizado com sucesso.');
    } catch (err)
    {
      console.error('Erro ao salvar perfil:', err);
      alert('Erro ao salvar perfil. Veja o console.');
    }
  }

  async logout()
  {
    await this.authService.logout();
  }

  // valor formatado
  formatCurrency(v: any) {
    if (v == null || v === '') return '';
    const n = Number(v);
    if (isNaN(n)) return v;
    return n.toFixed(2).replace('.', ',');
  }
}
