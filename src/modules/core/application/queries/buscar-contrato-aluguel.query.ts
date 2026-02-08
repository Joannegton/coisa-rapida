import { Inject } from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';

export class BuscarContratoAluguelQuery {
    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
    ) {}

    async execute(aluguelId: string): Promise<{ conteudoHtml: string }> {
        const aluguel = await this.aluguelRepository.buscar(aluguelId);

        if (!aluguel) {
            throw new Error('Aluguel não encontrado');
        }

        const dataInicio = new Date(aluguel.dataInicio).toLocaleDateString(
            'pt-BR',
        );
        const dataFim = aluguel.dataFim
            ? new Date(aluguel.dataFim).toLocaleDateString('pt-BR')
            : 'A definir';
        const id = `CR-${aluguelId}`;

        const conteudo = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Contrato de Aluguel - Coisa Rápida</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 30px;
                        line-height: 1.6;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    h2, h3 {
                        color: #d32f2f;
                        margin-bottom: 5px;
                    }
                    h4 {
                        color: #444;
                        margin-bottom: 10px;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 5px;
                    }
                    ul {
                        margin-left: 20px;
                    }
                    .destaque {
                        font-weight: bold;
                        color: #d32f2f;
                    }
                    .assinaturas {
                        margin-top: 40px;
                        text-align: center;
                    }
                    .assinaturas div {
                        display: inline-block;
                        margin: 0 40px;
                    }
                    .assinaturas p {
                        margin-top: 5px;
                        border-top: 1px solid #000;
                        padding-top: 5px;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 12px;
                        color: #666;
                        text-align: center;
                        border-top: 1px solid #ddd;
                        padding-top: 10px;
                    }
                    .section {
                        margin-bottom: 20px;
                    }
                    .metadata {
                        font-size: 11px;
                        color: #777;
                        margin-top: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>CONTRATO DIGITAL DE ALUGUEL DE BENS</h2>
                    <h3>Plataforma Coisa Rápida</h3>
                    <p>Contrato nº ${id}</p>
                </div>
                
                <div class="section">
                    <h4>1. PARTES</h4>
                    <p><strong>Locador:</strong> ${aluguel.locador.nome}</p>
                    <p><strong>CPF/CNPJ:</strong> Documento</p>
                    <p><strong>Locatário:</strong> ${aluguel.locatario.nome}</p>
                    <p><strong>CPF/CNPJ:</strong> Documento</p>
                    <p>Ambas as partes devidamente cadastradas e verificadas na plataforma <strong>Coisa Rápida</strong>, intermediadora deste contrato.</p>
                </div>
                
                <div class="section">
                    <h4>2. OBJETO</h4>
                    <p>O presente contrato tem por objeto o aluguel do seguinte item:</p>
                    <p><strong>Item:</strong> ${aluguel.itemSnapshot.nome}</p>
                    <p><strong>Descrição:</strong> ${aluguel.itemSnapshot.descricao || 'N/A'}</p>
                    <p><strong>Código de identificação:</strong> ${aluguel.itemId}</p>
                    <p><strong>Condição atual:</strong> Em perfeito estado</p>
                    <p>O item deverá ser utilizado única e exclusivamente para fins lícitos, respeitando suas condições normais de uso.</p>
                </div>
                
                <div class="section">
                    <h4>3. VALORES E PRAZOS</h4>
                    <p><strong>Valor do aluguel:</strong> R$ ${aluguel.precoTotal.toFixed(2)}</p>
                    <p><strong>Data de início:</strong> ${dataInicio}</p>
                    <p><strong>Data de término:</strong> ${dataFim}</p>
                    <p><strong>Prazo de locação:</strong> Período acordado entre as partes</p>
                    <p><strong>Caução:</strong> R$ ${(aluguel.caucao?.valor ?? 0).toFixed(2)}, retida pela plataforma até confirmação da devolução do item.</p>
                    <p><strong>Taxa de serviço da plataforma:</strong> R$ ${(aluguel.precoTotalComTaxa - aluguel.precoTotal).toFixed(2)}</p>
                </div>
                
                <div class="section">
                    <h4>4. RESPONSABILIDADES DO LOCATÁRIO</h4>
                    <ul>
                    <li>Conservar o item em perfeitas condições de uso, sendo responsável por danos, perda total ou furto durante o período de locação;</li>
                    <li>Efetuar a devolução no prazo acordado, sob pena de multa de <strong>1,5x o valor da diária</strong> por dia de atraso;</li>
                    <li>Arcar com custos de reparo ou substituição em caso de danos constatados;</li>
                    <li>Não transferir, emprestar ou sublocar o item a terceiros sem autorização do locador;</li>
                    <li>Utilizar o item de forma adequada, conforme suas instruções e finalidade;</li>
                    <li>Reportar imediatamente à plataforma qualquer incidente, dano ou imprevisto;</li>
                    <li>Fornecer informações verídicas durante todo o processo de aluguel e verificação;</li>
                    <li>Permitir a coleta e rastreamento de dados técnicos, incluindo localização e IP, para fins de segurança.</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h4>5. RESPONSABILIDADES DO LOCADOR</h4>
                    <ul>
                    <li>Entregar o item em perfeito estado de uso e funcionamento;</li>
                    <li>Fornecer informações claras e precisas sobre o produto e suas condições;</li>
                    <li>Respeitar o valor e o prazo acordados sem cobranças adicionais indevidas;</li>
                    <li>Receber o item e confirmar a devolução via plataforma Coisa Rápida;</li>
                    <li>Fornecer orientações de uso adequado do item, quando necessário;</li>
                    <li>Manter comunicação durante o período de aluguel através dos canais da plataforma;</li>
                    <li>Documentar adequadamente o estado do item antes da entrega através do sistema de verificação fotográfica.</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h4>6. INTERMEDIAÇÃO E GARANTIAS DA PLATAFORMA</h4>
                    <ul>
                    <li>A Coisa Rápida atua como intermediadora digital, garantindo o bloqueio e liberação segura dos valores;</li>
                    <li>A caução será devolvida integralmente ao locatário após a confirmação de devolução sem danos;</li>
                    <li>Em caso de dano, furto ou não devolução, o valor da caução poderá ser usado total ou parcialmente para indenização do locador;</li>
                    <li>A plataforma poderá reter valores adicionais ou acionar medidas legais em caso de fraude, dano intencional ou reincidência;</li>
                    <li>A plataforma garante a verificação das partes através de sistemas de validação de identidade, análise de histórico e verificação de endereço;</li>
                    <li>Todo o processo de mediação segue as regras disponíveis nos Termos de Uso da plataforma Coisa Rápida.</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h4>7. CASOS DE FURTO, PERDA OU DANO TOTAL</h4>
                    <p>Em caso de furto, perda ou dano irreparável, o locatário se compromete a:</p>
                    <ul>
                    <li>Comunicar imediatamente o fato à plataforma e às autoridades competentes;</li>
                    <li>Indenizar o locador pelo valor integral do item conforme preço de mercado atual ou valor declarado no anúncio;</li>
                    <li>A plataforma poderá intermediar a compensação utilizando a caução e valores adicionais se necessário;</li>
                    <li>Fornecer o Boletim de Ocorrência e documentação necessária para processos de seguro, quando aplicável;</li>
                    <li>Manter-se disponível para esclarecimentos adicionais por até 90 dias após o incidente.</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h4>8. DADOS COLETADOS E PRIVACIDADE</h4>
                    <p>As partes estão cientes que a plataforma Coisa Rápida coleta e processa os seguintes dados:</p>
                    <ul>
                    <li><strong>Dados de identificação:</strong> nome, CPF, documentos oficiais, foto do perfil;</li>
                    <li><strong>Dados técnicos:</strong> endereço IP, localização GPS, modelos de dispositivo, sistema operacional;</li>
                    <li><strong>Dados de transação:</strong> valores, datas, histórico de pagamentos;</li>
                    <li><strong>Dados de verificação:</strong> comprovante de residência, verificação de telefone, validações biométricas;</li>
                    <li><strong>Registros de uso:</strong> logs de acesso, mensagens trocadas através da plataforma, avaliações;</li>
                    <li><strong>Fotos de verificação:</strong> imagens do item no momento da entrega e devolução;</li>
                    <li><strong>Assinaturas digitais:</strong> registros de aceitação de termos e contrato.</li>
                    </ul>
                    <p>Estes dados são coletados com o propósito de:</p>
                    <ul>
                    <li>Garantir a segurança das transações e das partes envolvidas;</li>
                    <li>Validar a identidade dos usuários;</li>
                    <li>Registrar evidências em caso de disputas;</li>
                    <li>Melhorar os serviços da plataforma;</li>
                    <li>Cumprir obrigações legais.</li>
                    </ul>
                    <p>O tratamento destes dados segue a Política de Privacidade da plataforma e está em conformidade com a Lei Geral de Proteção de Dados (LGPD).</p>
                </div>
                
                <div class="section">
                    <h4>9. ASSINATURA DIGITAL E VALIDAÇÃO</h4>
                    <p>Este contrato é assinado digitalmente através da plataforma Coisa Rápida, com os seguintes mecanismos de validação:</p>
                    <ul>
                    <li>Autenticação multifator dos usuários;</li>
                    <li>Registro de endereço IP no momento da assinatura (IP do usuário);</li>
                    <li>Registro de dispositivo utilizado (dispositivo do usuário);</li>
                    <li>Timestamp criptográfico do momento da aceitação;</li>
                    <li>Armazenamento seguro em blockchain ou sistema equivalente para garantir imutabilidade;</li>
                    <li>Verificação de identidade prévia dos usuários.</li>
                    </ul>
                    <p>As partes reconhecem que a assinatura digital realizada através da plataforma tem plena validade jurídica, nos termos da MP 2.200-2/2001 e do Art. 10 da Lei 14.063/2020.</p>
                </div>
                
                <div class="section">
                    <h4>10. COMUNICAÇÕES E NOTIFICAÇÕES</h4>
                    <p>Todas as comunicações referentes a este contrato devem ser realizadas através dos canais oficiais da plataforma Coisa Rápida:</p>
                    <ul>
                    <li>Chat interno da aplicação;</li>
                    <li>Notificações push;</li>
                    <li>E-mails registrados na plataforma;</li>
                    <li>SMS para telefones verificados.</li>
                    </ul>
                    <p>Comunicações realizadas fora da plataforma não serão consideradas oficiais para fins de mediação de conflitos.</p>
                </div>
                
                <div class="section">
                    <h4>11. RESCISÃO E PENALIDADES</h4>
                    <ul>
                    <li>O descumprimento de qualquer cláusula poderá resultar em suspensão da conta e medidas legais cabíveis;</li>
                    <li>As partes concordam em resolver eventuais disputas por mediação via plataforma antes de recorrer ao Judiciário;</li>
                    <li>Cancelamentos antes da retirada do item seguem a política de cancelamento da plataforma;</li>
                    <li>Descumprimentos recorrentes podem levar a penalidades permanentes, incluindo exclusão da plataforma e impossibilidade de novo cadastro.</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h4>12. FORO</h4>
                    <p>Fica eleito o foro da comarca de São Paulo para dirimir quaisquer controvérsias oriundas deste contrato.</p>
                </div>
                
                <p><strong>Data:</strong> ${new Date().toLocaleDateString(
                    'pt-BR',
                    {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    },
                )}</p>
                
                <div class="footer">
                    <p>Contrato gerado digitalmente pela plataforma Coisa Rápida.</p>
                    <p class="metadata">ID do Contrato: ${id}</p>
                </div>
            </body>
            </html>`;

        return { conteudoHtml: conteudo };
    }
}
