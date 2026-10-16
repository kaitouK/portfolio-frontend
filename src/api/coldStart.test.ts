import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  isColdStartError,
  createBackendWaiter,
  beginRequest,
  getWaking,
  subscribeWaking,
  SLOW_REQUEST_MS,
} from "./coldStart";

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

const errorWithCode = (code: string) => new AxiosError("error", code, config);

const errorWithStatus = (status: number) =>
  new AxiosError("error", AxiosError.ERR_BAD_RESPONSE, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data: null,
  } as AxiosResponse);

describe("isColdStartError", () => {
  it.each(["ECONNABORTED", "ETIMEDOUT", "ERR_NETWORK"])(
    "沒有 response 且 code 為 %s 時視為冷啟動",
    (code) => {
      expect(isColdStartError(errorWithCode(code))).toBe(true);
    },
  );

  it("請求被取消時不視為冷啟動", () => {
    expect(isColdStartError(errorWithCode("ERR_CANCELED"))).toBe(false);
  });

  it.each([502, 503, 504])("status %i 視為冷啟動", (status) => {
    expect(isColdStartError(errorWithStatus(status))).toBe(true);
  });

  it.each([400, 401, 404, 500])("status %i 不視為冷啟動", (status) => {
    expect(isColdStartError(errorWithStatus(status))).toBe(false);
  });

  it("非 axios 錯誤不視為冷啟動", () => {
    expect(isColdStartError(new Error("boom"))).toBe(false);
    expect(isColdStartError(undefined)).toBe(false);
  });
});

describe("createBackendWaiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("探測失敗幾次後成功，回傳 true 並結束喚醒狀態", async () => {
    const probe = vi
      .fn()
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue("Healthy");
    const { waitForBackend } = createBackendWaiter({
      probe,
      intervalMs: 3000,
      deadlineMs: 120000,
    });

    const result = waitForBackend();
    expect(getWaking()).toBe(true);

    await vi.advanceTimersByTimeAsync(6000);
    await expect(result).resolves.toBe(true);
    expect(probe).toHaveBeenCalledTimes(3);
    expect(getWaking()).toBe(false);
  });

  it("超過期限仍未回應時回傳 false", async () => {
    const probe = vi.fn().mockRejectedValue(new Error());
    const { waitForBackend } = createBackendWaiter({
      probe,
      intervalMs: 3000,
      deadlineMs: 10000,
    });

    const result = waitForBackend();
    await vi.advanceTimersByTimeAsync(10000);
    await expect(result).resolves.toBe(false);
    expect(probe).toHaveBeenCalledTimes(4); // 0、3、6、9 秒各一次
    expect(getWaking()).toBe(false);
  });

  it("同時間多次呼叫共用同一個 Promise，結束後才會重新探測", async () => {
    const probe = vi.fn().mockResolvedValue("Healthy");
    const { waitForBackend } = createBackendWaiter({
      probe,
      intervalMs: 3000,
      deadlineMs: 120000,
    });

    const first = waitForBackend();
    expect(waitForBackend()).toBe(first);
    await first;
    expect(probe).toHaveBeenCalledTimes(1);

    const second = waitForBackend();
    expect(second).not.toBe(first);
    await second;
    expect(probe).toHaveBeenCalledTimes(2);
  });

  it("waitIfWaking 在喚醒中會等到結束，閒置時立刻返回", async () => {
    const probe = vi
      .fn()
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue("Healthy");
    const { waitForBackend, waitIfWaking } = createBackendWaiter({
      probe,
      intervalMs: 3000,
      deadlineMs: 120000,
    });

    await expect(waitIfWaking()).resolves.toBeUndefined();

    const wait = waitForBackend();
    let done = false;
    void waitIfWaking().then(() => {
      done = true;
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(false);

    await vi.advanceTimersByTimeAsync(3000);
    await wait;
    expect(done).toBe(true);
  });
});

describe("beginRequest", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("快速完成的請求不會進入喚醒狀態", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeWaking(listener);

    const end = beginRequest();
    vi.advanceTimersByTime(SLOW_REQUEST_MS - 1);
    end();
    vi.advanceTimersByTime(SLOW_REQUEST_MS);

    expect(getWaking()).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("超過門檻進入喚醒狀態，所有慢請求結束才恢復", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeWaking(listener);

    const endFirst = beginRequest();
    const endSecond = beginRequest();
    vi.advanceTimersByTime(SLOW_REQUEST_MS);
    expect(getWaking()).toBe(true);

    endFirst();
    endFirst(); // 重複呼叫無副作用
    expect(getWaking()).toBe(true);

    endSecond();
    expect(getWaking()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2); // 進入一次、恢復一次
    unsubscribe();
  });
});
