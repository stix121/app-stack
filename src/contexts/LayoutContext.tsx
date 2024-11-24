import React from "react";

import { LAYOUT } from "../constants";

const initialState = {
  layout: LAYOUT.FLUID,
  setLayout: (layout: string) => {},
};

const LayoutContext = React.createContext(initialState);

export default LayoutContext;
