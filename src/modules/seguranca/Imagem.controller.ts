import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFiles, HttpException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from './infra/auth/FirebaseAuth.guard';
import { SalvarImagensUseCase } from './application/usecases/SalvarImagensItem.usecase';

@Controller('imagem')
export class ImagemController {
  constructor(
    private readonly salvarImagensUseCase: SalvarImagensUseCase,
  ) {}

  @UseGuards(FirebaseAuthGuard)
  @Post('upload')
  @UseInterceptors(FilesInterceptor('imagens', 5)) // Permite até 5 arquivos
  async solicitarVerificacaoResidencia(
    @UploadedFiles() imagens: Express.Multer.File[],
    @Body() body: { pasta: string; subPasta?: string },
  ): Promise<any> {
      const result = await this.salvarImagensUseCase.execute({
        imagens: imagens,
        pasta: body.pasta,
        subPasta: body.subPasta
      });

      if (result.ehFalha()) {
        throw new HttpException({
          success: false,
          message: result.erro?.message || 'Erro desconhecido',
        }, 400);
      }

      return {
        success: true,
        data: result.valor,
      };

  }
}