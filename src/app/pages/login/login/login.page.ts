import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth';
import { Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {

  email = '';
  senha = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private alertCtrl: AlertController
  ) { }

  async login()
  {
    try
    {
      await this.authService.login(this.email, this.senha);
      this.router.navigateByUrl('/tabs/calc');
    }catch (error: unknown)
    {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido ao logar';
      this.presentToast(`Erro ao logar: ${msg}`, 'danger');
    }
  }

  async loginGoogle()
  {
    try
    {
      await this.authService.loginWithGoogle();
      this.router.navigateByUrl('/tabs/calc');
    } catch (error: unknown)
    {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido ao logar';
      this.presentToast(`Erro ao logar: ${msg}`, 'danger');
    }
  }

  async forgotPassword()
  {
    // TODO>: utilizar desse jeito ou criar uma página separada?????
    if (!this.email)
    {
      this.presentToast('Informe seu e-mail para recuperar a senha', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Recuperar senha',
      message: `Deseja enviar um e-mail de recuperação de senha para ${this.email}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async () => {
            try {
              await this.authService.resetPassword(this.email);
              this.presentToast('E-mail de recuperação enviado!', 'success');
            } catch (err: any) {
              this.presentToast(`Erro: ${err?.message || err}`, 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async presentToast(message: string, cor: string) {
    const toast = await this.toastController.create({
      message,
      color: cor,
      duration: 2000
    });
    toast.present();
  }
}
