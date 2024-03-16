import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUploadDto } from './dto/create-upload.dto';
import { S3 } from 'aws-sdk';
import { UpdateUploadDto } from './dto/update-upload.dto';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as path from 'path';
import { Readable } from 'stream';
import { Writable } from 'stream';
import * as ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';


@Injectable()
export class UploadsService {

  async uploadMultipleFile(clips: Express.Multer.File[]) {
    try {
      const arrayLength = clips.length;
      if (arrayLength > 3) {
        throw new HttpException(`Sending More then three video files!`, HttpStatus.BAD_REQUEST);
      }
      if (arrayLength !== 3) {
        throw new HttpException(`Must be three videos!`, HttpStatus.BAD_REQUEST);
      }
      const uploadPromises: Promise<string>[] = [];

      for (const clip of clips) {
        uploadPromises.push(this.uploadFileToS3(clip));
      }

      const filePath = await Promise.all(uploadPromises);
      console.log('filePath', filePath);


      const command = ffmpeg();

      filePath.forEach((videoPath) => {
        command.input(videoPath);
      });
      const filters = [
        { filter: 'scale', options: { w: 1920, h: 1080, force_original_aspect_ratio: 'decrease' }, inputs: '0:v', outputs: 'v0' },
        { filter: 'scale', options: { w: 1920, h: 1080, force_original_aspect_ratio: 'decrease' }, inputs: '1:v', outputs: 'v1' },
        { filter: 'scale', options: { w: 1920, h: 1080, force_original_aspect_ratio: 'decrease' }, inputs: '2:v', outputs: 'v2' },
        { filter: 'concat', options: { n: 3, v: 1 }, inputs: ['v0', 'v1', 'v2'], outputs: 'outv' }
    ];

    // Set complex filter using complexFilter method
    command.complexFilter(filters, 'outv');

    // Set output frame rate
    command.outputFPS(30);

    // Specify output codec, quality, and output file
    command.outputOptions(['-c:v libx264', '-crf 23', '-preset veryfast']);

      // command.format('mp4');
      const outputPath = 'output.mp4';
      await new Promise<void>((resolve, reject) => {
        command.save(outputPath)
          .on('end', () => {
            console.log('Merging complete');
            resolve();
          })
          .on('error', (err) => {
            console.error('Error merging videos:', err);
            reject(err);
          });
          
      });

      const s3Buffer = fs.readFileSync('output.mp4');

      const s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      });
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: process.env.AWS_BUCKET,
        Key: `videos/${Date.now()}-output.mp4`, // You can customize the key as needed
        Body: s3Buffer,
        ACL: 'public-read', // Set the ACL as needed
      };
      const result = await s3.upload(uploadParams).promise();
      fs.unlinkSync('output.mp4');
      return { videoUrl: result.Location };
    }
    catch (error) {
      fs.unlinkSync('output.mp4');
      throw new HttpException(`Somthing went wrong With These videos try with some other Videos! ${error}`, HttpStatus.BAD_REQUEST);
    }
  }


  async getVideoInfo(videoPath: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  private async uploadFileToS3(file: Express.Multer.File): Promise<string> {
    const s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET,
      Key: `videos/${Date.now()}-${file.originalname}`, // You can customize the key as needed
      Body: file.buffer,
      ACL: 'public-read', // Set the ACL as needed
    };

    const result = await s3.upload(uploadParams).promise();
    return result.Location; // Return the URL of the uploaded file
  }
}
