"use client";

import { useRef, useState } from "react";
import { getApiErrorMessage } from "./api";

type Options<TData, TVars> = {
  onSuccess?: (data: TData, vars: TVars) => void;
  onError?: (err: unknown, vars: TVars) => void;
  onSettled?: (data: TData | undefined, err: unknown, vars: TVars) => void;
  successMessage?: string;
  errorMessage?: string;
};

export function useMutation<TData = any, TVars = void>(
  mutationFn: (vars: TVars) => Promise<TData>,
  options: Options<TData, TVars> = {}
) {
  const [data, setData] = useState<TData | undefined>();
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const isExecuting = useRef(false);

  async function mutate(vars: TVars) {
    if (isExecuting.current) return;
    isExecuting.current = true;
    setIsLoading(true);
    setIsError(false);
    setIsSuccess(false);
    try {
      const result = await mutationFn(vars);
      setData(result);
      setIsSuccess(true);
      options.onSuccess?.(result, vars);
      options.onSettled?.(result, undefined, vars);
      return result;
    } catch (err) {
      setError(err);
      setIsError(true);
      options.onError?.(err, vars);
      options.onSettled?.(undefined, err, vars);
      throw err;
    } finally {
      setIsLoading(false);
      isExecuting.current = false;
    }
  }

  function reset() {
    setData(undefined);
    setError(null);
    setIsError(false);
    setIsSuccess(false);
  }

  return { mutate, data, error, isLoading, isError, isSuccess, reset };
}

export function useApiMutation<TData = any, TVars = void>(
  apiCall: (vars: TVars) => Promise<{ data: TData }>,
  options: Options<TData, TVars> = {}
) {
  return useMutation<TData, TVars>(async (vars) => {
    const r = await apiCall(vars);
    return r.data;
  }, options);
}
