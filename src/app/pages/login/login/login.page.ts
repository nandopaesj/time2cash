import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth';
import { Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { getFirebaseErrorMessage } from 'src/app/utils/firebase-errors';

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
  ) {}

  async login() {
    try {
      await this.authService.login(this.email, this.senha);
      this.router.navigateByUrl('/tabs/calc');
    } catch (error: any) {
      const message = getFirebaseErrorMessage(error?.code);
      this.presentToast(message, 'danger');
    }
  }

  async loginGoogle() {
    try {
      await this.authService.loginWithGoogle();
      this.router.navigateByUrl('/tabs/calc');
    } catch (error: any) {
      const message = getFirebaseErrorMessage(error?.code);
      this.presentToast(message, 'danger');
    }
  }

  async forgotPassword() {
    if (!this.email) {
      this.presentToast('Informe seu e-mail para recuperar a senha.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Recuperar senha',
      message: `Enviar link de recuperação para: ${this.email}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async () => {
            try {
              await this.authService.resetPassword(this.email);
              this.presentToast('E-mail de recuperação enviado!', 'success');
            } catch (error: any) {
              const message = getFirebaseErrorMessage(error?.code);
              this.presentToast(message, 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2500
    });
    toast.present();
  }
}