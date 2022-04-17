import { beforeEach, describe, test, expect, jest } from "@jest/globals";
import fs from "fs";
import { pipeline } from "stream/promises";
import { resolve } from "path";
import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";
import { logger } from "../../src/logger.js";

describe("UploadHandler", () => {
  const ioObj = {
    to: () => ioObj,
    emit: () => {},
  };

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });

  describe("registerEvents", () => {
    test("should call onFile and onFinish functions on busboy instance", () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: "123",
      });

      jest.spyOn(uploadHandler, "onFile").mockResolvedValue();

      const headers = {
        "content-type": "multipart/form-data; boundary=",
      };

      const onFinish = jest.fn();

      const busboyInstance = uploadHandler.registerEvents(headers, onFinish);
      const fileStream = TestUtil.generateReadableStream([
        "chunk",
        "of",
        "data",
      ]);

      busboyInstance.emit("file", "fieldname", fileStream, "filename.txt");
      busboyInstance.listeners("finish")[0].call();

      expect(uploadHandler.onFile).toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalled();
    });
  });

  describe("onFile", () => {
    test("given a stream file it should save it on disk", async () => {
      const chunks = ["hey", "dude"];
      const downloadsFolder = "/tmp";
      const handler = new UploadHandler({
        io: ioObj,
        socketId: "123",
        downloadsFolder,
      });

      const onData = jest.fn();
      const onTransform = jest.fn();

      jest
        .spyOn(fs, "createWriteStream")
        .mockImplementation(() => TestUtil.generateWritableStream(onData));
      jest
        .spyOn(handler, "handleFileBytes")
        .mockImplementation(() =>
          TestUtil.generateTransformStream(onTransform)
        );

      const params = {
        fieldname: "video",
        file: TestUtil.generateReadableStream(chunks),
        filename: "mockfile.mov",
      };

      await handler.onFile(...Object.values(params));

      expect(onData.mock.calls.join()).toEqual(chunks.join());
      expect(onTransform.mock.calls.join()).toEqual(chunks.join());

      const expectedFileName = resolve(
        handler.downloadsFolder,
        params.filename
      );
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFileName);
    });
  });

  describe("handlerFileBytes", () => {
    test("should call emit function and it is a transform stream", async () => {
      jest.spyOn(ioObj, "to");
      jest.spyOn(ioObj, "emit");

      const handler = new UploadHandler({
        io: ioObj,
        socketId: "123",
      });

      jest.spyOn(handler, "canExecute").mockReturnValue(true);

      const messages = ["hello"];
      const source = TestUtil.generateReadableStream(messages);
      const onWrite = jest.fn();
      const target = TestUtil.generateWritableStream(onWrite);

      await pipeline(source, handler.handleFileBytes("filename.txt"), target);

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length);
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length);

      expect(onWrite).toBeCalledWith(messages[0]);
      expect(onWrite.mock.calls.join()).toEqual(messages.join());
    });

    test("given message timer delay as 2s it should emit only two messages during 2 seconds period", async () => {
      jest.spyOn(ioObj, "emit");

      const day = "2021-07-01 01:01";
      const onInitVariable = TestUtil.getTimeFromDate(`${day}:00`);
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`);
      const onSecondUpdateLastMessageSent = onFirstCanExecute;
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`);
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`);

      TestUtil.mockDateNow([
        onInitVariable,
        onFirstCanExecute,
        onSecondUpdateLastMessageSent,
        onSecondCanExecute,
        onThirdCanExecute,
      ]);

      const handler = new UploadHandler({
        io: ioObj,
        socketId: "123",
        messageTimeDelay: 2000,
      });

      const filename = "filename.avi";
      const messages = ["hello", "hello", "world"];
      const source = TestUtil.generateReadableStream(messages);

      await pipeline(source, handler.handleFileBytes(filename));

      expect(ioObj.emit).toHaveBeenCalledTimes(2);
      const [firsCallResult, secondCallResult] = ioObj.emit.mock.calls;
      expect(firsCallResult).toEqual([
        handler.ON_UPLOAD_EVENT,
        { processedAlready: "hello".length, filename: "filename.avi" },
      ]);
      expect(secondCallResult).toEqual([
        handler.ON_UPLOAD_EVENT,
        { processedAlready: messages.join("").length, filename },
      ]);
    });
  });

  describe("canExecute", () => {
    test("should return true when time is later than specified delay", () => {
      const tickNow = TestUtil.getTimeFromDate("2021-07-01 00:00:03");
      const lastExecution = TestUtil.getTimeFromDate("2021-07-01 00:00:00");
      const timerDelay = 1000;
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: "",
        messageTimeDelay: timerDelay,
      });

      TestUtil.mockDateNow([tickNow]);

      const result = uploadHandler.canExecute(lastExecution);
      expect(result).toBeTruthy();
    });

    test("should return false when time is not later than specified delay", () => {
      const tickNow = TestUtil.getTimeFromDate("2021-07-01 00:00:01");
      const lastExecution = TestUtil.getTimeFromDate("2021-07-01 00:00:00");
      const timerDelay = 3000;
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: "",
        messageTimeDelay: timerDelay,
      });

      TestUtil.mockDateNow([tickNow]);

      const result = uploadHandler.canExecute(lastExecution);
      expect(result).toBeFalsy();
    });
  });
});
