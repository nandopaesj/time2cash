export const FIREBASE_ERRORS: Record<string, string> = {
    'auth/app-deleted': 'O banco de dados não foi localizado.',
    'auth/expired-action-code': 'O link expirou.',
    'auth/invalid-action-code': 'O link é inválido ou já foi utilizado.',
    'auth/user-disabled': 'Este usuário foi desativado.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/weak-password': 'A senha é muito fraca.',
    'auth/email-already-in-use': 'Este e-mail já está em uso.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/operation-not-allowed': 'Login com este método não está habilitado.',
    'auth/account-exists-with-different-credential': 'O e-mail já está associado a outro método de login.',
    'auth/popup-blocked': 'O pop-up foi bloqueado pelo navegador.',
    'auth/popup-closed-by-user': 'Você fechou a janela antes de completar o login.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'Credencial inválida ou expirada.',
    'auth/network-request-failed': 'Falha na conexão. Verifique sua internet.',
    'auth/requires-recent-login': 'Faça login novamente para continuar.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/internal-error': 'Erro interno no servidor.',
    'auth/invalid-verification-code': 'Código de verificação inválido.',
    'auth/invalid-verification-id': 'ID de verificação inválido.',
    'auth/unauthorized-domain': 'Domínio não autorizado.',
    'auth/cancelled-popup-request': 'Outra solicitação de login já está em andamento.'
  };

  export function getFirebaseErrorMessage(code: string | undefined): string {
    if (!code) return 'Ocorreu um erro inesperado.';
  
    return FIREBASE_ERRORS[code] || 'Erro inesperado ao realizar a operação.';
  }  