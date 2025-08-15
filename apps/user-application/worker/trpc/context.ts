export async function createContext({
  req,
  env,
  workerCtx,
  userId
}: {
  req: Request;
  env: ServiceBindings;
  workerCtx: ExecutionContext;
  userId: string
}) {
  return {
    req,
    env,
    workerCtx,
    userInfo: {
      userId: userId,
    },
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
