import {
  PlayerApiError,
  type PlayerApiEnv,
} from './_shared';

export interface PlayerDatabaseResult<T = unknown> {
  results?: T[];
  success?: boolean;
  meta?: {
    changes?: number;
  };
}

export interface PlayerDatabaseStatement {
  bind: (...values: unknown[]) => PlayerDatabaseStatement;
  first: <T = unknown>() => Promise<T | null>;
  all: <T = unknown>() => Promise<PlayerDatabaseResult<T>>;
  run: <T = unknown>() => Promise<PlayerDatabaseResult<T>>;
}

export interface PlayerDatabase {
  prepare: (query: string) => PlayerDatabaseStatement;
  batch: <T = unknown>(
    statements: PlayerDatabaseStatement[],
  ) => Promise<PlayerDatabaseResult<T>[]>;
}

export function requirePlayerDatabase(env: PlayerApiEnv): PlayerDatabase {
  if (!env.PLAYER_DB) {
    throw new PlayerApiError(
      503,
      'leaderboard_not_configured',
      'Global progression services are not configured.',
    );
  }
  return env.PLAYER_DB;
}
