import React from "react";
import { createRoot } from "react-dom/client";
import Section232SearchApp from "./Section232SearchApp";

const mount = document.getElementById("section232-root");
if (mount) {
  createRoot(mount).render(<Section232SearchApp />);
}