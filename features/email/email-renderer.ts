import type { ReactElement } from "react";
import { render } from "@react-email/render";

export async function renderEmail(element: ReactElement) {
  return render(element);
}
