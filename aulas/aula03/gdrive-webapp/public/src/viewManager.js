export default class ViewManager {
  constructor() {
    this.tbody = document.getElementById("tbody");
    this.newFileBtn = document.getElementById("newFileBtn");
    this.fileElem = document.getElementById("fileElem");
    this.progressModal = document.getElementById("progress-modal");
    this.progressBar = document.getElementById("progress-bar");
    this.output = document.getElementById("output");

    this.dateFormatter = new Intl.DateTimeFormat("pt", {
      locale: "pt-br",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    this.modalInstance = {};
  }

  configureModal() {
    this.modalInstance = M.Modal.init(this.progressModal, {
      opacity: 0,
      dismissable: false,
      onOpenEnd() {
        this.$overlay[0].remove();
      },
    });
  }

  openModal() {
    this.modalInstance.open();
  }

  closeModal() {
    this.modalInstance.close();
  }

  updateStatus(size) {
    this.output.innerHTML = `Uploading in <b>${Math.floor(size)}%</b>`;
    this.progressBar.value = size;
  }

  configureOnFileChange(fn) {
    this.fileElem.addEventListener("change", (e) => {
      fn(e.target.files);
    });
  }

  configureFileBtnClick() {
    this.newFileBtn.addEventListener("click", () => {
      this.fileElem.click();
    });
  }

  getIcon(file) {
    if (file.match(/\.mp4/i)) {
      return "movie";
    }

    if (file.match(/\.jp|png/i)) {
      return "image";
    }

    return "content_copy";
  }

  makeIcon(file) {
    const icon = this.getIcon(file);
    const colors = {
      image: "yellow600",
      movie: "red600",
      content_copy: "",
    };

    return `<i class="material-icons ${colors[icon]} left">${icon}</i>`;
  }

  updateCurrentFiles(files) {
    const template = (item) => `
      <tr>
        <td>${this.makeIcon(item.file)} ${item.file}</td>
        <td>${item.owner}</td>
        <td>${this.dateFormatter.format(new Date(item.lastModified))}</td>
        <td>${item.size}</td>
      </tr>
    `;

    this.tbody.innerHTML = files.map(template).join("");
  }
}
