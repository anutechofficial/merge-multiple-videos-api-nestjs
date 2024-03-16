import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus, Body, Get, Patch, Param, Delete, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';// Import Request from express
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as mimeTypes from 'mime-types';
import { UploadsService } from './uploads.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';

const allowedMimeTypes = ['video/mp4'];


@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) { }


  @ApiOperation({ summary: 'Upload multiple file' })
  @Post('multiplefile')
  @UseInterceptors(FilesInterceptor('files', 3))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  uploadMultipleFile(@UploadedFiles() files: Express.Multer.File[]) {

    for (const file of files) {
      const mimeType: any = mimeTypes.lookup(file.originalname);
      if (!allowedMimeTypes.includes(mimeType)) {
        const allowedTypesString = allowedMimeTypes.map(type => type.split('/')[1]).join(', ');
        throw new HttpException(`Unsupported file type found ${mimeTypes.extension(mimeType)}, Please upload files of type: ${allowedTypesString}`, HttpStatus.BAD_REQUEST);
      }
    }
    if (files.length===0) {
      throw new HttpException('There is no file!', HttpStatus.BAD_REQUEST)
    }
    console.log('files', files);
    return this.uploadsService.uploadMultipleFile(files);
  }
}
