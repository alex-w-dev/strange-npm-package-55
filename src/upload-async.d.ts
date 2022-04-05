import * as Stream from 'stream';

export declare type IUploadAsyncParams = {
  url: string,
  body: Buffer | Stream.Readable
};

export declare function uploadAsync(params: IUploadAsyncParams): Promise<void>;
