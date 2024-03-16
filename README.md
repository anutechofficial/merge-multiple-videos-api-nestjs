## Video Upload and Merge Service with NestJS

This NestJS application provides a service for uploading and merging multiple video files into a single video file using AWS S3 for storage and FFmpeg for merging. The main features include:

- **Upload Multiple Files**: Handles the upload of multiple video files simultaneously, ensuring that only three files are accepted at a time.
- **Merge Videos**: Uses FFmpeg to merge the uploaded videos into a single output video file with a specified resolution and frame rate.
- **AWS S3 Integration**: Utilizes AWS SDK to upload the merged video file to an S3 bucket, providing a publicly accessible URL for the merged video.
- **Error Handling**: Implements error handling to manage exceptions during the upload and merge process, ensuring robustness and reliability.

### Technologies Used:

- NestJS
- Express.js (underlying framework)
- Multer for file uploading
- AWS SDK for S3 integration
- FFmpeg for video processing

### Usage:

1. Install dependencies: `npm install`
2. Set up environment variables for AWS credentials and bucket configuration.
3. Run the application: `npm start`

### Contributing:

Contributions are welcome! Feel free to open issues or submit pull requests to enhance the functionality or improve the codebase.