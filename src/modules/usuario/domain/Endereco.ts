import { EnderecoDto } from '../application/dtos/endereco.dto';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';

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

    static criar(props: EnderecoProps): Endereco {
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
        instancia.setLatitude(props.latitude);
        instancia.setLongitude(props.longitude);

        return instancia;
    }

    static carregar(props: EnderecoProps): Endereco {
        const instancia = new Endereco();
        instancia.props = props;
        return instancia;
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

    private setCep(cep: string): void {
        if (cep?.length !== 9) {
            throw new InvalidPropsException(
                'CEP deve ter 8 dígitos no formato 00000-000',
            );
        }
        this.props.cep = cep;
    }

    private setRua(rua: string): void {
        if (!rua || rua.trim().length === 0) {
            throw new InvalidPropsException('Rua é obrigatória');
        }
        this.props.rua = rua;
    }

    private setNumero(numero: string): void {
        if (!numero || numero.trim().length === 0) {
            throw new InvalidPropsException('Número é obrigatório');
        }
        this.props.numero = numero;
    }

    private setComplemento(complemento: string): void {
        this.props.complemento = complemento;
    }

    private setBairro(bairro: string): void {
        if (!bairro || bairro.trim().length === 0) {
            throw new InvalidPropsException('Bairro é obrigatório');
        }
        this.props.bairro = bairro;
    }

    private setCidade(cidade: string): void {
        if (!cidade || cidade.trim().length === 0) {
            throw new InvalidPropsException('Cidade é obrigatória');
        }
        this.props.cidade = cidade;
    }

    private setEstado(estado: string): void {
        if (estado?.length !== 2) {
            throw new InvalidPropsException('Estado deve ter 2 caracteres');
        }
        this.props.estado = estado;
    }

    private setPais(pais: string): void {
        if (!pais || pais.trim().length === 0) {
            throw new InvalidPropsException('País é obrigatório');
        }
        this.props.pais = pais;
    }

    private setLatitude(latitude?: number): void {
        if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
            throw new InvalidPropsException(
                'Latitude deve estar entre -90 e 90',
            );
        }
        this.props.latitude = latitude;
    }

    private setLongitude(longitude?: number): void {
        if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
            throw new InvalidPropsException(
                'Longitude deve estar entre -180 e 180',
            );
        }
        this.props.longitude = longitude;
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
