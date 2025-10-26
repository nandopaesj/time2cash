import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})

export class RegisterPage implements OnInit
{
  name = '';
  email = '';
  senha = '';
  salario_mensal: number | null = null;
  carga_horaria_semanal: number | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { }

  async cadastrar()
  {
    const loading = await this.loadingCtrl.create({message: 'Cadastrando...'});
    await loading.present();

    try
    {
      // envia apenas se não for null
      await this.authService.register(
        this.name,
        this.email,
        this.senha,
        this.salario_mensal ?? 0,
        this.carga_horaria_semanal ?? 0
      );

      await loading.dismiss();
      this.presentToast('Cadastro realizado com sucesso!', 'success');
      this.router.navigateByUrl('/tabs/calc');
    }catch(error: any)
    {
      await loading.dismiss();
      this.presentToast(`Erro ao cadastrar: ${error.message}`, 'danger');
    }
  }

  async presentToast(message: string, cor: string)
  {
    const toast = await this.toastCtrl.create({
      message: message,
      color: cor,
      duration: 2000
    });

    toast.present();
  }

  // traz tudo limpo
  ngOnInit()
  {
    this.name = '';
    this.email = '';
    this.senha = '';
    this.salario_mensal = null;
    this.carga_horaria_semanal = null;
  }
}
