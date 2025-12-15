import { AuditoriaService } from './auditoria.service';
import { CacheService } from './cache.service';
import { CloudinaryService } from './Cloudinary.service';
import { VirusTotalService } from './VirusTotal.service';
import { GeocodingService } from './geocoding.service';
import { EmailService } from './email.service';
import { TemplateService } from './template.service';

export const sharedServices = [
    AuditoriaService,
    CacheService,
    CloudinaryService,
    VirusTotalService,
    GeocodingService,
    EmailService,
    TemplateService,
];
