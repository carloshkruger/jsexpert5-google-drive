import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  test,
  expect,
  jest,
} from "@jest/globals";
import fs from "fs";
import FormData from "form-data";
import TestUtil from "../_util/testUtil.js";
import Routes from "../../src/routes.js";
import { logger } from "../../src/logger.js";
import { tmpdir } from "os";
import { join } from "path";

describe("Routes integration test", () => {
  const ioObj = {
    to: () => ioObj,
    emit: () => {},
  };

  let defaultDownloadsFolder = "";

  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(
      join(tmpdir(), "downloads-")
    );
  });

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true });
  });

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });

  describe("getFileStatus", () => {
    test("should upload file to the folder", async () => {
      const filename = "images.jpeg";
      const fileStream = fs.createReadStream(
        `./test/integration/mocks/${filename}`
      );
      const response = TestUtil.generateWritableStream(() => {});
      const form = new FormData();
      form.append("photo", fileStream);

      const defaultParams = {
        request: Object.assign(form, {
          headers: form.getHeaders(),
          method: "POST",
          url: "?socketId=10",
        }),
        response: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
      };

      const routes = new Routes(defaultDownloadsFolder);
      routes.setSocketInstance(ioObj);

      const dir = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dir).toEqual([]);

      await routes.handler(defaultParams.request, defaultParams.response);

      const dirAfterRun = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dirAfterRun).toEqual([filename]);

      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200);
      expect(defaultParams.response.end).toHaveBeenCalledWith(
        JSON.stringify({ result: "Files uploaded with success" })
      );
    });
  });
});
