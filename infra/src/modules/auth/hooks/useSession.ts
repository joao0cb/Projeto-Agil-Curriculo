import React from "react";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export function useSession() {
  const [status, setStatus] = React.useState<SessionStatus>("loading");
  // TODO: conectar com Convex Auth quando disponível
  React.useEffect(() => {
    setStatus("unauthenticated");
  }, []);
  return { status };
}
