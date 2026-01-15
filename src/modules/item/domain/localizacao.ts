import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';

export interface LocalizacaoProps {
    latitude: number;
    longitude: number;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
}

export class LocalizacaoItem {
    private readonly props: LocalizacaoProps;

    constructor() {
        this.props = {} as LocalizacaoProps;
    }

    static criar(props: LocalizacaoProps): LocalizacaoItem {
        const domain = new LocalizacaoItem();
        domain.setLatitude(props.latitude);
        domain.setLongitude(props.longitude);
        domain.setEndereco(props.endereco);
        domain.setCidade(props.cidade);
        domain.setEstado(props.estado);
        domain.setCep(props.cep);
        return domain;
    }

    // //TODO verificar se e calculando corretamente
    // calcularDistanciaAte(outra: Localizacao): number {
    //     const R = 6371; // Raio da Terra em km
    //     const dLat = this.toRad(outra.latitude - this.latitude);
    //     const dLng = this.toRad(outra.longitude - this.longitude);
    //     const a =
    //         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //         Math.cos(this.toRad(this.latitude)) *
    //             Math.cos(this.toRad(outra.latitude)) *
    //             Math.sin(dLng / 2) *
    //             Math.sin(dLng / 2);
    //     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //     return R * c;
    // }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    get latitude(): number {
        return this.props.latitude;
    }

    get longitude(): number {
        return this.props.longitude;
    }

    get endereco(): string {
        return this.props.endereco;
    }

    get cidade(): string {
        return this.props.cidade;
    }

    get estado(): string {
        return this.props.estado;
    }

    get cep(): string {
        return this.props.cep;
    }

    get enderecoFormatado(): string {
        return `${this.endereco}, ${this.cidade} - ${this.estado}${
            this.cep ? ', ' + this.cep : ''
        }`;
    }

    private setLatitude(value: number) {
        if (value === undefined || value === null) {
            throw new InvalidPropsException('latitude é obrigatória');
        }
        if (value < -90 || value > 90) {
            throw new InvalidPropsException('latitude inválida');
        }
        this.props.latitude = value;
    }

    private setLongitude(value: number) {
        if (value === undefined || value === null) {
            throw new InvalidPropsException('longitude é obrigatória');
        }
        if (value < -180 || value > 180) {
            throw new InvalidPropsException('longitude inválida');
        }
        this.props.longitude = value;
    }

    private setEndereco(value: string) {
        if (!value || value.trim() === '') {
            throw new InvalidPropsException('endereco é obrigatório');
        }
        this.props.endereco = value;
    }

    private setCidade(value: string) {
        if (!value || value.trim() === '') {
            throw new InvalidPropsException('cidade é obrigatória');
        }
        this.props.cidade = value;
    }

    private setEstado(value: string) {
        if (!value || value.trim() === '') {
            throw new InvalidPropsException('estado é obrigatório');
        }
        this.props.estado = value;
    }

    private setCep(value: string) {
        if (!value || value.trim() === '') {
            throw new InvalidPropsException('cep é obrigatório');
        }
        this.props.cep = value;
    }
}
