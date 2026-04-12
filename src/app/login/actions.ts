'use server';

import { db } from '@/lib/firebase-admin';
import { setSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios' };
  }

  try {
    // Para o MVP: Se admin@cfm.com e senha admin, entra e cria usuário mocado
    // senão tenta buscar do firestore de verdade.
    let userId = '';
    let role = 'admin';

    if (email === 'admin@cfm.com' && password === 'admin') {
      userId = 'dev-admin-id';
    } else {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();
      
      if (snapshot.empty) {
        return { error: 'Credenciais inválidas' };
      }
      
      const user = snapshot.docs[0].data();
      // Em produção real usaríamos Firebase Auth Client ou verificação de Hash.
      // Aqui usamos apenas para validar existência e bypass.
      if (user.password !== password) {
         return { error: 'Credenciais inválidas' };
      }
      userId = snapshot.docs[0].id;
      role = user.role || 'member';
    }

    await setSession(userId, role);
    
  } catch (error) {
    console.error('Login error', error);
    return { error: 'Erro interno ao realizar login' };
  }
  
  redirect('/dashboard');
}
