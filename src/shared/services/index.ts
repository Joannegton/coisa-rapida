import { AuditoriaService } from './auditoria.service';
import { CacheService } from './cache.service';
import { CloudinaryService } from './Cloudinary.service';
import { VirusTotalService } from './VirusTotal.service';

export const sharedServices = [
    AuditoriaService,
    CacheService,
    CloudinaryService,
    VirusTotalService,
];
