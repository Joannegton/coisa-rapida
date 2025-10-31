import { Resultado, ResultadoUtil } from "src/shared/resultado";
import { Endereco } from "./Endereco";
import { EnderecoFirestore, UsuarioFirestore } from "../infra/services/UsuarioFirestore.service";

export type UsuarioProps = {
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  emailVerificado: boolean;
  enderecoVerificado?: boolean;
  verificado: boolean;
  endereco: Endereco;
  criadoEm: Date;
  atualizadoEm: Date;
};

export class Usuario {
  private _id: string;
  private props: UsuarioProps;

  constructor(id: string) {
    this._id = id;
    this.props = {} as UsuarioProps;
  }

  static criar(props: UsuarioFirestore, id: string): Resultado<Usuario, Error> {
    const instancia = new Usuario(id);

    instancia.setNome(props.nome);
    instancia.setEmail(props.email);
    instancia.setTelefone(props.telefone);
    instancia.setCpf(props.cpf);
    instancia.setEndereco(props.endereco);
    instancia.setEmailVerificado(props.emailVerificado);
    instancia.setVerificado(props.verificado);
    instancia.setCreatedAt(props.criadoEm);

    return ResultadoUtil.sucesso(instancia);
  }

  static carregar(props: UsuarioProps, id: string): Usuario {
    const instancia = new Usuario(id);
    instancia.props = props;
    return instancia;
  }

  // Métodos de negócio
  verificarResidencia(): void {
    // this.props.residenciaVerificada = true;
    // this.atualizarVerificado();
    // this.props.atualizadoEm = new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get email(): string {
    return this.props.email;
  }

  get telefone(): string | undefined {
    return this.props.telefone;
  }

  get endereco(): Endereco {
    return this.props.endereco;
  }

  get cpf(): string | undefined {
    return this.props.cpf;
  }

  get emailVerificado(): boolean {
    return this.props.emailVerificado;
  }

  get verificado(): boolean {
    return this.props.verificado;
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }

  // Setters privados
  private setNome(nome: string): Resultado<void, Error> {
    if (!nome || nome.trim().length < 2) {
      return ResultadoUtil.falha(new Error('Nome deve ter pelo menos 2 caracteres'));
    }
    this.props.nome = nome.trim();
    return ResultadoUtil.sucesso();
  }

  private setEmail(email: string): Resultado<void, Error> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return ResultadoUtil.falha(new Error('Email inválido'));
    }
    this.props.email = email.toLowerCase().trim();
    return ResultadoUtil.sucesso();
  }

  private setTelefone(telefone?: string): Resultado<void, Error> {
    if (telefone && telefone.length < 10) {
      return ResultadoUtil.falha(new Error('Telefone deve ter pelo menos 10 dígitos'));
    }
    this.props.telefone = telefone;
    return ResultadoUtil.sucesso();
  }

  private setCpf(cpf?: string): Resultado<void, Error> {
    if (cpf) {
      // Validação básica de CPF (pode ser aprimorada)
      const cpfLimpo = cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        return ResultadoUtil.falha(new Error('CPF deve ter 11 dígitos'));
      }
      this.props.cpf = cpfLimpo;
    } else {
      this.props.cpf = cpf;
    }
    return ResultadoUtil.sucesso();
  }

  private setEndereco(endereco: EnderecoFirestore): Resultado<void, Error> {
    const enderecoResult = Endereco.criar({
        rua: endereco.rua,
        numero: endereco.numero,
        bairro: endereco.bairro,
        cep: endereco.cep,
        cidade: endereco.cidade,
        estado: endereco.estado,
        pais: endereco.pais || 'Brasil',
        complemento: endereco.complemento,
        latitude: endereco.latitude,
        longitude: endereco.longitude,
    });
    if (enderecoResult.ehFalha()) {
        return ResultadoUtil.falha(enderecoResult.erro!);
    }
    this.props.endereco = enderecoResult.valor!;
    return ResultadoUtil.sucesso();
  }

  private setEmailVerificado(emailVerificado: boolean): Resultado<void, Error> {
    this.props.emailVerificado = emailVerificado;
    return ResultadoUtil.sucesso();
  }

  private setVerificado(verificado: boolean): Resultado<void, Error> {
    this.props.verificado = verificado;
    return ResultadoUtil.sucesso();
  }

  private setCreatedAt(createdAt: Date): Resultado<void, Error> {
    this.props.criadoEm = createdAt;
    return ResultadoUtil.sucesso();
  }

  private setUpdatedAt(updatedAt: Date): Resultado<void, Error> {
    this.props.atualizadoEm = updatedAt;
    return ResultadoUtil.sucesso();
  }

  toDto() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      telefone: this.telefone,
      cpf: this.cpf,
      emailVerificado: this.emailVerificado,
      verificado: this.verificado,
      criadoEm: this.criadoEm,
    };
  }
}