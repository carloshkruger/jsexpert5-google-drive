import { jest } from "@jest/globals";
import { Readable, Transform, Writable } from "stream";

export default class TestUtil {
  static getTimeFromDate(dateString) {
    return new Date(dateString).getTime();
  }

  static mockDateNow(mockImplementationPeriods) {
    const now = jest.spyOn(global.Date, "now");

    mockImplementationPeriods.forEach((time) => now.mockReturnValueOnce(time));
  }

  static generateReadableStream(data) {
    return new Readable({
      objectMode: true,
      read() {
        for (const item of data) {
          this.push(item);
        }
        this.push(null);
      },
    });
  }

  static generateWritableStream(fn) {
    return new Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        fn(chunk);

        callback(null, chunk);
      },
    });
  }

  static generateTransformStream(onData) {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        onData(chunk);

        callback(null, chunk);
      },
    });
  }
}
