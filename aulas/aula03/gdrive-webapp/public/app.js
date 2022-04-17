import DragAndDropManager from "./src/dragAndDropManager.js";
import AppController from "./src/appController.js";
import ConnectionManager from "./src/connectionManager.js";
import ViewManager from "./src/viewManager.js";

const API_URL = "https://0.0.0.0:3000";

const connectionManager = new ConnectionManager({ apiUrl: API_URL });
const viewManager = new ViewManager();
const dragAndDropManager = new DragAndDropManager();
const appController = new AppController({
  connectionManager,
  viewManager,
  dragAndDropManager,
});

try {
  await appController.initialize();
} catch {}
