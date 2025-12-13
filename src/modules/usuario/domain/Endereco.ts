import { Resultado, ResultadoUtil } from 'src/shared/utils/resultado';
import { EnderecoDto } from '../application/dtos/endereco.dto';

export type EnderecoProps = {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais?: string;
    latitude?: number;
    longitude?: number;
};

export class Endereco {
    private props: EnderecoProps;

    constructor() {
        this.props = {} as EnderecoProps;
    }

    static criar(props: EnderecoProps): Resultado<Endereco, Error> {
        const instancia = new Endereco();

        instancia.setRua(props.rua);
        instancia.setNumero(props.numero);
        instancia.setBairro(props.bairro);
        instancia.setCep(props.cep);
        instancia.setEstado(props.estado);
        instancia.setCidade(props.cidade);
        instancia.setPais(props.pais || 'Brasil');
        if (props.complemento) {
            instancia.setComplemento(props.complemento);
        }
        if (props.latitude) {
            instancia.setLatitude(props.latitude);
        }
        if (props.longitude) {
            instancia.setLongitude(props.longitude);
        }

        return ResultadoUtil.sucesso(instancia);
    }

    static carregar(props: EnderecoProps): Endereco {
        const instancia = new Endereco();
        instancia.props = props;
        return instancia;
    }

    // Métodos de negócio
    atualizarCoordenadas(
        latitude: number,
        longitude: number,
    ): Resultado<void, Error> {
        if (latitude < -90 || latitude > 90) {
            return ResultadoUtil.falha(
                new Error('Latitude deve estar entre -90 e 90'),
            );
        }
        if (longitude < -180 || longitude > 180) {
            return ResultadoUtil.falha(
                new Error('Longitude deve estar entre -180 e 180'),
            );
        }
        this.props.latitude = latitude;
        this.props.longitude = longitude;
        return ResultadoUtil.sucesso();
    }

    atualizarEndereco(parcial: Partial<EnderecoProps>): Resultado<void, Error> {
        if (parcial.cep && parcial.cep.length !== 8) {
            return ResultadoUtil.falha(new Error('CEP deve ter 8 dígitos'));
        }
        if (parcial.rua && parcial.rua.trim().length === 0) {
            return ResultadoUtil.falha(new Error('Rua não pode ser vazia'));
        }
        if (parcial.numero && parcial.numero.trim().length === 0) {
            return ResultadoUtil.falha(new Error('Número não pode ser vazio'));
        }
        if (parcial.bairro && parcial.bairro.trim().length === 0) {
            return ResultadoUtil.falha(new Error('Bairro não pode ser vazio'));
        }
        if (parcial.cidade && parcial.cidade.trim().length === 0) {
            return ResultadoUtil.falha(new Error('Cidade não pode ser vazia'));
        }
        if (parcial.estado && parcial.estado.length !== 2) {
            return ResultadoUtil.falha(
                new Error('Estado deve ter 2 caracteres'),
            );
        }

        Object.assign(this.props, parcial);
        return ResultadoUtil.sucesso();
    }

    get cep(): string {
        return this.props.cep;
    }

    get rua(): string {
        return this.props.rua;
    }

    get numero(): string {
        return this.props.numero;
    }

    get complemento(): string | undefined {
        return this.props.complemento;
    }

    get bairro(): string {
        return this.props.bairro;
    }

    get cidade(): string {
        return this.props.cidade;
    }

    get estado(): string {
        return this.props.estado;
    }

    get pais(): string | undefined {
        return this.props.pais;
    }

    get latitude(): number | undefined {
        return this.props.latitude;
    }

    get longitude(): number | undefined {
        return this.props.longitude;
    }

    // Setters privados
    private setCep(cep: string): Resultado<void, Error> {
        if (!cep || cep.length !== 8) {
            return ResultadoUtil.falha(new Error('CEP deve ter 8 dígitos'));
        }
        this.props.cep = cep;
        return ResultadoUtil.sucesso();
    }

    private setRua(rua: string): Resultado<void, Error> {
        if (!rua || rua.trim().length === 0) {
            return ResultadoUtil.falha(new Error('Rua é obrigatória'));
        }
        this.props.rua = rua;
        return ResultadoUtil.sucesso();
    }

    private setNumero(numero: string): Resultado<void, Error> {
        if (!numero || numero.trim().length === 0) {
            return ResultadoUtil.falha(new Error('Número é obrigatório'));
        }
        this.props.numero = numero;
        return ResultadoUtil.sucesso();
    }

    private setComplemento(complemento: string): Resultado<void, Error> {
        this.props.complemento = complemento;
        return ResultadoUtil.sucesso();
    }

    private setBairro(bairro: string): Resultado<void, Error> {
        if (!bairro || bairro.trim().length === 0) {
            return ResultadoUtil.falha(new Error('Bairro é obrigatório'));
        }
        this.props.bairro = bairro;
        return ResultadoUtil.sucesso();
    }

    private setCidade(cidade: string): Resultado<void, Error> {
        if (!cidade || cidade.trim().length === 0) {
            return ResultadoUtil.falha(new Error('Cidade é obrigatória'));
        }
        this.props.cidade = cidade;
        return ResultadoUtil.sucesso();
    }

    private setEstado(estado: string): Resultado<void, Error> {
        if (!estado || estado.length !== 2) {
            return ResultadoUtil.falha(
                new Error('Estado deve ter 2 caracteres'),
            );
        }
        this.props.estado = estado;
        return ResultadoUtil.sucesso();
    }

    private setPais(pais: string): Resultado<void, Error> {
        if (!pais || pais.trim().length === 0) {
            return ResultadoUtil.falha(new Error('País é obrigatório'));
        }
        this.props.pais = pais;
        return ResultadoUtil.sucesso();
    }

    private setLatitude(latitude: number): Resultado<void, Error> {
        if (latitude < -90 || latitude > 90) {
            return ResultadoUtil.falha(
                new Error('Latitude deve estar entre -90 e 90'),
            );
        }
        this.props.latitude = latitude;
        return ResultadoUtil.sucesso();
    }

    private setLongitude(longitude: number): Resultado<void, Error> {
        if (longitude < -180 || longitude > 180) {
            return ResultadoUtil.falha(
                new Error('Longitude deve estar entre -180 e 180'),
            );
        }
        this.props.longitude = longitude;
        return ResultadoUtil.sucesso();
    }

    toDto(): EnderecoDto {
        return {
            rua: this.rua,
            numero: this.numero,
            complemento: this.complemento,
            bairro: this.bairro,
            cidade: this.cidade,
            estado: this.estado,
            cep: this.cep,
            pais: this.pais,
            latitude: this.latitude,
            longitude: this.longitude,
        };
    }
}
