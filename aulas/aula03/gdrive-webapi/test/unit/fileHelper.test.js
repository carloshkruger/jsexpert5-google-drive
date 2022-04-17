import { describe, test, expect, jest } from "@jest/globals";
import fs from "fs";
import FileHelper from "../../src/fileHelper.js";

describe("FileHelper", () => {
  describe("getFilesStatus", () => {
    test("it should return files statuses in correct format", async () => {
      const statMock = {
        dev: 2051,
        mode: 33204,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 12633030,
        size: 25906,
        blocks: 56,
        atimeMs: 1645324318561.224,
        mtimeMs: 1645324318581.2246,
        ctimeMs: 1645324320193.265,
        birthtimeMs: 1645324318561.224,
        atime: "2022-02-20T02:31:58.561Z",
        mtime: "2022-02-20T02:31:58.581Z",
        ctime: "2022-02-20T02:32:00.193Z",
        birthtime: "2022-02-20T02:31:58.561Z",
      };

      const mockUser = "carloshkruger";
      process.env.USER = mockUser;

      const filename = "file.png";

      jest.spyOn(fs.promises, "readdir").mockResolvedValue([filename]);
      jest.spyOn(fs.promises, "stat").mockResolvedValue(statMock);

      const result = await FileHelper.getFilesStatus("/tmp");

      const expectedResult = [
        {
          size: "25.9 kB",
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: filename,
        },
      ];

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`);
      expect(result).toMatchObject(expectedResult);
    });
  });
});
