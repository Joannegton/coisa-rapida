export type UploadImagemProps = {
    file: Express.Multer.File;
    usuarioId: string;
};

export type UploadImagemResult = {
    url: string;
    publicId: string;
    format: string;
    resource_type: 'raw' | 'image' | 'video' | 'auto';
    bytes: number;
    type: string;
    secure_url: string;
    original_filename: string;
};
export interface UploadImagemService {
    uploadImagem(props: UploadImagemProps): Promise<UploadImagemResult>;
}
