// passar para o usuario dominio depois
export class EstatisticasUsuarioViewDto {
  usuarioId: string;
  totalAlugueisComoLocador: number;
  totalItensAlugados: number;
  totalAvaliacoes: number;
}
// async buscarEstatisticas(usuarioId: string): Promise<EstatisticasUsuarioDTO> {
//   return await this.manager.query(
//     'SELECT * FROM usuarios.v_estatisticas_usuario WHERE usuario_id = $1',
//     [usuarioId]
//   );
