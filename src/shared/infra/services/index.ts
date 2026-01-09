import { AuditoriaService } from './auditoria.service';
import { CacheService } from './cache.service';
import { CloudinaryService } from './Cloudinary.service';
import { VirusTotalService } from './VirusTotal.service';
import { GeocodingService } from './geocoding.service';
import { EmailFilaService } from './email.service';
import { TemplateService } from './template.service';
import { VerificacaoVirusFilaService } from './verificacao-virus.fila.service';
import { DeadLetterQueueService } from './dead-letter-queue.service';
import { NotificationService } from './notification.service';

export const sharedServices = [
    AuditoriaService,
    CacheService,
    CloudinaryService,
    VirusTotalService,
    GeocodingService,
    EmailFilaService,
    TemplateService,
    VerificacaoVirusFilaService,
    DeadLetterQueueService,
    NotificationService,
];
