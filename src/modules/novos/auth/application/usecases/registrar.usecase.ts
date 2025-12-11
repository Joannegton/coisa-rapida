import { AuthRepository } from '../../infra/repositories/auth.repository';
import { RegistrarDto } from '../dtos/registrar.dto';

export class RegistrarUsecase {
    constructor(private readonly repository: AuthRepository) {}

    protected execute(props: RegistrarDto) {
        if (props.email)
    }
}
