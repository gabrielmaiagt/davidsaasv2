'use server';

import { db } from '@/lib/firebase-admin';
import { setSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'Todos os campos são obrigatórios' };
  }

  try {
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).limit(1).get();
    
    if (!existingUser.empty) {
      return { error: 'Este e-mail já está em uso' };
    }

    // Criando usuário
    const newUser = {
      name,
      email,
      password, // em MVP. Em prod faremos hash.
      role: 'admin', // por enquanto todo mundo entra como admin desse tenant
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await usersRef.add(newUser);

    // Entrar automaticamente na sessão
    await setSession(docRef.id, newUser.role);

  } catch (error) {
    console.error('Register error', error);
    return { error: 'Erro interno ao realizar registro' };
  }
  
  redirect('/dashboard');
}
