import { S3 } from "aws-sdk";

export declare type IYandexStorageUpload = {
  localRootFolder: string;
  s3RootFolder: string;
  s3Bucket: string;
  awsS3Options: S3.Types.ClientConfiguration;
  excludeFile?(root: string, stat: { name: string; error?: any }): boolean;
};

export declare function yandexStorageUpload(
  params: IYandexStorageUpload
): Promise<void>;
