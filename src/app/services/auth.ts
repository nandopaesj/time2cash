import { Injectable } from '@angular/core';
import {
  Auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  docData
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocialLogin } from '@capgo/capacitor-social-login';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private userSub = new BehaviorSubject<any|null>(null);
  public user$ = this.userSub.asObservable();

  private profileSub = new BehaviorSubject<any|null>(null);
  public profile$ = this.profileSub.asObservable();

  constructor(private auth: Auth, private firestore: Firestore)
  {
    this.initializeSocialLogin();

    onAuthStateChanged(this.auth, (user) => {
      this.userSub.next(user);
      if (user) {
        this.subscribeProfile(user.uid);
      } else {
        this.profileSub.next(null);
      }
    });
  }

  // inicialização do plugin que tá funcionando pro login google, vê a documentação antes de mexer pq nem o gpt sabia como fazer funcionar
  private async initializeSocialLogin() {
    await SocialLogin.initialize({
      google: {
        webClientId: '124061756981-ti5grcv54jord3ihlegu97emvgp7oi0i.apps.googleusercontent.com',
        mode: 'online',
      }
    });
  }

  async login(email: string, senha: string)
  {
    return signInWithEmailAndPassword(this.auth, email, senha);
  }

  async register(
    name: string,
    email: string,
    senha: string,
    salario_mensal: number,
    carga_horaria_semanal: number,
    additionalProfile: any = {}
  )
  {
    const cred = await createUserWithEmailAndPassword(this.auth, email, senha);
    const uid = cred.user.uid;

    // cria a base de dados a partir dos inputs da pag de cadastro
    const userRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userRef, {
      uid,
      email: cred.user.email,
      displayName: name,
      salario_mensal,
      carga_horaria_semanal,
      createdAt: serverTimestamp(),
      ...additionalProfile
    }, { merge: true });

    return cred;
  }

  async logout() {
    return signOut(this.auth);
  }

  // LOGIN GOOGLE (SÓ DEUS SABE COMO ESSA PARTE TÁ FUNCIONANDO, TODO>>>
  // criar um popup no primeiro login pedindo o salário e as horas semanais, ou alguma coisa falando
  // sobre a necessidade de atualizar essas infos na pag de perfil)
  async loginWithGoogle()
  {
    try
    {
      const result: any = await SocialLogin.login(
      {
        provider: 'google',
        options:
        {
          scopes: ['email', 'profile'],
          forceRefreshToken: true,
          filterByAuthorizedAccounts: false,
          style: 'bottom',
        }
      });

      if (!result || !result.result.idToken)
      {
        throw new Error('Nenhum Token foi recebido do Google ::: ' + JSON.stringify(result));
      }

      const credential = GoogleAuthProvider.credential(result.result.idToken);
      const cred = await signInWithCredential(this.auth, credential);

      if (!cred.user)
      {
        throw new Error('Firebase sign-in failed');
      }

      // Cria uma base de dados básica para o perfil
      const uid = cred.user.uid;
      const userRef = doc(this.firestore, `users/${uid}`);
      await setDoc(userRef, {
        uid,
        email: cred.user.email,
        displayName: cred.user.displayName || result?.result?.name || result?.result?.authentication?.name || '',
        photoURL: cred.user.photoURL || result?.result?.photoURL || result?.result?.authentication?.photoURL || '',
        updatedAt: serverTimestamp()
      }, { merge: true });

      return cred;
    }catch (err)
    {
    throw err;
    }
  }

  // RECUPERAÇÃO DE SENHA
  async resetPassword(email: string)
  {
    if (!email) throw new Error('Informe um e-mail válido.');
    return sendPasswordResetEmail(this.auth, email);
  }

  // CARREGAR A PÁGINA PROFILE
  async loadProfileOnce(uid: string)
  {
    const ref = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(ref);
    if (snap.exists())
    {
      const data = snap.data();
      this.profileSub.next(data);
      return data;
    }else
    {
      this.profileSub.next(null);
      return null;
    }
  }

  // salva configs (para o botão da página profile)
  async updateProfile(uid: string, data: Record<string, any>)
  {
    const ref = doc(this.firestore, `users/${uid}`);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() }).catch(async () => {
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    });
    await this.loadProfileOnce(uid);
  }

  // verifica mudanças
  subscribeProfile(uid: string)
  {
    const ref = doc(this.firestore, `users/${uid}`);
    const sub = docData(ref, { idField: 'uid' }) as Observable<any>;
    sub.subscribe((p) => this.profileSub.next(p));
  }

  // utilitários, ****não utilizados em nenhum lugar???
  getCurrentAuthUser()
  {
    return this.auth.currentUser;
  }

  isLoggedIn(): boolean
  {
    return !!this.auth.currentUser;
  }
}
