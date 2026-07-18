// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SavedFlowersDialog } from "@/components/saved-flowers-dialog";
import { selectFlowerSettings } from "@/lib/flower-design";
import { useFlowerStore } from "@/lib/flower-store";

const initialState = useFlowerStore.getState();
const id = "d7879e45-6134-4b27-934c-99f58cd10948";
const summary = {
  id,
  name: "My cosmos",
  preset: "Cosmos",
  renderMode: "line",
  seed: 77,
  createdAt: "2026-07-17T12:00:00.000Z",
  updatedAt: "2026-07-17T12:00:00.000Z",
};

describe("SavedFlowersDialog", () => {
  beforeEach(() => {
    useFlowerStore.setState(initialState, true);
    vi.restoreAllMocks();
  });

  it("lists saved flowers and loads the selected design", async () => {
    const settings = {
      ...selectFlowerSettings(initialState),
      renderMode: "line" as const,
      petalCount: 27,
      seed: 77,
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ flowers: [summary] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ flower: { ...summary, settings } }),
        }),
    );
    const user = userEvent.setup();
    render(<SavedFlowersDialog />);

    await user.click(screen.getByRole("button", { name: "Saved flowers" }));
    expect(await screen.findByText("My cosmos")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Load" }));

    expect(fetch).toHaveBeenNthCalledWith(1, "/api/flowers");
    expect(fetch).toHaveBeenNthCalledWith(2, `/api/flowers/${id}`);
    expect(useFlowerStore.getState()).toMatchObject({
      renderMode: "line",
      petalCount: 27,
      seed: 77,
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an empty collection", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ flowers: [] }) }),
    );
    const user = userEvent.setup();
    render(<SavedFlowersDialog />);
    await user.click(screen.getByRole("button", { name: "Saved flowers" }));
    expect(await screen.findByText(/No saved flowers yet/)).toBeVisible();
  });
});
