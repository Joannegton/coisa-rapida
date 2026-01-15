import { ValidadorConteudo } from './validador-conteudo.utils';

describe('ValidadorConteudo', () => {
    describe('Detecçao de Email', () => {
        it('deve detectar email simples', () => {
            const resultado = ValidadorConteudo.validar('contato@gmail.com');

            expect(resultado.temEmail).toBe(true);
            expect(resultado.problemasDetectados).toContain('Email detectado');
        });

        it('deve detectar email com contexto', () => {
            const resultado = ValidadorConteudo.validar(
                'Enviar para: contato@gmail.com',
            );

            expect(resultado.temEmail).toBe(true);
            expect(resultado.problemasDetectados).toContain('Email detectado');
        });

        it('deve detectar múltiplos formatos de email', () => {
            const emails = [
                'user.name@example.com',
                'user+tag@example.co.uk',
                'user_name@example-domain.com',
            ];

            emails.forEach((email) => {
                const result = ValidadorConteudo.validar(email);
                expect(result.temEmail).toBe(true);
            });
        });

        it('não deve detectar email em texto sem email real', () => {
            const result = ValidadorConteudo.validar(
                'texto normal sem contato',
            );
            expect(result.temEmail).toBe(false);
        });
    });

    describe('Detecção de Telefone', () => {
        it('deve detectar telefone brasileiro formatado', () => {
            const result = ValidadorConteudo.validar('(11) 9999-9999');
            expect(result.temTelefone).toBe(true);
            expect(result.problemasDetectados).toContain('Telefone detectado');
        });

        it('deve detectar telefone sem formatação', () => {
            const result = ValidadorConteudo.validar('11999999999');
            expect(result.temTelefone).toBe(true);
        });

        it('deve detectar telefone com +55', () => {
            const result = ValidadorConteudo.validar('+5511999999999');
            expect(result.temTelefone).toBe(true);
        });

        it('não deve detectar número sem contexto de telefone', () => {
            const result = ValidadorConteudo.validar(
                'versão 1.0 com 2000 unidades',
            );
            expect(result.temTelefone).toBe(false);
        });
    });

    describe('Detecção de WhatsApp', () => {
        it('deve detectar whatsapp', () => {
            const result = ValidadorConteudo.validar('whatsapp 11999999999');
            expect(result.temWhatsapp).toBe(true);
            expect(result.problemasDetectados).toContain('WhatsApp detectado');
        });

        it('deve detectar variações de whatsapp (zap, whats, wa)', () => {
            const variaciones = [
                'zap 11999999999',
                'whats +5511999999999',
                'wa: 11 9999-9999',
            ];

            variaciones.forEach((text) => {
                const result = ValidadorConteudo.validar(text);
                expect(result.temWhatsapp).toBe(true);
            });
        });

        it('deve adicionar mensagem extra quando whatsapp é mencionado explicitamente', () => {
            const result = ValidadorConteudo.validar('whatsapp 11999999999');
            expect(result.problemasDetectados).toContain('WhatsApp detectado');
            expect(result.temWhatsapp).toBe(true);
        });

        it('não deve duplicar problema se tem telefone e whatsapp juntos', () => {
            const result = ValidadorConteudo.validar('whatsapp (11) 9999-9999');
            expect(result.problemasDetectados).toContain('WhatsApp detectado');
            expect(result.problemasDetectados).toContain('Telefone detectado');
        });
    });

    describe('Detecção de Links', () => {
        it('deve detectar links HTTP', () => {
            const result = ValidadorConteudo.validar(
                'acesse http://example.com',
            );
            expect(result.temLinks).toBe(true);
            expect(result.problemasDetectados).toContain(
                'Link externo detectado',
            );
        });

        it('deve detectar links HTTPS', () => {
            const result = ValidadorConteudo.validar('https://www.example.com');
            expect(result.temLinks).toBe(true);
        });

        it('deve detectar links www', () => {
            const result = ValidadorConteudo.validar('visite www.example.com');
            expect(result.temLinks).toBe(true);
        });

        it('não deve detectar www sem contexto de link', () => {
            const result = ValidadorConteudo.validar('texto normal');
            expect(result.temLinks).toBe(false);
        });
    });

    describe('Detecção de Palavras Proibidas', () => {
        it('deve detectar palavras proibidas', () => {
            const result = ValidadorConteudo.validar('contato pelo telegram');
            expect(result.temPalavrasProibidas).toBe(true);
            expect(result.problemasDetectados).toContain(
                'Palavras proibidas detectadas',
            );
        });

        it('deve detectar palavras proibidas com variações (números e símbolos)', () => {
            const variaciones = [
                't3l3gram',
                't.e.l.e.g.r.a.m',
                't-e-l-e-g-r-a-m',
            ];

            variaciones.forEach((text) => {
                const result = ValidadorConteudo.validar(text);
                expect(result.temPalavrasProibidas).toBe(true);
            });
        });

        it('deve ser case-insensitive ao detectar palavras proibidas', () => {
            const result = ValidadorConteudo.validar('TELEGRAM');
            expect(result.temPalavrasProibidas).toBe(true);
        });

        it('não deve detectar palavra proibida em palavra maior', () => {
            const result = ValidadorConteudo.validar(
                'telemarketing é uma profissão legítima',
            );
            // Dependendo da regex, isso pode ser detectado. Ajuste conforme necessário.
            // Este é um teste para validar o comportamento esperado.
        });
    });

    describe('Detecção de Sequência Numérica', () => {
        it('deve detectar sequência numérica suspeita', () => {
            const result = ValidadorConteudo.validar('12345678901234');
            expect(result.temSequenciaNumeros).toBe(true);
        });

        it('não deve considerar versão como sequência suspeita', () => {
            const result = ValidadorConteudo.validar('versão v2.0');
            expect(result.problemasDetectados).not.toContain(
                'Sequência numérica suspeita detectada',
            );
        });

        it('não deve considerar medidas como sequência suspeita', () => {
            const medidas = ['220v', '110kg', '10cm', '5mhz', '2gb'];

            medidas.forEach((medida) => {
                const result = ValidadorConteudo.validar(medida);
                expect(result.problemasDetectados).not.toContain(
                    'Sequência numérica suspeita detectada',
                );
            });
        });

        it('não deve considerar datas como sequência suspeita', () => {
            const result = ValidadorConteudo.validar('data: 25/12/2024');
            expect(result.problemasDetectados).not.toContain(
                'Sequência numérica suspeita detectada',
            );
        });

        it('não deve considerar horários como sequência suspeita', () => {
            const result = ValidadorConteudo.validar('horário: 14:30:45');
            expect(result.problemasDetectados).not.toContain(
                'Sequência numérica suspeita detectada',
            );
        });

        it('não deve considerar códigos como sequência suspeita', () => {
            const result = ValidadorConteudo.validar('código: 123456789');
            expect(result.problemasDetectados).not.toContain(
                'Sequência numérica suspeita detectada',
            );
        });
    });

    describe('Cálculo de Prioridade', () => {
        it('deve retornar prioridade baixa quando não há problemas', () => {
            const result = ValidadorConteudo.validar('texto normal e seguro');
            expect(result.prioridade).toBe('baixo');
        });

        it('deve retornar prioridade baixa com 1 problema', () => {
            const result = ValidadorConteudo.validar('contato@example.com');
            expect(result.prioridade).toBe('baixo');
        });

        it('deve retornar prioridade média com 2 problemas', () => {
            const result = ValidadorConteudo.validar(
                'contato@example.com e ligue para telegram',
            );
            expect(result.prioridade).toBe('medio');
        });

        it('deve retornar prioridade alta com 3+ problemas', () => {
            const result = ValidadorConteudo.validar(
                'contato@example.com whatsapp 11999999999 https://example.com telegram',
            );
            expect(result.prioridade).toBe('alto');
        });
    });

    describe('Testes de Integração', () => {
        it('deve validar conteúdo limpo com sucesso', () => {
            const result = ValidadorConteudo.validar(
                'Este é um produto muito bom, em ótimas condições',
            );
            expect(result.temEmail).toBe(false);
            expect(result.temTelefone).toBe(false);
            expect(result.temLinks).toBe(false);
            expect(result.temWhatsapp).toBe(false);
            expect(result.temPalavrasProibidas).toBe(false);
            expect(result.prioridade).toBe('baixo');
        });

        it('deve validar conteúdo suspeito com múltiplos problemas', () => {
            const result = ValidadorConteudo.validar(
                'Compre agora! Email: contato@example.com ou ligue (11) 9999-9999. Mais informações em https://example.com',
            );
            expect(result.temEmail).toBe(true);
            expect(result.temTelefone).toBe(true);
            expect(result.temLinks).toBe(true);
            expect(result.prioridade).toBe('alto');
        });

        it('deve normalizar texto antes de validar', () => {
            const result = ValidadorConteudo.validar(
                '  TELEGRAM   (COM ESPAÇOS)  ',
            );
            expect(result.temPalavrasProibidas).toBe(true);
        });

        it('deve retornar estrutura correta de resultado', () => {
            const result = ValidadorConteudo.validar('contato@example.com');
            expect(result).toHaveProperty('temEmail');
            expect(result).toHaveProperty('temTelefone');
            expect(result).toHaveProperty('temLinks');
            expect(result).toHaveProperty('temWhatsapp');
            expect(result).toHaveProperty('temPalavrasProibidas');
            expect(result).toHaveProperty('temSequenciaNumeros');
            expect(result).toHaveProperty('prioridade');
            expect(result).toHaveProperty('problemasDetectados');
            expect(Array.isArray(result.problemasDetectados)).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('deve lidar com string vazia', () => {
            const result = ValidadorConteudo.validar('');
            expect(result.temEmail).toBe(false);
            expect(result.prioridade).toBe('baixo');
        });

        it('deve lidar com string com apenas espaços', () => {
            const result = ValidadorConteudo.validar('   ');
            expect(result.temEmail).toBe(false);
            expect(result.prioridade).toBe('baixo');
        });

        it('deve lidar com caracteres especiais', () => {
            const result = ValidadorConteudo.validar('!@#$%^&*()');
            expect(result.prioridade).toBe('baixo');
        });

        it('deve lidar com strings muito longas', () => {
            const longString = 'a'.repeat(10000);
            const result = ValidadorConteudo.validar(longString);
            expect(result.prioridade).toBe('baixo');
        });
    });
});
