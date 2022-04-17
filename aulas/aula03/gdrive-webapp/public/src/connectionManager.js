export default class ConnectionManager {
  constructor({ apiUrl }) {
    this.apiUrl = apiUrl;

    this.ioClient = io.connect(apiUrl, {
      withCredentials: false,
    });
    this.socketId = "";
  }

  configureEvents({ onProgress }) {
    this.ioClient.on("connect", this.onConnect.bind(this));
    this.ioClient.on("file-upload", onProgress);
  }

  onConnect(msg) {
    console.log("connected", this.ioClient.id);
    this.socketId = this.ioClient.id;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append("files", file);

    const response = await fetch(`${this.apiUrl}?socketId=${this.socketId}`, {
      method: "POST",
      body: formData,
    });

    return response.json();
  }

  async currentFiles() {
    const response = await fetch(this.apiUrl);
    const files = await response.json();

    return files;
  }
}
