import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Request, Response } from 'express';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, INTERNAL_ERROR } from '../../../constants/codes.constanst';
import { environment } from '../../../environments/environments';
import imageTool from '../../../tools/image.tools';

const { AWS_URL, AWS_ID, AWS_SECRET_KEY, AWS_BUCKET } = environment();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET_KEY,
  }
});

class MediaController {
  /**
   * Upload profile picture and thumbnail
   * @param req
   * @param res
   * @returns
   */
  public async uploadProfilePicture(req: Request, res: Response): Promise<Response> {
    try {
      const { _id } = req; // Get _id
      const data = req.file; // Get picture

      const file = {
        buffer: data!.buffer,
        name: `${Date.now()}.jpg`,
      };

      const thumbnail: Buffer = await imageTool.resize(file.buffer); // Resize picture and set thumbnail

      // AWS SDK v3 commands for uploading profile and thumbnail
      const profileCommand = new PutObjectCommand({
        Bucket: AWS_BUCKET,
        Key: `profiles/${_id}/profile/${file.name}`,
        Body: file.buffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      });

      const thumbnailCommand = new PutObjectCommand({
        Bucket: AWS_BUCKET,
        Key: `profiles/${_id}/thumbnail/${file.name}`,
        Body: thumbnail,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      });

      const [profileResult, thumbnailResult] = await Promise.all([
        s3Client.send(profileCommand),
        s3Client.send(thumbnailCommand)
      ]);

      const details = { 
        profile: {
          Location: `${AWS_URL}/${AWS_BUCKET}/profiles/${_id}/profile/${file.name}`,
          ETag: profileResult.ETag,
          Key: `profiles/${_id}/profile/${file.name}`
        }, 
        thumbnail: {
          Location: `${AWS_URL}/${AWS_BUCKET}/profiles/${_id}/thumbnail/${file.name}`,
          ETag: thumbnailResult.ETag,
          Key: `profiles/${_id}/thumbnail/${file.name}`
        }
      };

      return HttpHandler.success(res, { message: 'Profile picture uploaded', data: { details } });
    } catch (e) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (e as Error).message
      });
    }
  }

  /**
   * Upload trailer
   * @param req
   * @param res
   * @returns
   */
  public async uploadProfileTrailer(req: Request, res: Response): Promise<Response> {
    try {
      const { _id } = req; // Get _id
      const data = req.file; // Get picture

      const file = {
        buffer: data!.buffer,
        name: `${Date.now()}.mp4`,
      };

      // AWS SDK v3 command for uploading trailer
      const trailerCommand = new PutObjectCommand({
        Bucket: AWS_BUCKET,
        Key: `profiles/${_id}/trailer/${file.name}`,
        Body: file.buffer,
        ContentType: 'video/mp4',
        ACL: 'public-read',
      });

      const trailerResult = await s3Client.send(trailerCommand);

      const details = { 
        trailer: {
          Location: `${AWS_URL}/${AWS_BUCKET}/profiles/${_id}/trailer/${file.name}`,
          ETag: trailerResult.ETag,
          Key: `profiles/${_id}/trailer/${file.name}`
        }
      };

      return HttpHandler.success(res, { message: 'Trailer uploaded', data: { details } });
    } catch (e) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (e as Error).message
      });
    }
  }

  /**
   * Get profile picture and thumbnail
   * @param req
   * @param res
   * @returns
   */
  public async getProfilePicture(req: Request, res: Response): Promise<Response> {
    try {
      const { _id } = req; // Get _id

      // AWS SDK v3 commands for listing objects
      const profileCommand = new ListObjectsV2Command({
        Bucket: AWS_BUCKET,
        Delimiter: '/',
        Prefix: `profiles/${_id}/profile/`,
      });

      const thumbnailCommand = new ListObjectsV2Command({
        Bucket: AWS_BUCKET,
        Delimiter: '/',
        Prefix: `profiles/${_id}/thumbnail/`,
      });

      const [profileResponse, thumbnailResponse] = await Promise.all([
        s3Client.send(profileCommand),
        s3Client.send(thumbnailCommand)
      ]);

      const result = {
        profile: `${AWS_URL}${profileResponse.Contents?.filter((file: any) => file.Size !== 0).pop()?.Key}`,
        thumbnail: `${AWS_URL}${thumbnailResponse.Contents?.filter((file: any) => file.Size !== 0).pop()?.Key}`,
      };

      return HttpHandler.success(res, { message: 'Response successfully', data: { result } });
    } catch (e) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (e as Error).message
      });
    }
  }
  /**
   * Get profile trailer
   * @param req
   * @param res
   * @returns
   */
  public async getProfileTrailer(req: Request, res: Response): Promise<Response> {
    try {
      const { _id } = req; // Get _id

      // AWS SDK v3 command for listing trailer objects
      const trailerCommand = new ListObjectsV2Command({
        Bucket: AWS_BUCKET,
        Delimiter: '/',
        Prefix: `profiles/${_id}/trailer/`,
      });

      const trailerResponse = await s3Client.send(trailerCommand);

      const result = {
        trailer: `${AWS_URL}${trailerResponse.Contents?.filter((file: any) => file.Size !== 0).pop()?.Key}`,
      };

      return HttpHandler.success(res, { message: 'Response successfully', data: { result } });
    } catch (e) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (e as Error).message
      });
    }
  }
}

export default new MediaController();
