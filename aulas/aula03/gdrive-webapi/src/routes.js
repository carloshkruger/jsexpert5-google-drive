import FileHelper from "./fileHelper.js";
import { dirname, resolve } from "path";
import { fileURLToPath, parse } from "url";
import UploadHandler from "./uploadHandler.js";
import { pipeline } from "stream/promises";
import { logger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDownloadsFolder = resolve(__dirname, "../", "downloads");

export default class Routes {
  io;

  constructor(downloadsFolder = defaultDownloadsFolder) {
    this.downloadsFolder = downloadsFolder;
    this.fileHelper = FileHelper;
  }

  setSocketInstance(io) {
    this.io = io;
  }

  async defaultRoute(request, response) {
    response.end("Hello World");
  }

  async options(request, response) {
    response.writeHead(204);
    response.end();
  }

  async post(request, response) {
    const { headers } = request;
    const {
      query: { socketId },
    } = parse(request.url, true);

    const uploadHandler = new UploadHandler({
      socketId,
      io: this.io,
      downloadsFolder: this.downloadsFolder,
    });

    const onFinish = (response) => () => {
      response.writeHead(200);
      const data = JSON.stringify({ result: "Files uploaded with success" });
      response.end(data);
    };

    const busboy = uploadHandler.registerEvents(headers, onFinish(response));

    await pipeline(request, busboy);

    logger.info("Request finished with success");
  }

  async get(request, response) {
    const files = await this.fileHelper.getFilesStatus(this.downloadsFolder);

    response.writeHead(200);
    response.end(JSON.stringify(files));
  }

  async handler(request, response) {
    response.setHeader("Access-Control-Allow-Origin", "*");

    const chosen = this[request.method.toLowerCase()] || this.defaultRoute;

    return chosen.apply(this, [request, response]);
  }
}
