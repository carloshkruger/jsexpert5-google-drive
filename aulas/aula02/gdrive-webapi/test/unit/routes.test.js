import { describe, test, expect, jest } from "@jest/globals";
import { logger } from "../../src/logger.js";
import Routes from "../../src/routes.js";
import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";

describe("Routes", () => {
  const request = TestUtil.generateReadableStream(["some file bytes"]);
  const response = TestUtil.generateWritableStream(() => {});

  const defaultParams = {
    request: Object.assign(request, {
      headers: {
        "content-type": "multipart/form-data",
      },
      method: "",
      url: "",
      body: {},
    }),
    response: Object.assign(response, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    }),
  };

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });

  describe("setSocketInstance", () => {
    test("setSocketInstance should store io instance", () => {
      const routes = new Routes();
      const ioObj = {
        to: () => ioObj,
        emit: () => {},
      };

      routes.setSocketInstance(ioObj);

      expect(routes.io).toStrictEqual(ioObj);
    });
  });

  describe("handler", () => {
    test("given an inexistent route it should choose default route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = "inexistent";
      await routes.handler(params.request, params.response);

      expect(params.response.end).toHaveBeenCalledWith("Hello World");
    });

    test("it should set any request with CORS enabled", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = "inexistent";
      await routes.handler(params.request, params.response);

      expect(params.response.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "*"
      );
    });

    test("given method OPTIONS it should choose options route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = "OPTIONS";
      await routes.handler(params.request, params.response);

      expect(params.response.writeHead).toHaveBeenCalledWith(204);
      expect(params.response.end).toHaveBeenCalled();
    });

    test("given method POST it should choose post route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = "POST";
      jest.spyOn(routes, "post").mockResolvedValue();

      await routes.handler(params.request, params.response);
      expect(routes.post).toHaveBeenCalled();
    });

    test("given method GET it should choose get route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = "GET";
      jest.spyOn(routes, "get").mockResolvedValue();
      await routes.handler(params.request, params.response);

      expect(routes.get).toHaveBeenCalled();
    });
  });

  describe("get", () => {
    test("given method GET it should list all files downloaded", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };
      const filesStatusesMock = [
        {
          size: "25.9 kB",
          lastModified: "2022-02-20T02:31:58.561Z",
          owner: "carloshkruger",
          file: "file.txt",
        },
      ];

      jest
        .spyOn(routes.fileHelper, "getFilesStatus")
        .mockResolvedValue(filesStatusesMock);

      params.request.method = "GET";
      await routes.handler(params.request, params.response);
      expect(params.response.writeHead).toHaveBeenCalledWith(200);
      expect(params.response.end).toHaveBeenCalledWith(
        JSON.stringify(filesStatusesMock)
      );
    });
  });

  describe("post", () => {
    test("it should validate post route workflow", async () => {
      const routes = new Routes("/tmp");
      const params = {
        ...defaultParams,
      };
      params.request.method = "POST";
      params.request.url = "?socketId=10";

      jest
        .spyOn(UploadHandler.prototype, "registerEvents")
        .mockImplementation((headers, onFinish) => {
          const writable = TestUtil.generateWritableStream(() => {});
          writable.on("finish", onFinish);
          return writable;
        });

      await routes.handler(params.request, params.response);

      expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled();
      expect(params.response.writeHead).toHaveBeenCalledWith(200);
      expect(defaultParams.response.end).toHaveBeenCalledWith(
        JSON.stringify({ result: "Files uploaded with success" })
      );
    });
  });
});
