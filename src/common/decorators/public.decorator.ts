import { SetMetadata } from '@nestjs/common';

export const CHAVE_PUBLICA = 'isPublic';
export const Publico = () => SetMetadata(CHAVE_PUBLICA, true);
