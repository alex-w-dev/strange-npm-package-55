const walk = require("walk");
const AWS = require("aws-sdk");
const fs = require("fs");
const nodePath = require("path");
const mime = require("mime-types");

const commonExcludeFile = (root, stat) => {
  return stat.name.includes(".LICENSE") || stat.name.includes("manifest.json");
};

const uploadToS3 = async ({
  localRootFolder,
  fileRelativePath,
  aws,
  s3RootFolder,
  s3Bucket,
}) => {
  const Body = fs.createReadStream(
    nodePath.join(localRootFolder, fileRelativePath)
  );
  const Key = `${nodePath
    .normalize(`${s3RootFolder}/${fileRelativePath}`)
    .replaceAll(nodePath.sep, "/")}`;

  try {
    const params = {
      Bucket: s3Bucket, // название созданного bucket
      Key, // путь и название файла в облаке (path без слэша впереди)
      Body, // сам файл
      ContentType: mime.lookup(Key) || undefined, // тип файла
    };

    await aws.upload(params).promise();
  } catch (e) {
    console.error(e);
  }
};

const readAllFiles = async (folderPath) => {
  const walker = walk.walk(folderPath, { followLinks: false });
  const files = [];

  walker.on("file", (root, stat, next) => {
    files.push({
      root,
      stat,
    });
    next();
  });

  try {
    await new Promise((res, rej) => {
      let hasErrors = false;

      walker.on("errors", (root, nodeStatsArray, next) => {
        hasErrors = true;
        console.error(root, nodeStatsArray);
        next();
      });
      walker.on("end", () => {
        hasErrors ? rej() : res();
      });
    });
  } catch (e) {
    console.error("Walker returned the errors!");

    return [];
  }

  return files;
};

function validateYandexStorageUploadParams(params) {
  const undefinedParams = [];

  for (const key of [
    "localRootFolder",
    "s3RootFolder",
    "s3Bucket",
    "awsS3Options",
  ]) {
    if (!params[key]) {
      undefinedParams.push(key);
    }
  }

  if (undefinedParams.length) {
    throw new Error(`Not passed required params: ${undefinedParams.join()}`);
  }
}

async function yandexStorageUpload(params) {
  validateYandexStorageUploadParams(params);

  const files = await readAllFiles(params.localRootFolder);
  const excludeFile = params.excludeFile || commonExcludeFile;
  const aws = new AWS.S3({
    endpoint: "https://storage.yandexcloud.net",
    region: "ru-central1",
    httpOptions: {
      timeout: 10000,
      connectTimeout: 10000,
    },
    ...params.awsS3Options,
  });

  for (const file of files) {
    if (excludeFile(file.root, file.stat)) {
      console.log(`excluding file: ${file.stat.name}`);
    } else {
      await uploadToS3({
        localRootFolder: params.localRootFolder,
        fileRelativePath: `${file.root}/${file.stat.name}`.replace(
          params.localRootFolder,
          ""
        ),
        aws,
        s3RootFolder: params.s3RootFolder,
        s3Bucket: params.s3Bucket,
      });
    }
  }
}

module.exports = {
  yandexStorageUpload,
};
