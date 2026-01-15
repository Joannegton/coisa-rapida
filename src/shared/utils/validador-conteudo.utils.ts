type ValidarResult = {
    temEmail: boolean;
    temTelefone: boolean;
    temLinks: boolean;
    temWhatsapp: boolean;
    temPalavrasProibidas: boolean;
    temSequenciaNumeros: boolean;
    problemasDetectados: string[];
    prioridade: 'baixo' | 'medio' | 'alto'; // Para priorizar na fila
};

export class ValidadorConteudo {
    private static readonly PATTERNS = {
        // Email em múltiplos formatos
        email: /\b[A-Za-z0-9.%_+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i,

        // Telefone brasileiro: (11) 9999-9999, 11999999999, etc - simplified to reduce complexity
        phone: /(?:\(?\d{2}\)?[-.\s]?)?(?:9\d{4}|\d{4})[-.\s]?\d{4}\b|\b\+?55\d{8,9}\b/i,

        // Sequência de números suspeita (11+ dígitos contínuos sem contexto)
        // Exclui: voltagens (220v, 110v), versões (v2.0), medidas (10cm, 5kg), preços
        // Foca em: CPF, CNPJ, telefone disfarçado
        numbersSequence: /(?<![\w.]d)\d{11,}(?![\w.])/,

        // Links HTTP/HTTPS
        httpLinks: /https?:\/\/[^\s]+/i,

        // WWW
        wwwLinks: /www\.[^\s]+/i,

        // WhatsApp com variações (whatsapp, zap, whats, wa)
        // Busca por: whatsapp/zap/whats/wa seguido de números (com separadores)
        whatsapp:
            /(?:whatsapp|zap|whats|wa)[\s:()]*[\+55]*[\s()\-]*(?:\d[\s()\-]*){6,}/i,

        // Email com contexto (enviar para email@, contato:, etc)
        emailContext:
            /(?:email|contato|enviar para|e-mail|mail)[ :]*[A-Za-z0-9.%_+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i,
    };

    private static readonly Palavras_proibidas = [
        // ===== FORMAS DE CONTATO =====
        'telegram',
        'tiktok',
        'instagram',
        'facebook',
        'whatsapp',
        'signal',
        'telegram',

        // ===== CONTATO DIRETO =====
        'ligue',
        'call',
        'dm',
        'pdm',
        String.raw`p\.?d\.?m`, // pdm variado

        // ===== CONTEÚDO ILEGAL/PROIBIDO =====
        'droga',
        'maconha',
        'cocaína',
        'crack',
        'heroína',
        'tráfico',
        'anúncio falso',
        'golpe',
        'estelionato',
        'falsificado',
        'clone',
        'roubado',
        'receptação',
        'contrabando',
        'apreendido',

        // ===== SEXO/CONTEÚDO ADULTO =====
        'sexo',
        'gp',
        'acompanhante',
        'michê',
        'prostitut',
        'putariz',
        'programa',
        'puta',
        'viado', // pejorativo
        'gay de aluguel',

        // ===== FRAUDE/ROUBO =====
        'cartão clonado',
        'cartão roubado',
        'documento falso',
        'rg falso',
        'cpf falso',
        'conta invadida',

        // ===== ARMAS/EXPLOSIVOS =====
        'arma',
        'revolver',
        'pistola',
        'rifle',
        'munição',
        'explosivo',
        'bomba',
        'dinamite',

        // ===== ANIMAIS SILVESTRES =====
        'jaguatirica',
        'leão',
        'cobra venenosa',
        'macaco',
        'ave exótica',
        'tartaruga',
        'trança fauna',

        // ===== OUTROS PROIBIDOS =====
        'trabalho escravo',
        'trabalho infantil',
        'tráfico humano',
        'lavagem dinheiro',
        'passaporte falso',
        'visto falso',
        'roteador',
        'modem',
        'antena',
        'kit',
        'decodificador',
        'filmadora',
        'câmera escondida',
        'escuta',

        // ===== VARIAÇÕES COM NÚMEROS E SÍMBOLOS =====
        // Essas são base - a regex abaixo vai pegar variações
    ];

    static validar(text: string): ValidarResult {
        const problemasDetectados: string[] = [];
        const normalized = text.toLowerCase().trim();

        const temEmail =
            this.PATTERNS.email.test(normalized) ||
            this.PATTERNS.emailContext.test(normalized);
        if (temEmail) problemasDetectados.push('Email detectado');

        const temWhatsapp = this.PATTERNS.whatsapp.test(normalized);
        if (temWhatsapp) {
            problemasDetectados.push('WhatsApp detectado');
        }

        const temTelefone = this.PATTERNS.phone.test(normalized);
        if (temTelefone) problemasDetectados.push('Telefone detectado');

        const temHttpLinks = this.PATTERNS.httpLinks.test(normalized);
        const temWwwLinks = this.PATTERNS.wwwLinks.test(normalized);
        const temLinks = temHttpLinks || temWwwLinks;
        if (temLinks) problemasDetectados.push('Link externo detectado');

        // Detecta CPF/CNPJ/Telefone disfarçado
        // MAS não marca como suspeito: voltagens (220v), versões (v1.0), medidas (10cm)
        const temSequenciaNumeros =
            this.PATTERNS.numbersSequence.test(normalized);
        if (temSequenciaNumeros && !temTelefone && !temWhatsapp) {
            // Verificar se é realmente suspeito (não é medida, voltagem, etc)
            const units =
                'v|w|kg|g|cm|m|mm|polegada|pol|ampere|a|hz|khz|mhz|ghz|mb|gb|tb|rpm|psi|bar';
            const ehMedidaValida = new RegExp(`\\d+\\s*(?:${units})`, 'i').test(
                normalized,
            );
            const ehVersao = /v\d+(\.\d+)?/i.test(normalized);
            const ehData = /\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/i.test(
                normalized,
            );
            const ehHora = /\d{2}:\d{2}(:\d{2})?/i.test(normalized);
            const ehCodigo = /(?:cod|código|sku|ref|referência)[\s:]*\d+/i.test(
                normalized,
            );
            const ehDocumento = /(?:cpf|cnpj|rg|documento)[\s:]*\d+/i.test(
                normalized,
            );

            // Se NÃO é nenhum dos padrões legítimos e TEM sequência numérica
            if (
                !ehMedidaValida &&
                !ehVersao &&
                !ehData &&
                !ehHora &&
                !ehCodigo &&
                !ehDocumento
            ) {
                problemasDetectados.push(
                    'Sequência numérica suspeita detectada',
                );
            }
        }

        // ===== PALAVRAS PROIBIDAS =====
        const temPalavrasProibidas = this.Palavras_proibidas.some((word) => {
            // Cria variações com substituidores comuns
            // telegram -> t[e3é]+l+e+gram permite: telegram, t3legram, tél3gram, etc
            let pattern = '';
            for (let i = 0; i < word.length; i++) {
                const char = word[i];
                // Adiciona a letra com variações de vogais/números
                if (char === 'a') pattern += '[a@4á]';
                else if (char === 'e') pattern += '[e3é]';
                else if (char === 'i') pattern += '[i1!í]';
                else if (char === 'o') pattern += '[o0ó]';
                else if (char === 'u') pattern += '[u6ú]';
                else pattern += char;

                // Adiciona separadores opcionais entre letras (exceto na última)
                if (i < word.length - 1) {
                    pattern += '[\\s.\\-_]*';
                }
            }

            const regex = new RegExp(`\\b${pattern}\\b`, 'i');
            return regex.test(normalized);
        });
        if (temPalavrasProibidas)
            problemasDetectados.push('Palavras proibidas detectadas');

        let prioridade: 'baixo' | 'medio' | 'alto' = 'baixo';
        if (problemasDetectados.length >= 3) {
            prioridade = 'alto';
        } else if (problemasDetectados.length >= 2) {
            prioridade = 'medio';
        }

        return {
            temEmail,
            temTelefone,
            temLinks,
            temWhatsapp,
            temPalavrasProibidas,
            temSequenciaNumeros,
            prioridade,
            problemasDetectados: problemasDetectados,
        };
    }
}
