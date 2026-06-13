import { useEffect, useState } from "react";
import {
  getPwaStatus,
  subscribePwaStatus,
  type PwaStatusSnapshot,
} from "./registerServiceWorker";

export function usePwaStatus(): PwaStatusSnapshot {
  const [status, setStatus] = useState(getPwaStatus);

  useEffect(() => subscribePwaStatus(setStatus), []);

  return status;
}
