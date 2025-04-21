import sharp from 'sharp';

class ImageTool {
  /**
   * Resize image to thumbnail
   * @param image
   * @returns
   */
  public async resize(image: Buffer): Promise<Buffer> {
    return await sharp(image, { failOnError: false }).rotate().withMetadata().resize(200).toBuffer();
  }
}

export default new ImageTool();
