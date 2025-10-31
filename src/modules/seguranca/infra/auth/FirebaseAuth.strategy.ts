import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport';
import { FirebaseConfigService } from '../../../../config/firebase.config';

export interface FirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(Strategy, 'firebase') {
  constructor(private readonly firebaseConfig: FirebaseConfigService) {
    super();
  }

  async authenticate(req: any) {
    const token = req.token;
    if (!token) {
      (this as any).fail('Token não fornecido', 401);
      return;
    }

    try {
      const auth = this.firebaseConfig.getAuth();
      const decodedToken = await auth.verifyIdToken(token);

      const user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        emailVerified: decodedToken.email_verified || false,
        name: decodedToken.name,
        picture: decodedToken.picture,
      };

      (this as any).success(user);
    } catch (error) {
      console.log('Erro ao validar token:', error.message);
      (this as any).fail('Token inválido ou expirado', 401);
    }
  }
}
