import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from "src/shared/resultado";
import { Injectable } from "@nestjs/common";
import { CloudinaryService } from "../../infra/services/Cloudinary.service";

export type SalvarImagensProps = {
    imagens: Express.Multer.File[];
    pasta: string;
    subPasta?: string;
}

export type SalvarImagensExceptions = ServicoExcecao

@Injectable()
export class SalvarImagensUseCase {
    constructor(
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async execute(props: SalvarImagensProps): ResultadoAssincrono<string[], SalvarImagensExceptions> {
        try {
            const resultList = await Promise.all(props.imagens.map(async (imagem) => {
                const UploadResult = await this.cloudinaryService.uploadNoCloudinary({
                    file: imagem,
                    pasta: props.pasta,
                    subPasta: props.subPasta
                });
                return UploadResult;
            }));
            if (resultList.some(result => result.ehFalha())) {
                return ResultadoUtil.falha(resultList.find(result => result.ehFalha())?.erro || new ServicoExcecao('Erro no upload do comprovante'));
            }
            const urls = resultList.map(result => result.valor?.secure_url);

            return ResultadoUtil.sucesso(urls as string[]);
        } catch (error) {
            return ResultadoUtil.falha(error);
        }
    }
}