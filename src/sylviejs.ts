/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-prototype-builtins */

"use strict";

import Sylvie from "./modules/sylvie";

export const hasOwnProperty = Object.prototype.hasOwnProperty;

if (typeof window !== "undefined") {
  Object.assign(window, { loki: Sylvie, Sylvie: Sylvie });
}

export default Sylvie;
