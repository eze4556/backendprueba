import S3 from 'aws-sdk/clients/s3';
import { Request, Response } from 'express';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, INTERNAL_ERROR } from '../../../constants/codes.constanst';
import { environment } from '../../../environments/environments';
import imageTool from '../../../tools/image.tools';

const { AWS_URL, AWS_ID, AWS_SECRET_KEY, AWS_BUCKET } = environment();

const s3 = new S3({
  accessKeyId: AWS_ID,
  secretAccessKey: AWS_SECRET_KEY,
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

      const params = {
        profile: {
          Bucket: AWS_BUCKET,
          Key: `profiles/${_id}/profile/${file.name}`,
          Body: file.buffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read',
        },
        thumbnail: {
          Bucket: AWS_BUCKET,
          Key: `profiles/${_id}/thumbnail/${file.name}`,
          Body: thumbnail,
          ContentType: 'image/jpeg',
          ACL: 'public-read',
        },
      };

      const details = { profile: await s3.upload(params.profile).promise(), thumbnail: await s3.upload(params.thumbnail).promise() };

      return HttpHandler.response(res, SUCCESS, { message: 'Profile picture uploaded', data: { details } });
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
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

      const params = {
        trailer: {
          Bucket: AWS_BUCKET,
          Key: `profiles/${_id}/trailer/${file.name}`,
          Body: file.buffer,
          ContentType: 'video/mp4',
          ACL: 'public-read',
        },
      };

      const details = { trailer: await s3.upload(params.trailer).promise() };

      return HttpHandler.response(res, SUCCESS, { message: 'Trailer uploaded', data: { details } });
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
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

      const params = {
        profile: {
          Bucket: AWS_BUCKET,
          Delimiter: '/',
          Prefix: `profiles/${_id}/profile/`,
        },
        thumbnail: {
          Bucket: AWS_BUCKET,
          Delimiter: '/',
          Prefix: `profiles/${_id}/thumbnail/`,
        },
      };

      const result = {
        profile: `${AWS_URL}${(await s3.listObjectsV2(params.profile).promise()).Contents?.filter((file) => file.Size !== 0).pop()?.Key}`,
        thumbnail: `${AWS_URL}${
          (await s3.listObjectsV2(params.thumbnail).promise()).Contents?.filter((file) => file.Size !== 0).pop()?.Key
        }`,
      };

      return HttpHandler.response(res, SUCCESS, { message: 'Response successfully', data: { result } });
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
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

      const params = {
        trailer: {
          Bucket: AWS_BUCKET,
          Delimiter: '/',
          Prefix: `profiles/${_id}/trailer/`,
        },
      };

      const result = {
        trailer: `${AWS_URL}${(await s3.listObjectsV2(params.trailer).promise()).Contents?.filter((file) => file.Size !== 0).pop()?.Key}`,
      };

      return HttpHandler.response(res, SUCCESS, { message: 'Response successfully', data: { result } });
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }
}

export default new MediaController();
