"use strict";

import Sylvie from "./database/sylvie";

// If there is a browser window, add Sylvie to the window object
// Alias Sylvie to loki for backwards compatibility
if (typeof window !== "undefined") {
  Object.assign(window, { loki: Sylvie, Sylvie: Sylvie });
}

export default Sylvie;
