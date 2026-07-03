import { populateContractRouterPaths } from "@orpc/contract";

import { cargoContract } from "./cargo.contract.js";

export const contracts = populateContractRouterPaths({
  cargo: cargoContract.cargo,
});

export type Contracts = typeof contracts;
