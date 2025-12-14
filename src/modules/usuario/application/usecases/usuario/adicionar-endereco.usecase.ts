import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EnderecoDto } from '../../dtos/endereco.dto';
import type { UsuarioRepository } from 'src/modules/usuario/domain/repositories/usuario.repository';
import { Endereco } from 'src/modules/usuario/domain/Endereco';
import { GeocodingService } from 'src/shared/services/geocoding.service';

export interface AdicionarEnderecoProps {
    usuarioId: string;
    endereco: EnderecoDto;
}

@Injectable()
export class AdicionarEnderecoUsecase {
    private readonly logger = new Logger(AdicionarEnderecoUsecase.name);

    constructor(
        @Inject('UsuarioRepository')
        private readonly usuarioRepository: UsuarioRepository,
        private readonly geocodingService: GeocodingService,
    ) {}

    async execute(
        props: AdicionarEnderecoProps,
    ): Promise<{ mensagem: string }> {
        const usuario = await this.usuarioRepository.buscarPorId(
            props.usuarioId,
        );

        if (!usuario) {
            throw new NotFoundException('Usuário não encontrado');
        }

        if (!props.endereco.latitude || !props.endereco.longitude) {
            try {
                const coordenadas = await this.geocodingService.geocodificar({
                    rua: props.endereco.rua,
                    numero: props.endereco.numero,
                    bairro: props.endereco.bairro,
                    cidade: props.endereco.cidade,
                    estado: props.endereco.estado,
                    cep: props.endereco.cep,
                    pais: props.endereco.pais,
                });

                props.endereco.latitude = coordenadas.latitude;
                props.endereco.longitude = coordenadas.longitude;

                this.logger.log(
                    `Endereço geocodificado: (${props.endereco.latitude}, ${props.endereco.longitude})`,
                );
            } catch (error) {
                this.logger.warn(
                    `Falha na geocodificação completa, tentando por CEP: ${error.message}`,
                );

                try {
                    const coordenadas =
                        await this.geocodingService.geocodificarPorCep(
                            props.endereco.cep,
                        );

                    props.endereco.latitude = coordenadas.latitude;
                    props.endereco.longitude = coordenadas.longitude;

                    this.logger.log(
                        `Endereço geocodificado por CEP: (${props.endereco.latitude}, ${props.endereco.longitude})`,
                    );
                } catch (cepError) {
                    this.logger.error(
                        `Falha ao geocodificar: ${cepError.message}`,
                    );
                    throw cepError;
                }
            }
        }

        const endereco = Endereco.criar({
            rua: props.endereco.rua,
            numero: props.endereco.numero,
            complemento: props.endereco.complemento,
            bairro: props.endereco.bairro,
            cidade: props.endereco.cidade,
            estado: props.endereco.estado,
            cep: props.endereco.cep,
            pais: props.endereco.pais,
            latitude: props.endereco.latitude,
            longitude: props.endereco.longitude,
        });

        usuario.definirEndereco(endereco);

        await this.usuarioRepository.salvar(usuario);

        return { mensagem: 'Endereço atualizado com sucesso' };
    }
}
