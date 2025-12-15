import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class TemplateService {
    private readonly templatesPath = join(
        process.cwd(),
        'src',
        'shared',
        'templates',
    );

    renderizar(
        templateName: string,
        variables: Record<string, any> = {},
    ): string {
        const templatePath = join(this.templatesPath, `${templateName}.html`);

        try {
            let template = readFileSync(templatePath, 'utf-8');

            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                template = template.replace(regex, String(value));
            }

            return template;
        } catch (error) {
            throw new Error(
                `Template ${templateName} não encontrado: ${error.message}`,
            );
        }
    }
}
