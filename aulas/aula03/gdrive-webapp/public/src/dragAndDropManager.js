export default class DragAndDropManager {
  constructor() {
    this.dropArea = document.getElementById("drop-area");
  }

  initialize({ onDropHandler }) {
    this.onDropHandler = onDropHandler;
    this.disableDragAndDropEvents();
    this.enableHighLightOnDrag();
    this.enableDrop();
  }

  disableDragAndDropEvents() {
    const events = ["dragenter", "dragover", "dragleave", "drop"];

    const preventDefaults = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    events.forEach((eventName) => {
      this.dropArea.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });
  }

  enableHighLightOnDrag() {
    const events = ["dragenter", "dragover"];
    const highLight = (e) => {
      this.dropArea.classList.add("highlight");
      this.dropArea.classList.add("drop-area");
    };
    events.forEach((eventName) => {
      this.dropArea.addEventListener(eventName, highLight, false);
    });
  }

  enableDrop(event) {
    const drop = (event) => {
      this.dropArea.classList.remove("drop-area");
      const files = event.dataTransfer.files;
      return this.onDropHandler(files);
    };

    this.dropArea.addEventListener("drop", drop, false);
  }
}
