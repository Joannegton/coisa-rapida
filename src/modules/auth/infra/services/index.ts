import { BcryptService } from './bcrypt.service';
import { JwtService } from './jwt.service';
import { AuthEmailService } from './auth-email.service';

export const AUTH_SERVICES = [BcryptService, JwtService, AuthEmailService];
