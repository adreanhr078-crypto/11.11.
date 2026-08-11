export interface Glicko2Rating {
  rating: number;
  deviation: number;
  volatility: number;
  gamesPlayed: number;
}

export interface Glicko2Opponent {
  rating: number;
  deviation: number;
  score: 0 | 0.5 | 1;
}

const SCALE = 173.7178;
const DEFAULT_TAU = 0.5;
const CONVERGENCE = 0.000001;

const g = (phi: number) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
const expectation = (mu: number, opponentMu: number, opponentPhi: number) => (
  1 / (1 + Math.exp(-g(opponentPhi) * (mu - opponentMu)))
);

function nextVolatility(
  phi: number,
  volatility: number,
  variance: number,
  delta: number,
  tau: number,
): number {
  const a = Math.log(volatility * volatility);
  const f = (x: number) => {
    const exponential = Math.exp(x);
    const numerator = exponential * (delta * delta - phi * phi - variance - exponential);
    const denominator = 2 * Math.pow(phi * phi + variance + exponential, 2);
    return numerator / denominator - (x - a) / (tau * tau);
  };

  let lower = a;
  let upper: number;
  if (delta * delta > phi * phi + variance) {
    upper = Math.log(delta * delta - phi * phi - variance);
  } else {
    let multiplier = 1;
    upper = a - multiplier * tau;
    while (f(upper) < 0) {
      multiplier += 1;
      upper = a - multiplier * tau;
    }
  }
  let fLower = f(lower);
  let fUpper = f(upper);
  while (Math.abs(upper - lower) > CONVERGENCE) {
    const candidate = lower + ((lower - upper) * fLower) / (fUpper - fLower);
    const fCandidate = f(candidate);
    if (fCandidate * fUpper < 0) {
      lower = upper;
      fLower = fUpper;
    } else {
      fLower /= 2;
    }
    upper = candidate;
    fUpper = fCandidate;
  }
  return Math.exp(lower / 2);
}

export function updateGlicko2(
  player: Glicko2Rating,
  opponents: readonly Glicko2Opponent[],
  tau = DEFAULT_TAU,
): Glicko2Rating {
  if (!Number.isFinite(tau) || tau <= 0) throw new Error('Glicko-2 tau must be positive.');
  const mu = (player.rating - 1500) / SCALE;
  const phi = player.deviation / SCALE;
  const volatility = player.volatility;
  if (opponents.length === 0) {
    return {
      ...player,
      deviation: Math.min(350, SCALE * Math.sqrt(phi * phi + volatility * volatility)),
    };
  }

  const normalized = opponents.map((opponent) => ({
    mu: (opponent.rating - 1500) / SCALE,
    phi: opponent.deviation / SCALE,
    score: opponent.score,
  }));
  const inverseVariance = normalized.reduce((total, opponent) => {
    const expected = expectation(mu, opponent.mu, opponent.phi);
    const weight = g(opponent.phi);
    return total + weight * weight * expected * (1 - expected);
  }, 0);
  if (inverseVariance <= 0) throw new Error('Glicko-2 variance is invalid.');
  const variance = 1 / inverseVariance;
  const improvement = normalized.reduce((total, opponent) => {
    return total + g(opponent.phi)
      * (opponent.score - expectation(mu, opponent.mu, opponent.phi));
  }, 0);
  const delta = variance * improvement;
  const updatedVolatility = nextVolatility(phi, volatility, variance, delta, tau);
  const preRatingPhi = Math.sqrt(phi * phi + updatedVolatility * updatedVolatility);
  const updatedPhi = 1 / Math.sqrt((1 / (preRatingPhi * preRatingPhi)) + (1 / variance));
  const updatedMu = mu + updatedPhi * updatedPhi * improvement;

  return {
    rating: 1500 + SCALE * updatedMu,
    deviation: Math.max(30, Math.min(350, SCALE * updatedPhi)),
    volatility: updatedVolatility,
    gamesPlayed: player.gamesPlayed + opponents.length,
  };
}

export const DEFAULT_GLICKO2_RATING: Readonly<Glicko2Rating> = Object.freeze({
  rating: 1500,
  deviation: 350,
  volatility: 0.06,
  gamesPlayed: 0,
});
